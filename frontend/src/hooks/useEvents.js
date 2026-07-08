import { useState, useEffect, useRef, useCallback } from "react";
import { getReadOnlyContract } from "../utils/contract.js";
import { shortAddress } from "../utils/format.js";

const MAX_EVENTS = 50;
const CHUNK = 9; // Alchemy free tier: max 10-block range

const STATUS_LABEL = {
  0: null,               // Pending — the submission itself is the event
  1: "confirmed",
  2: "flagged",
  3: "corrected",
};

export function useEvents() {
  const [events,  setEvents]  = useState([]);
  const [loading, setLoading] = useState(true);
  const lastBlockRef = useRef(0);
  const seenKeys = useRef(new Set());

  const addUnique = useCallback((list, item, key) => {
    if (seenKeys.current.has(key)) return;
    seenKeys.current.add(key);
    list.push(item);
  }, []);

  // ── Baseline: reconstruct current state from live contract data ────────
  const buildBaseline = useCallback(async (contract) => {
    const ids = await contract.getAllStationIds();
    const results = await Promise.all(ids.map(id => contract.getResult(id)));
    const items = [];

    for (const r of results) {
      const status = Number(r.status);

      addUnique(items, {
        type: "ResultSubmitted", style: "green",
        stationId: r.stationId,
        text: `${r.stationId} result submitted`,
        officer: shortAddress(r.submittedBy),
        ipfsHash: r.ipfsHash,
        blockNumber: 0, // unknown without a log — sorted last within its group
        txHash: null,
        timestamp: Number(r.submittedAt),
      }, `submit-${r.stationId}`);

      const label = STATUS_LABEL[status];
      if (label) {
        addUnique(items, {
          type: label === "confirmed" ? "ResultConfirmed" : label === "flagged" ? "ResultFlagged" : "CorrectionExecuted",
          style: label === "flagged" ? "flag" : "green",
          stationId: r.stationId,
          text: `${r.stationId} ${label}`,
          officer: null,
          blockNumber: 0,
          txHash: null,
          timestamp: Number(r.submittedAt),
        }, `${label}-${r.stationId}`);
      }
    }
    return items;
  }, [addUnique]);

  // ── Live tail: exact recent events with full detail (reason, exact tx) ─
  const pollRecent = useCallback(async (contract, from, to) => {
    const [s, c, f, l] = await Promise.all([
      contract.queryFilter("ResultSubmitted",    from, to),
      contract.queryFilter("ResultConfirmed",    from, to),
      contract.queryFilter("ResultFlagged",      from, to),
      contract.queryFilter("ConstituencyLocked", from, to),
    ]);
    const items = [];
    s.forEach(e => addUnique(items, {
      type: "ResultSubmitted", style: "green",
      stationId: e.args.stationId,
      text: `${e.args.stationId} result submitted`,
      officer: shortAddress(e.args.officer),
      ipfsHash: e.args.ipfsHash,
      blockNumber: e.blockNumber, txHash: e.transactionHash,
    }, `submit-${e.args.stationId}`));
    c.forEach(e => addUnique(items, {
      type: "ResultConfirmed", style: "green",
      stationId: e.args.stationId,
      text: `${e.args.stationId} confirmed`,
      officer: shortAddress(e.args.returningOfficer),
      blockNumber: e.blockNumber, txHash: e.transactionHash,
    }, `confirmed-${e.args.stationId}`));
    f.forEach(e => addUnique(items, {
      type: "ResultFlagged", style: "flag",
      stationId: e.args.stationId,
      text: `${e.args.stationId} flagged — ${e.args.reason}`,
      officer: shortAddress(e.args.flaggedBy),
      blockNumber: e.blockNumber, txHash: e.transactionHash,
    }, `flagged-${e.args.stationId}`));
    l.forEach(e => addUnique(items, {
      type: "ConstituencyLocked", style: "lock",
      stationId: e.args.constituency,
      text: `${e.args.constituency} constituency locked`,
      officer: shortAddress(e.args.returningOfficer),
      blockNumber: e.blockNumber, txHash: e.transactionHash,
    }, `locked-${e.args.constituency}`));
    return items;
  }, [addUnique]);

  const poll = useCallback(async (initial = false) => {
    try {
      const contract = getReadOnlyContract();
      const provider = contract.runner.provider;
      const latest   = await provider.getBlockNumber();

      let fresh = [];

      if (initial) {
        fresh = await buildBaseline(contract);
      } else {
        const from = Math.max(lastBlockRef.current + 1, latest - CHUNK);
        if (from <= latest) {
          fresh = await pollRecent(contract, from, latest);
        }
      }

      lastBlockRef.current = latest;

      if (fresh.length > 0) {
        setEvents(prev => {
          const merged = [...fresh, ...prev];
          // Prefer log-sourced (has txHash) over synthetic duplicates
          const byKey = new Map();
          for (const it of merged) {
            const key = `${it.type}-${it.stationId}`;
            const existing = byKey.get(key);
            if (!existing || (!existing.txHash && it.txHash)) byKey.set(key, it);
          }
          return Array.from(byKey.values())
            .sort((a, b) => (b.blockNumber - a.blockNumber) || (b.timestamp || 0) - (a.timestamp || 0))
            .slice(0, MAX_EVENTS);
        });
      }
    } catch (err) {
      console.error("Event poll error:", err);
    } finally {
      setLoading(false);
    }
  }, [buildBaseline, pollRecent]);

  useEffect(() => {
    poll(true);
    const interval = setInterval(() => poll(false), 30000);
    return () => clearInterval(interval);
  }, [poll]);

  return { events, loading };
}