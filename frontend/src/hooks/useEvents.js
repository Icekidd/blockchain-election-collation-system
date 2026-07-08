import { useState, useEffect, useRef, useCallback } from "react";
import { getReadOnlyContract } from "../utils/contract.js";
import { shortAddress } from "../utils/format.js";

const MAX_EVENTS = 50;
const CHUNK = 9;           // Alchemy free tier: max 10-block range
const BACKFILL_CHUNKS = 30; // how far back to scan on first load (~270 blocks)

export function useEvents() {
  const [events,  setEvents]  = useState([]);
  const [loading, setLoading] = useState(true);
  const lastBlockRef = useRef(0);
  const seenTx = useRef(new Set());

  const parseLogs = useCallback((submitted, confirmed, flagged, locked) => {
    const items = [
      ...submitted.map(e => ({
        type: "ResultSubmitted", style: "green",
        stationId: e.args.stationId,
        text: `${e.args.stationId} result submitted`,
        officer: shortAddress(e.args.officer),
        ipfsHash: e.args.ipfsHash,
        blockNumber: e.blockNumber, txHash: e.transactionHash,
      })),
      ...confirmed.map(e => ({
        type: "ResultConfirmed", style: "green",
        stationId: e.args.stationId,
        text: `${e.args.stationId} confirmed`,
        officer: shortAddress(e.args.returningOfficer),
        blockNumber: e.blockNumber, txHash: e.transactionHash,
      })),
      ...flagged.map(e => ({
        type: "ResultFlagged", style: "flag",
        stationId: e.args.stationId,
        text: `${e.args.stationId} flagged — ${e.args.reason}`,
        officer: shortAddress(e.args.flaggedBy),
        blockNumber: e.blockNumber, txHash: e.transactionHash,
      })),
      ...locked.map(e => ({
        type: "ConstituencyLocked", style: "lock",
        stationId: e.args.constituency,
        text: `${e.args.constituency} constituency locked`,
        officer: shortAddress(e.args.returningOfficer),
        blockNumber: e.blockNumber, txHash: e.transactionHash,
      })),
    ];
    // de-duplicate by tx hash + type
    return items.filter(it => {
      const key = it.txHash + it.type + it.stationId;
      if (seenTx.current.has(key)) return false;
      seenTx.current.add(key);
      return true;
    });
  }, []);

  const queryRange = useCallback(async (contract, from, to) => {
    const [s, c, f, l] = await Promise.all([
      contract.queryFilter("ResultSubmitted",    from, to),
      contract.queryFilter("ResultConfirmed",    from, to),
      contract.queryFilter("ResultFlagged",      from, to),
      contract.queryFilter("ConstituencyLocked", from, to),
    ]);
    return parseLogs(s, c, f, l);
  }, [parseLogs]);

  const poll = useCallback(async (backfill = false) => {
    try {
      const contract = getReadOnlyContract();
      const provider = contract.runner.provider;
      const latest   = await provider.getBlockNumber();

      let collected = [];

      if (backfill) {
        // Walk backwards in 9-block chunks to build initial history
        for (let i = 0; i < BACKFILL_CHUNKS; i++) {
          const to   = latest - i * (CHUNK + 1);
          const from = Math.max(0, to - CHUNK);
          if (to <= 0) break;
          try {
            const chunkEvents = await queryRange(contract, from, to);
            collected = collected.concat(chunkEvents);
            if (collected.length >= MAX_EVENTS) break;
          } catch { break; } // stop backfill on rate limit
        }
      } else {
        const from = Math.max(lastBlockRef.current + 1, latest - CHUNK);
        if (from <= latest) {
          collected = await queryRange(contract, from, latest);
        }
      }

      lastBlockRef.current = latest;

      if (collected.length > 0) {
        setEvents(prev =>
          [...collected, ...prev]
            .sort((a, b) => b.blockNumber - a.blockNumber)
            .slice(0, MAX_EVENTS)
        );
      }
    } catch (err) {
      console.error("Event poll error:", err);
    } finally {
      setLoading(false);
    }
  }, [queryRange]);

  useEffect(() => {
    poll(true); // initial load with backfill
    const interval = setInterval(() => poll(false), 30000);
    return () => clearInterval(interval);
  }, [poll]);

  return { events, loading };
}