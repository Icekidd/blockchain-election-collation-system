import { useState, useEffect, useRef, useCallback } from "react";
import { getReadOnlyContract } from "../utils/contract.js";
import { shortAddress } from "../utils/format.js";
import { ethers } from "ethers";

const MAX_EVENTS = 60;
const CHUNK = 9;                // Alchemy free tier: max 10-block range per eth_getLogs call
const PER_KEY_MAX_CHUNKS = 15;  // bounded search depth per targeted (hash-matched) lookup
const RECENT_WINDOW = 9;        // bounded window for the "recent activity" scan (role/candidate events)
const REQUEST_DELAY = 250;      // ms between requests
const DEPLOY_BLOCK = Number(import.meta.env.VITE_DEPLOY_BLOCK || 0); // floor — set per deployment

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Events whose relevant string field is INDEXED (hashed in the topic, unrecoverable
// as text from the log alone) — these need hash-matching against known values.
const HASH_MATCH_EVENTS = {
  submit:     { eventName: "ResultSubmitted",         indexedFrom: (id) => id },
  registered: { eventName: "StationRegistered",        indexedFrom: (id) => id },
};

// Events that decode cleanly with parseLog (no indexed dynamic-type fields) —
// safe to scan a small recent window and read directly.
const DIRECT_EVENTS = [
  "OfficerApproved", "OfficerRejected", "PresidingOfficerRemoved",
  "ReturningOfficerAssigned", "ReturningOfficerRemoved",
  "CandidateAdded", "StatusChanged",
];

export function useEvents() {
  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(true);
  const lastBlockRef  = useRef(0);
  const initialRanOnce = useRef(false);

  // ── Baseline: reconstruct current state instantly from contract reads ──
  const buildBaseline = useCallback(async (contract) => {
    const items = [];

    // Submitted results — the core immutable audit trail.
    try {
      const submittedIds = await contract.getSubmittedStationIds();
      const results = await Promise.all(submittedIds.map(id => contract.getResult(id)));
      for (const r of results) {
        items.push({
          key: `submit-${r.stationId}`,
          lookupType: "submit",
          stationId: r.stationId,
          type: "ResultSubmitted", style: "green",
          text: `${r.stationId} result submitted — final`,
          officer: shortAddress(r.submittedBy),
          ipfsHash: r.recordHash,
          blockNumber: 0, txHash: null,
          timestamp: Number(r.submittedAt),
        });
      }
    } catch (_) {}

    // Registered stations — the setup-phase audit trail.
    try {
      const stationIds = await contract.getAllStationIds();
      const stations = await Promise.all(stationIds.map(id => contract.getStation(id)));
      for (const s of stations) {
        items.push({
          key: `registered-${s.stationId}`,
          lookupType: "registered",
          stationId: s.stationId,
          type: "StationRegistered", style: "lock",
          text: `${s.stationId} registered in ${s.constituency} — ${Number(s.registeredVoters).toLocaleString()} registered voters`,
          officer: null, // only knowable from the log
          blockNumber: 0, txHash: null,
          timestamp: 0,
        });
      }
    } catch (_) {}

    return items;
  }, []);

  // ── Targeted lookup: find the exact log for one (type, stationId) pair ──
  const findLog = useCallback(async (contract, lookupType, stationId, latest) => {
    const { eventName, indexedFrom } = HASH_MATCH_EVENTS[lookupType];
    const provider = contract.runner.provider;
    const address = await contract.getAddress();
    const topic0 = contract.interface.getEvent(eventName).topicHash;
    const topic1 = ethers.keccak256(ethers.toUtf8Bytes(indexedFrom(stationId)));

    let cursor = latest;
    let chunksUsed = 0;

    while (cursor >= DEPLOY_BLOCK && chunksUsed < PER_KEY_MAX_CHUNKS) {
      const from = Math.max(DEPLOY_BLOCK, cursor - CHUNK);
      let attempt = 0;
      while (attempt < 3) {
        try {
          const logs = await provider.getLogs({ address, fromBlock: from, toBlock: cursor, topics: [topic0, topic1] });
          if (logs.length > 0) {
            const log = logs[logs.length - 1];
            const parsed = contract.interface.parseLog(log);
            return {
              blockNumber: log.blockNumber,
              txHash: log.transactionHash,
              officer:
                eventName === "ResultSubmitted"   ? undefined : // already known from state
                eventName === "StationRegistered" ? shortAddress(log.address) : undefined,
            };
          }
          break;
        } catch (err) {
          attempt++;
          if (attempt >= 3) break;
          await sleep(700 * attempt);
        }
      }
      chunksUsed++;
      cursor = from - 1;
      await sleep(REQUEST_DELAY);
    }
    return null;
  }, []);

  // ── Recent activity: small bounded window, direct-decode events ──
  const scanRecent = useCallback(async (contract, from, to) => {
    const provider = contract.runner.provider;
    const address = await contract.getAddress();
    const topicHashes = DIRECT_EVENTS.map(n => contract.interface.getEvent(n).topicHash);

    let logs = [];
    try {
      logs = await provider.getLogs({ address, fromBlock: from, toBlock: to, topics: [topicHashes] });
    } catch (_) { return []; }

    const items = [];
    for (const log of logs) {
      let parsed;
      try { parsed = contract.interface.parseLog(log); } catch { continue; }
      if (!parsed) continue;
      const base = { blockNumber: log.blockNumber, txHash: log.transactionHash, timestamp: 0 };

      switch (parsed.name) {
        case "OfficerApproved":
          items.push({ ...base, key: `officer-approved-${parsed.args.officer}`, type: "OfficerApproved", style: "green",
            stationId: parsed.args.stationId, text: `Officer approved for ${parsed.args.stationId}`,
            officer: shortAddress(parsed.args.officer) });
          break;
        case "OfficerRejected":
          items.push({ ...base, key: `officer-rejected-${parsed.args.officer}`, type: "OfficerRejected", style: "flag",
            stationId: "-", text: `Officer application rejected`, officer: shortAddress(parsed.args.officer) });
          break;
        case "PresidingOfficerRemoved":
          items.push({ ...base, key: `po-removed-${parsed.args.officer}`, type: "PresidingOfficerRemoved", style: "flag",
            stationId: parsed.args.stationId, text: `Officer removed from ${parsed.args.stationId}`,
            officer: shortAddress(parsed.args.officer) });
          break;
        case "ReturningOfficerAssigned":
          items.push({ ...base, key: `ro-assigned-${parsed.args.ro}`, type: "ReturningOfficerAssigned", style: "green",
            stationId: parsed.args.constituency, text: `RO assigned to ${parsed.args.constituency}`,
            officer: shortAddress(parsed.args.ro) });
          break;
        case "ReturningOfficerRemoved":
          items.push({ ...base, key: `ro-removed-${parsed.args.ro}`, type: "ReturningOfficerRemoved", style: "flag",
            stationId: parsed.args.constituency, text: `RO removed from ${parsed.args.constituency}`,
            officer: shortAddress(parsed.args.ro) });
          break;
        case "CandidateAdded":
          items.push({ ...base, key: `candidate-${parsed.args.index}`, type: "CandidateAdded", style: "lock",
            stationId: parsed.args.party, text: `Candidate added — ${parsed.args.name} (${parsed.args.party})`,
            officer: null });
          break;
        case "StatusChanged":
          items.push({ ...base, key: `status-${log.blockNumber}-${log.transactionIndex}`, type: "StatusChanged", style: "lock",
            stationId: "-", text: `Election status changed`, officer: null });
          break;
        default: break;
      }
    }
    return items;
  }, []);

  const mergeAndSet = useCallback((incoming, preferTxHash) => {
    setEvents(prev => {
      const merged = [...incoming, ...prev];
      const byKey = new Map();
      for (const it of merged) {
        const key = it.key || `${it.type}-${it.stationId}`;
        const existing = byKey.get(key);
        if (!existing) byKey.set(key, it);
        else if (preferTxHash && !existing.txHash && it.txHash) byKey.set(key, { ...existing, ...it });
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
      const latest = await provider.getBlockNumber();

      if (initial) {
        const baseline = await buildBaseline(contract);
        mergeAndSet(baseline, false);
        setLoading(false);
        lastBlockRef.current = latest;

        // Enrich hash-matched baseline entries (submit + registered) with tx/block.
        const toEnrich = baseline.filter(it => it.lookupType);
        for (const item of toEnrich) {
          const found = await findLog(contract, item.lookupType, item.stationId, latest);
          if (found) {
            mergeAndSet([{ ...item, blockNumber: found.blockNumber, txHash: found.txHash,
              officer: found.officer || item.officer }], true);
          }
          await sleep(120);
        }

        // Recent-window scan for direct-decode events (role/candidate activity).
        const recentFrom = Math.max(DEPLOY_BLOCK, latest - RECENT_WINDOW * 3);
        const recent = await scanRecent(contract, recentFrom, latest);
        if (recent.length > 0) mergeAndSet(recent, true);
        return;
      }

      // Incremental tail poll — small, safe range for brand-new activity.
      const from = Math.max(lastBlockRef.current + 1, latest - CHUNK);
      lastBlockRef.current = latest;
      if (from > latest) return;

      const fresh = await scanRecent(contract, from, latest);
      if (fresh.length > 0) mergeAndSet(fresh, true);
    } catch (err) {
      console.error("Event poll error:", err);
      setLoading(false);
    }
  }, [buildBaseline, findLog, scanRecent, mergeAndSet]);

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