import { useState, useEffect, useRef, useCallback } from "react";
import { getReadOnlyContract, ROLES } from "../utils/contract.js";
import { shortAddress } from "../utils/format.js";
import { ethers } from "ethers";

const MAX_EVENTS = 50;
const CHUNK = 9;               // Alchemy free tier: max 10-block range per eth_getLogs call
const FALLBACK_MAX_CHUNKS = 20; // bounded backward scan, only used when binary search fails
const REQUEST_DELAY = 250;     // ms between getLogs requests
const BSEARCH_DELAY = 60;      // ms between binary-search steps (getBlock / eth_call are cheap)
const DEPLOY_BLOCK = 41487461; // floor — never scan earlier than this
const CACHE_KEY = "ecg_audit_log_cache_v2"; // bumped: older cache entries predate the ipfsHash/CorrectionExecuted/locked fixes
const MAX_CORRECTIONS_SCAN = 500; // correction IDs are sequential from 0

// RETURNING_OFFICER_ROLE / SENIOR_EC_OFFICER_ROLE are `public constant` on
// ElectionCollation.sol itself (not on IElectionCollation), so their
// auto-generated getters aren't in the frontend's hand-written ABI —
// contract.RETURNING_OFFICER_ROLE() is "not a function" even though
// hasRole() works fine. Reuse the hashes contract.js already computes
// locally (ROLES.RETURNING / ROLES.SENIOR) instead of calling that getter
// or re-deriving the hash a second time here.

const STATUS_LABEL = {
  0: null,               // Pending — the submission itself is the event
  1: "confirmed",
  2: "flagged",
  3: "corrected",
};

// The on-chain status value each enrichable event type corresponds to.
const STATUS_OF_TYPE = { confirmed: 1, flagged: 2, corrected: 3 };

// Maps our internal "type" key to (eventName, indexedFieldGetter).
// The indexed field is what got hashed into the log's topic — we compute
// the same hash from data we already know (the baseline) to find the match,
// since a hashed indexed *string* cannot be reversed from the log itself.
const EVENT_LOOKUP = {
  submit:    { eventName: "ResultSubmitted",    indexedFrom: (stationId) => stationId },
  confirmed: { eventName: "ResultConfirmed",    indexedFrom: (stationId) => stationId },
  flagged:   { eventName: "ResultFlagged",      indexedFrom: (stationId) => stationId },
  // NOTE: CorrectionExecuted's `stationId` param is `string indexed` too —
  // handled as a special case in findLog (matched via topic2), see
  // isCorrectionExecuted below, not through this generic table.
  corrected: { eventName: "CorrectionExecuted", indexedFrom: (stationId) => stationId },
  locked:    { eventName: "ConstituencyLocked", indexedFrom: (constituencyName) => constituencyName },
  // CorrectionApproved indexes correctionId (uint256), not a string —
  // handled as a special case in findLog, see isApprovalEvent below.
  corrApprovedRO:      { eventName: "CorrectionApproved", indexedFrom: null },
  corrApprovedSenior:  { eventName: "CorrectionApproved", indexedFrom: null },
};

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function withRetry(fn, tries = 3) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try { return await fn(); }
    catch (err) { lastErr = err; await sleep(500 * (i + 1)); }
  }
  throw lastErr;
}

// ── localStorage cache ──────────────────────────────────────────────────
// Mined events are immutable, so once a (type, station, timestamp) tuple
// has been resolved to a tx hash it never needs to be looked up again.
function loadCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY)) || {}; }
  catch { return {}; }
}
function saveCache(cache) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); }
  catch { /* storage full / unavailable — lookups just repeat next load */ }
}

// ── Block location via binary search ────────────────────────────────────
// Solidity's block.timestamp IS the mined block's timestamp, so the first
// block with timestamp >= submittedAt is exactly the block containing the
// submission tx. ~log2(range) getBlock calls instead of thousands of scans.
async function blockAtTimestamp(provider, ts, latest) {
  let lo = DEPLOY_BLOCK, hi = latest;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    const b = await withRetry(() => provider.getBlock(mid));
    if (!b) throw new Error(`Block ${mid} unavailable`);
    if (b.timestamp < ts) lo = mid + 1; else hi = mid;
    await sleep(BSEARCH_DELAY);
  }
  return lo;
}

// First block in [lo, hi] where predicate(block) is true. The predicate
// must be monotone (false...false, true...true) across the range.
async function firstBlockWhere(lo, hi, predicate) {
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    const ok = await withRetry(() => predicate(mid));
    if (ok) hi = mid; else lo = mid + 1;
    await sleep(BSEARCH_DELAY);
  }
  return lo;
}

export function useEvents() {
  const [events,  setEvents]  = useState([]);
  const [loading, setLoading] = useState(true);
  const lastBlockRef = useRef(0);
  const initialRanOnce = useRef(false);

  // ── Baseline: reconstruct current state from live contract data ────────
  // Works instantly regardless of how old an event is, since it reads
  // current state rather than depending on log range limits.
  const buildBaseline = useCallback(async (contract) => {
    const ids = await contract.getAllStationIds();
    const results = await Promise.all(ids.map(id => contract.getResult(id)));
    const items = [];
    const seen = new Set();

    const push = (item, key) => {
      if (seen.has(key)) return;
      seen.add(key);
      items.push(item);
    };

    for (const r of results) {
      const status = Number(r.status);

      push({
        key: `submit-${r.stationId}`,
        lookupType: "submit",
        stationId: r.stationId,
        type: "ResultSubmitted", style: "green",
        text: `${r.stationId} result submitted`,
        officer: shortAddress(r.submittedBy),
        ipfsHash: r.ipfsHash,
        blockNumber: 0, // filled in by targeted lookup below
        txHash: null,
        timestamp: Number(r.submittedAt),
      }, `submit-${r.stationId}`);

      const label = STATUS_LABEL[status];
      if (label) {
        // A station currently CORRECTED necessarily passed through FLAGGED
        // first — reconstruct that historical event even though it's no
        // longer the current status (getResult only reports current state).
        if (status === 3) {
          push({
            key: `flagged-${r.stationId}`,
            lookupType: "flagged",
            stationId: r.stationId,
            type: "ResultFlagged",
            style: "flag",
            text: `${r.stationId} flagged`,
            officer: null, // resolved from the event log
            ipfsHash: null, // pre-correction Pink Sheet is no longer the current CID
            blockNumber: 0,
            txHash: null,
            timestamp: Number(r.submittedAt),
          }, `flagged-${r.stationId}`);
        }

        const lookupType = label === "confirmed" ? "confirmed" : label === "flagged" ? "flagged" : label === "corrected" ? "corrected" : null;
        push({
          key: `${label}-${r.stationId}`,
          lookupType,
          stationId: r.stationId,
          type: label === "confirmed" ? "ResultConfirmed" : label === "flagged" ? "ResultFlagged" : "CorrectionExecuted",
          style: label === "flagged" ? "flag" : "green",
          text: `${r.stationId} ${label}`,
          officer: null, // this actor is only knowable from the event log
          ipfsHash: r.ipfsHash, // same Pink Sheet the status refers to
          blockNumber: 0,
          txHash: null,
          timestamp: Number(r.submittedAt),
        }, `${label}-${r.stationId}`);
      }
    }

    // ── Reconstruct ConstituencyLocked rows ───────────────────────────────
    // Locking isn't reflected on the station result at all, only on the
    // constituency struct — read it directly the same way.
    const constNames = await contract.getAllConstituencies();
    const constData = await Promise.all(constNames.map(name => contract.getConstituency(name)));
    constNames.forEach((name, i) => {
      const cd = constData[i];
      if (cd.locked) {
        push({
          key: `locked-${name}`,
          lookupType: "locked",
          stationId: name, // reused as the display/lookup key for constituencies
          type: "ConstituencyLocked",
          style: "lock",
          text: `${name} constituency locked`,
          officer: shortAddress(cd.lockedBy), // available directly, no lookup needed
          ipfsHash: null,
          blockNumber: 0,
          txHash: null,
          timestamp: Number(cd.lockedAt),
        }, `locked-${name}`);
      }
    });

    // ── Reconstruct CorrectionApproved rows (both officers) ───────────────
    // Approver addresses aren't stored anywhere in state — only the two
    // roApproved/seniorApproved booleans are — so we still need the event
    // log for each, but we first need to find which correctionId belongs
    // to each corrected station by scanning getCorrection() sequentially.
    const correctedStations = results.filter(r => Number(r.status) === 3);
    if (correctedStations.length > 0) {
      const correctedIds = new Set(correctedStations.map(r => r.stationId));
      const foundFor = new Set();
      for (let id = 0; id < MAX_CORRECTIONS_SCAN && foundFor.size < correctedIds.size; id++) {
        let corr;
        try { corr = await contract.getCorrection(id); }
        catch { break; }
        if (Number(corr.requestedAt) === 0) break;
        if (!corr.executed) continue;
        if (!correctedIds.has(corr.stationId)) continue;

        foundFor.add(corr.stationId);

        push({
          key: `corrApprovedRO-${corr.stationId}`,
          lookupType: "corrApprovedRO",
          stationId: corr.stationId,
          type: "CorrectionApproved",
          style: "green",
          text: `${corr.stationId} correction approved (Returning Officer)`,
          officer: null,
          ipfsHash: corr.correctedIpfsHash, // the proposed doc this approval is signing off on
          blockNumber: 0,
          txHash: null,
          timestamp: Number(corr.requestedAt),
          correctionId: id,
        }, `corrApprovedRO-${corr.stationId}`);

        push({
          key: `corrApprovedSenior-${corr.stationId}`,
          lookupType: "corrApprovedSenior",
          stationId: corr.stationId,
          type: "CorrectionApproved",
          style: "green",
          text: `${corr.stationId} correction approved (Senior EC Officer)`,
          officer: null,
          ipfsHash: corr.correctedIpfsHash, // the proposed doc this approval is signing off on
          blockNumber: 0,
          txHash: null,
          timestamp: Number(corr.requestedAt),
          correctionId: id,
        }, `corrApprovedSenior-${corr.stationId}`);
      }
    }

    return items;
  }, []);

  // ── Targeted lookup: find the exact log for one known item ─────────────
  // Strategy per event type:
  //   submit/locked      → binary search block timestamps against the
  //                        known timestamp (submittedAt / lockedAt)
  //   confirmed/flagged/
  //   corrected          → binary search historical getResult() state
  //   corrApprovedRO/
  //   corrApprovedSenior → binary search historical getCorrection() state,
  //                        then getLogs by correctionId, disambiguated by
  //                        checking which role the approver's address holds
  const findLog = useCallback(async (contract, item, latest) => {
    const { eventName } = EVENT_LOOKUP[item.lookupType];
    const provider = contract.runner.provider;
    const address = await contract.getAddress();
    const topic0 = contract.interface.getEvent(eventName).topicHash;

    const isCorrectionExecuted = eventName === "CorrectionExecuted";
    const isApproval = eventName === "CorrectionApproved";

    // topic layout depends on the event's indexed fields:
    //   ResultSubmitted/Confirmed/Flagged, ConstituencyLocked
    //     → topic1 = keccak256(stationId/constituency)  (string indexed)
    //   CorrectionApproved(uint256 indexed correctionId, address indexed approvedBy, ...)
    //     → topic1 = correctionId, which we DO have
    //   CorrectionExecuted(uint256 indexed correctionId, string indexed stationId, ...)
    //     → correctionId (topic1) isn't known for "corrected" baseline items,
    //       but stationId (topic2) is — and since it's `string indexed`, the
    //       raw string never appears in the log, only keccak256(stationId).
    //       We match on topic2 directly rather than trying to parse it back
    //       out of the log (parseLog returns an unresolvable Indexed hash
    //       for indexed dynamic types, which can never equal item.stationId).
    let topic1 = null;
    let topic2 = null;
    if (isCorrectionExecuted) {
      topic2 = ethers.keccak256(ethers.toUtf8Bytes(item.stationId));
    } else if (isApproval) {
      topic1 = ethers.zeroPadValue(ethers.toBeHex(item.correctionId), 32);
    } else {
      const stationIdFn = EVENT_LOOKUP[item.lookupType].indexedFrom;
      topic1 = ethers.keccak256(ethers.toUtf8Bytes(stationIdFn(item.stationId)));
    }

    // 1. Locate the block containing the event via binary search.
    let candidate = null;
    try {
      if (item.lookupType === "submit" || item.lookupType === "locked") {
        candidate = await blockAtTimestamp(provider, item.timestamp, latest);
      } else if (
        item.lookupType === "confirmed" ||
        item.lookupType === "flagged"   ||
        item.lookupType === "corrected"
      ) {
        const targetStatus = STATUS_OF_TYPE[item.lookupType];
        const submitBlock  = await blockAtTimestamp(provider, item.timestamp, latest);
        candidate = await firstBlockWhere(submitBlock, latest, async (b) => {
          try {
            const r = await contract.getResult(item.stationId, { blockTag: b });
            return Number(r.status) === targetStatus;
          } catch (err) {
            if (err?.code === "CALL_EXCEPTION") return false;
            throw err;
          }
        });
      } else if (item.lookupType === "corrApprovedRO" || item.lookupType === "corrApprovedSenior") {
        const wantRO = item.lookupType === "corrApprovedRO";
        const startBlock = await blockAtTimestamp(provider, item.timestamp, latest);
        candidate = await firstBlockWhere(startBlock, latest, async (b) => {
          try {
            const corr = await contract.getCorrection(item.correctionId, { blockTag: b });
            return wantRO ? corr.roApproved : corr.seniorApproved;
          } catch (err) {
            if (err?.code === "CALL_EXCEPTION") return false;
            throw err;
          }
        });
      }
    } catch (err) {
      console.warn(`[useEvents] block location failed ${item.lookupType}-${item.stationId}:`, err);
      candidate = null;
    }

    // 2. Build getLogs windows (each <= 10 blocks for Alchemy free tier).
    const windows = [];
    if (candidate != null) {
      windows.push([Math.max(DEPLOY_BLOCK, candidate - 4), Math.min(latest, candidate + 5)]);
      windows.push([Math.max(DEPLOY_BLOCK, candidate - 14), Math.max(DEPLOY_BLOCK, candidate - 5)]);
      windows.push([Math.min(latest, candidate + 6), Math.min(latest, candidate + 15)]);
    } else {
      let cursor = latest;
      for (let i = 0; i < FALLBACK_MAX_CHUNKS && cursor >= DEPLOY_BLOCK; i++) {
        const from = Math.max(DEPLOY_BLOCK, cursor - CHUNK);
        windows.push([from, cursor]);
        cursor = from - 1;
      }
    }

    // Role hashes for approval disambiguation — shared with contract.js,
    // see ROLES import above.
    const roRoleHash = ROLES.RETURNING;
    const seniorRoleHash = ROLES.SENIOR;

    // 3. Pull, parse, and return the matching log.
    for (const [from, to] of windows) {
      if (from > to) continue;
      try {
        const topics = isCorrectionExecuted ? [topic0, null, topic2] : [topic0, topic1];
        const logs = await withRetry(() => provider.getLogs({
          address, fromBlock: from, toBlock: to, topics,
        }));

        let matchingLogs = logs;

        if (isApproval) {
          // Same correctionId can produce two logs (RO + Senior) — pick
          // the one whose signer actually holds the role we want.
          const wantRO = item.lookupType === "corrApprovedRO";
          const filtered = [];
          for (const l of logs) {
            try {
              const p = contract.interface.parseLog(l);
              const approver = p.args.approvedBy;
              const isRO = await contract.hasRole(roRoleHash, approver);
              const isSenior = await contract.hasRole(seniorRoleHash, approver);
              if (wantRO && isRO) filtered.push(l);
              if (!wantRO && isSenior && !isRO) filtered.push(l);
              // Dual-role wallets: if a wallet holds both, it can only ever
              // land in the RO branch on-chain (see approveCorrection), so
              // it is never the Senior approval — excluded above correctly.
            } catch { /* skip unparsable */ }
          }
          matchingLogs = filtered;
        }
        // isCorrectionExecuted needs no further filtering: topic0 + topic2
        // (keccak256 of the exact stationId) already uniquely identifies
        // the log — parsed.args.stationId can't be used for this since
        // indexed strings never round-trip back to plain text.

        if (matchingLogs.length === 0) { await sleep(REQUEST_DELAY); continue; }

        const log    = matchingLogs[matchingLogs.length - 1];
        const parsed = contract.interface.parseLog(log);
        return {
          blockNumber: log.blockNumber,
          txHash:      log.transactionHash,
          officer:
            eventName === "ResultSubmitted"    ? shortAddress(parsed.args.officer) :
            eventName === "ResultConfirmed"    ? shortAddress(parsed.args.returningOfficer) :
            eventName === "ResultFlagged"      ? shortAddress(parsed.args.flaggedBy) :
            eventName === "ConstituencyLocked" ? shortAddress(parsed.args.returningOfficer) :
            eventName === "CorrectionApproved" ? shortAddress(parsed.args.approvedBy) :
            null, // CorrectionExecuted has no actor field on-chain — expected null
          // Only ResultSubmitted carries an ipfsHash arg, and it's non-indexed
          // (unlike stationId), so it round-trips through parseLog just fine —
          // this is the ORIGINAL Pink Sheet, distinct from the current
          // (possibly corrected) one that getResult() would return.
          ipfsHash: eventName === "ResultSubmitted" ? parsed.args.ipfsHash : undefined,
          reason: eventName === "ResultFlagged" ? parsed.args.reason : undefined,
        };
      } catch (err) {
        console.warn(`[useEvents] getLogs [${from},${to}] failed:`, err.message);
      }
      await sleep(REQUEST_DELAY);
    }
    return null;
  }, []);

  // ── Live tail: small, always-safe range for brand-new activity ─────────
  const pollRecent = useCallback(async (contract, from, to) => {
    const provider = contract.runner.provider;
    const address = await contract.getAddress();
    const names = ["ResultSubmitted", "ResultConfirmed", "ResultFlagged", "CorrectionExecuted", "CorrectionApproved", "ConstituencyLocked"];
    const topicHashes = names.map(n => contract.interface.getEvent(n).topicHash);

    const logs = await provider.getLogs({
      address, fromBlock: from, toBlock: to,
      topics: [topicHashes],
    });

    if (logs.length === 0) return [];

    const ids = await contract.getAllStationIds();
    const results = await Promise.all(ids.map(id => contract.getResult(id)));
    const hashToStation = new Map(
      results.map(r => [ethers.keccak256(ethers.toUtf8Bytes(r.stationId)), r.stationId])
    );
    const idToIpfs = new Map(results.map(r => [r.stationId, r.ipfsHash]));
    const constNames = await contract.getAllConstituencies();
    const hashToConst = new Map(
      constNames.map(name => [ethers.keccak256(ethers.toUtf8Bytes(name)), name])
    );

    // Role hashes for approval disambiguation — shared with contract.js,
    // see ROLES import above.
    const roRoleHash = ROLES.RETURNING;
    const seniorRoleHash = ROLES.SENIOR;

    const items = [];
    for (const log of logs) {
      let parsed;
      try { parsed = contract.interface.parseLog(log); } catch { continue; }
      if (!parsed) continue;

      const base = { blockNumber: log.blockNumber, txHash: log.transactionHash };

      if (parsed.name === "ResultSubmitted") {
        const sid = hashToStation.get(log.topics[1]);
        if (!sid) continue;
        items.push({ ...base, type: "ResultSubmitted", style: "green", stationId: sid, lookupType: "submit",
          text: `${sid} result submitted`, officer: shortAddress(parsed.args.officer), ipfsHash: parsed.args.ipfsHash });
      } else if (parsed.name === "ResultConfirmed") {
        const sid = hashToStation.get(log.topics[1]);
        if (!sid) continue;
        items.push({ ...base, type: "ResultConfirmed", style: "green", stationId: sid, lookupType: "confirmed",
          text: `${sid} confirmed`, officer: shortAddress(parsed.args.returningOfficer),
          ipfsHash: idToIpfs.get(sid) });
      } else if (parsed.name === "ResultFlagged") {
        const sid = hashToStation.get(log.topics[1]);
        if (!sid) continue;
        items.push({ ...base, type: "ResultFlagged", style: "flag", stationId: sid, lookupType: "flagged",
          text: `${sid} flagged — ${parsed.args.reason}`, officer: shortAddress(parsed.args.flaggedBy),
          ipfsHash: idToIpfs.get(sid) });
      } else if (parsed.name === "CorrectionExecuted") {
        // stationId is `string indexed` — the raw string never lands in the
        // log data, only keccak256(stationId) in topics[2] (topics[1] is
        // correctionId). Resolve it the same way ResultSubmitted/Confirmed/
        // Flagged do for their indexed stationId, just off topics[2] instead
        // of topics[1]. parsed.args.stationId is NOT usable here — for an
        // indexed dynamic type it comes back as an unresolvable hash wrapper.
        const sid = hashToStation.get(log.topics[2]);
        if (!sid) continue;
        items.push({ ...base, type: "CorrectionExecuted", style: "green", stationId: sid, lookupType: "corrected",
          text: `${sid} correction executed`, officer: null,
          ipfsHash: idToIpfs.get(sid) });
      } else if (parsed.name === "CorrectionApproved") {
        const approver = parsed.args.approvedBy;
        const isRO = await contract.hasRole(roRoleHash, approver);
        const isSenior = await contract.hasRole(seniorRoleHash, approver);
        const roleLabel = isRO ? "Returning Officer" : isSenior ? "Senior EC Officer" : "Officer";
        // stationId isn't in this event — resolve via the correction struct,
        // which also carries the proposed doc hash this approval is for.
        let sid = null, correctedIpfs = null;
        try {
          const corr = await contract.getCorrection(parsed.args.correctionId);
          sid = corr.stationId;
          correctedIpfs = corr.correctedIpfsHash;
        } catch { continue; }
        if (!sid) continue;
        items.push({ ...base, type: "CorrectionApproved", style: "green", stationId: sid,
          lookupType: isRO ? "corrApprovedRO" : "corrApprovedSenior",
          text: `${sid} correction approved (${roleLabel})`, officer: shortAddress(approver),
          ipfsHash: correctedIpfs });
      } else if (parsed.name === "ConstituencyLocked") {
        const cname = hashToConst.get(log.topics[1]);
        if (!cname) continue;
        items.push({ ...base, type: "ConstituencyLocked", style: "lock", stationId: cname, lookupType: "locked",
          text: `${cname} constituency locked`, officer: shortAddress(parsed.args.returningOfficer) });
      }
    }
    return items;
  }, []);

  const mergeAndSet = useCallback((incoming, preferTxHash) => {
    setEvents(prev => {
      const merged = [...incoming, ...prev];
      const byKey = new Map();
      for (const it of merged) {
        // lookupType stays constant across baseline → enriched transitions
        // (unlike text, which gains a reason suffix for flagged rows), so
        // it's the correct stable identity for dedup. RO/Senior approvals
        // share type+stationId but have distinct lookupTypes.
        const key = `${it.type}-${it.stationId}-${it.lookupType || ""}`;
        const existing = byKey.get(key);
        if (!existing) {
          byKey.set(key, it);
        } else if (preferTxHash && !existing.txHash && it.txHash) {
          byKey.set(key, it);
        }
      }
      return Array.from(byKey.values())
        .sort((a, b) => (b.blockNumber - a.blockNumber) || ((b.timestamp || 0) - (a.timestamp || 0)))
        .slice(0, MAX_EVENTS);
    });
  }, []);

  const poll = useCallback(async (initial = false) => {
    try {
      const contract = getReadOnlyContract();
      const provider = contract.runner.provider;
      const latest   = await provider.getBlockNumber();

      if (initial) {
        const baseline = await buildBaseline(contract);
        mergeAndSet(baseline, false);
        setLoading(false);
        lastBlockRef.current = latest;

        const cache = loadCache();
        const toEnrich = baseline.filter(it => it.lookupType);
        // Populated as "submit" items resolve, so the historical "flagged"
        // row for the same station (always pushed after "submit" in
        // buildBaseline, so always processed after it here) can borrow the
        // true original Pink Sheet hash instead of showing nothing.
        const originalIpfsByStation = new Map();
        for (const item of toEnrich) {
          const cacheKey = `${item.lookupType}-${item.stationId}-${item.timestamp}`;
          let found = cache[cacheKey] || null;

          if (!found) {
            found = await findLog(contract, item, latest);
            if (found) {
              cache[cacheKey] = found;
              saveCache(cache);
            }
            await sleep(150);
          }

          if (found) {
            if (item.lookupType === "submit" && found.ipfsHash) {
              originalIpfsByStation.set(item.stationId, found.ipfsHash);
            }

            // Historical flagged row (station has since been corrected) —
            // baseline deliberately left ipfsHash null since the current
            // getResult() value would be the POST-correction doc, not the
            // one under review at flag-time. Backfill with the real one now.
            const isHistoricalFlag = item.lookupType === "flagged" && item.ipfsHash == null;
            const resolvedIpfs = found.ipfsHash
              || (isHistoricalFlag ? originalIpfsByStation.get(item.stationId) : null);

            mergeAndSet([{
              ...item,
              blockNumber: found.blockNumber,
              txHash: found.txHash,
              officer: found.officer || item.officer,
              ipfsHash: resolvedIpfs || item.ipfsHash,
              text: found.reason ? `${item.stationId} flagged — ${found.reason}` : item.text,
            }], true);
          }
        }
        return;
      }

      const from = Math.max(lastBlockRef.current + 1, latest - CHUNK);
      lastBlockRef.current = latest;
      if (from > latest) return;

      const fresh = await pollRecent(contract, from, latest);
      if (fresh.length > 0) mergeAndSet(fresh, true);
    } catch (err) {
      console.error("Event poll error:", err);
      setLoading(false);
    }
  }, [buildBaseline, findLog, pollRecent, mergeAndSet]);

  useEffect(() => {
    if (!initialRanOnce.current) {
      initialRanOnce.current = true;
      poll(true);
    }
    const interval = setInterval(() => poll(false), 30000);
    return () => clearInterval(interval);
  }, [poll]);

  return { events, loading };
}