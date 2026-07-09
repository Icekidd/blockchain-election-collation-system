import { useState, useEffect, useRef, useCallback } from "react";
import { getReadOnlyContract } from "../utils/contract.js";
import { shortAddress } from "../utils/format.js";
import { ethers } from "ethers";

const MAX_EVENTS = 50;
const CHUNK = 9;               // Alchemy free tier: max 10-block range per eth_getLogs call
const FALLBACK_MAX_CHUNKS = 20; // bounded backward scan, only used when binary search fails
const REQUEST_DELAY = 250;     // ms between getLogs requests
const BSEARCH_DELAY = 60;      // ms between binary-search steps (getBlock / eth_call are cheap)
const DEPLOY_BLOCK = 41487461; // floor — never scan earlier than this
const CACHE_KEY = "ecg_audit_log_cache_v1";

const STATUS_LABEL = {
  0: null,               // Pending — the submission itself is the event
  1: "confirmed",
  2: "flagged",
  3: "corrected",
};

// The on-chain status value each enrichable event type corresponds to.
const STATUS_OF_TYPE = { confirmed: 1, flagged: 2 };

// Maps our internal "type" key to (eventName, indexedFieldGetter).
// The indexed field is what got hashed into the log's topic — we compute
// the same hash from data we already know (the baseline) to find the match,
// since a hashed indexed *string* cannot be reversed from the log itself.
const EVENT_LOOKUP = {
  submit:    { eventName: "ResultSubmitted",    indexedFrom: (stationId) => stationId },
  confirmed: { eventName: "ResultConfirmed",    indexedFrom: (stationId) => stationId },
  flagged:   { eventName: "ResultFlagged",      indexedFrom: (stationId) => stationId },
  locked:    { eventName: "ConstituencyLocked", indexedFrom: (constituencyName) => constituencyName },
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
// Mined events are immutable, so once a (type, station, submittedAt) tuple
// has been resolved to a tx hash it never needs to be looked up again.
// submittedAt is part of the key so a re-submission invalidates old entries.
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
// must be monotone (false...false, true...true) across the range — which
// "state equals its current value" is, as long as that value was reached
// once and kept (true for confirm/flag on top of a given submission).
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
  // Works instantly regardless of how old a submission is, since it reads
  // current state via getResult() rather than depending on log range limits.
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
        const lookupType = label === "confirmed" ? "confirmed" : label === "flagged" ? "flagged" : null;
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
    return items;
  }, []);

  // ── Targeted lookup: find the exact log for one known (type, id) pair ──
  // Instead of scanning the chain backwards in 9-block chunks (which only
  // covers ~6 minutes of Amoy history before the budget runs out), locate
  // the block directly:
  //   submit    → binary search block timestamps against submittedAt
  //   confirmed → binary search historical getResult() state for the block
  //   flagged     where status first equals its current value
  // then fetch the log from a single tiny window around that block.
  const findLog = useCallback(async (contract, item, latest) => {
    const { eventName, indexedFrom } = EVENT_LOOKUP[item.lookupType];
    const provider = contract.runner.provider;
    const address = await contract.getAddress();
    const topic0 = contract.interface.getEvent(eventName).topicHash;
    const topic1 = ethers.keccak256(ethers.toUtf8Bytes(indexedFrom(item.stationId)));

    // 1. Locate the block containing the event.
    let candidate = null;
    try {
      if (item.lookupType === "submit") {
        candidate = await blockAtTimestamp(provider, item.timestamp, latest);
      } else if (item.lookupType === "confirmed" || item.lookupType === "flagged") {
        const targetStatus = STATUS_OF_TYPE[item.lookupType];
        // The confirm/flag can only happen at or after the submission block,
        // so anchor the search there to shrink the range.
        const submitBlock = await blockAtTimestamp(provider, item.timestamp, latest);
        candidate = await firstBlockWhere(submitBlock, latest, async (b) => {
          try {
            const r = await contract.getResult(item.stationId, { blockTag: b });
            return Number(r.status) === targetStatus;
          } catch (err) {
            // Station not registered yet at this block — treat as "not yet"
            if (err?.code === "CALL_EXCEPTION") return false;
            throw err;
          }
        });
      }
    } catch (err) {
      console.warn(`Block location failed for ${item.lookupType}-${item.stationId}:`, err);
      candidate = null;
    }

    // 2. Build the getLogs windows to try (each ≤ 10 blocks for the free tier).
    //    Binary search is exact, so the centered window should hit on the
    //    first try; the two neighbours are just a safety margin.
    const windows = [];
    if (candidate != null) {
      windows.push([Math.max(DEPLOY_BLOCK, candidate - 4), Math.min(latest, candidate + 5)]);
      windows.push([Math.max(DEPLOY_BLOCK, candidate - 14), Math.max(DEPLOY_BLOCK, candidate - 5)]);
      windows.push([Math.min(latest, candidate + 6), Math.min(latest, candidate + 15)]);
    } else {
      // Fallback: bounded backward scan from the tip. Covers "locked"
      // lookups (no state getter wired up yet) and binary-search failures.
      let cursor = latest;
      for (let i = 0; i < FALLBACK_MAX_CHUNKS && cursor >= DEPLOY_BLOCK; i++) {
        const from = Math.max(DEPLOY_BLOCK, cursor - CHUNK);
        windows.push([from, cursor]);
        cursor = from - 1;
      }
    }

    // 3. Pull and parse the log.
    for (const [from, to] of windows) {
      if (from > to) continue;
      try {
        const logs = await withRetry(() => provider.getLogs({
          address, fromBlock: from, toBlock: to,
          topics: [topic0, topic1],
        }));
        if (logs.length > 0) {
          const log = logs[logs.length - 1]; // most recent match in this window
          const parsed = contract.interface.parseLog(log);
          return {
            blockNumber: log.blockNumber,
            txHash: log.transactionHash,
            officer:
              eventName === "ResultSubmitted"    ? shortAddress(parsed.args.officer) :
              eventName === "ResultConfirmed"    ? shortAddress(parsed.args.returningOfficer) :
              eventName === "ResultFlagged"      ? shortAddress(parsed.args.flaggedBy) :
              eventName === "ConstituencyLocked" ? shortAddress(parsed.args.returningOfficer) :
              null,
            reason: eventName === "ResultFlagged" ? parsed.args.reason : undefined,
          };
        }
      } catch (err) {
        console.warn(`getLogs window [${from}, ${to}] failed:`, err);
      }
      await sleep(REQUEST_DELAY);
    }
    return null; // not found
  }, []);

  // ── Live tail: small, always-safe range for brand-new activity ─────────
  // Uses the combined-topics approach since we're not matching specific
  // known IDs here — anything new in this narrow range is genuinely new.
  const pollRecent = useCallback(async (contract, from, to) => {
    const provider = contract.runner.provider;
    const address = await contract.getAddress();
    const names = ["ResultSubmitted", "ResultConfirmed", "ResultFlagged", "ConstituencyLocked"];
    const topicHashes = names.map(n => contract.interface.getEvent(n).topicHash);

    const logs = await provider.getLogs({
      address, fromBlock: from, toBlock: to,
      topics: [topicHashes],
    });

    // For the live tail we don't yet know the plaintext stationId (it's
    // hashed in the topic), so we resolve it by cross-checking against the
    // contract's current station list — fine here since this range is tiny
    // and only runs every 30s for brand-new activity.
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

    const items = [];
    for (const log of logs) {
      let parsed;
      try { parsed = contract.interface.parseLog(log); } catch { continue; }
      if (!parsed) continue;

      const base = { blockNumber: log.blockNumber, txHash: log.transactionHash };

      if (parsed.name === "ResultSubmitted") {
        const sid = hashToStation.get(log.topics[1]);
        if (!sid) continue;
        items.push({ ...base, type: "ResultSubmitted", style: "green", stationId: sid,
          text: `${sid} result submitted`, officer: shortAddress(parsed.args.officer), ipfsHash: parsed.args.ipfsHash });
      } else if (parsed.name === "ResultConfirmed") {
        const sid = hashToStation.get(log.topics[1]);
        if (!sid) continue;
        items.push({ ...base, type: "ResultConfirmed", style: "green", stationId: sid,
          text: `${sid} confirmed`, officer: shortAddress(parsed.args.returningOfficer),
          ipfsHash: idToIpfs.get(sid) });
      } else if (parsed.name === "ResultFlagged") {
        const sid = hashToStation.get(log.topics[1]);
        if (!sid) continue;
        items.push({ ...base, type: "ResultFlagged", style: "flag", stationId: sid,
          text: `${sid} flagged — ${parsed.args.reason}`, officer: shortAddress(parsed.args.flaggedBy),
          ipfsHash: idToIpfs.get(sid) });
      } else if (parsed.name === "ConstituencyLocked") {
        const cname = hashToConst.get(log.topics[1]);
        if (!cname) continue;
        items.push({ ...base, type: "ConstituencyLocked", style: "lock", stationId: cname,
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
        const key = `${it.type}-${it.stationId}`;
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
        // 1. Instant baseline from current contract state — always correct
        const baseline = await buildBaseline(contract);
        mergeAndSet(baseline, false);
        setLoading(false);
        lastBlockRef.current = latest;

        // 2. Enrichment: for each baseline item still missing a tx hash,
        //    locate its exact log via binary search (see findLog). Results
        //    are cached in localStorage so this cost is paid once per event
        //    per device, ever.
        const cache = loadCache();
        const toEnrich = baseline.filter(it => it.lookupType);
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
            mergeAndSet([{
              ...item,
              blockNumber: found.blockNumber,
              txHash: found.txHash,
              officer: found.officer || item.officer,
              text: found.reason ? `${item.stationId} flagged — ${found.reason}` : item.text,
            }], true);
          }
        }
        return;
      }

      // Incremental tail poll for brand-new activity — small, safe range
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