import { useState, useEffect, useCallback } from "react";
import { getReadOnlyContract } from "../utils/contract.js";
import { shortAddress } from "../utils/format.js";

const MAX_EVENTS = 50;

export function useEvents() {
  const [events,  setEvents]  = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    try {
      const contract = getReadOnlyContract();
      const provider = contract.runner.provider;
      const latest   = await provider.getBlockNumber();
      const fromBlock = Math.max(0, latest - 9);

      const [submitted, confirmed, flagged, locked] = await Promise.all([
        contract.queryFilter("ResultSubmitted",    fromBlock, latest),
        contract.queryFilter("ResultConfirmed",    fromBlock, latest),
        contract.queryFilter("ResultFlagged",      fromBlock, latest),
        contract.queryFilter("ConstituencyLocked", fromBlock, latest),
      ]);

      const parsed = [
        ...submitted.map(e => ({
          type: "ResultSubmitted", style: "green",
          stationId: e.args.stationId,
          text: `${e.args.stationId} result submitted`,
          officer: shortAddress(e.args.officer),
          ipfsHash: e.args.ipfsHash,
          blockNumber: e.blockNumber,
          txHash: e.transactionHash,
        })),
        ...confirmed.map(e => ({
          type: "ResultConfirmed", style: "green",
          stationId: e.args.stationId,
          text: `${e.args.stationId} confirmed`,
          officer: shortAddress(e.args.returningOfficer),
          blockNumber: e.blockNumber,
          txHash: e.transactionHash,
        })),
        ...flagged.map(e => ({
          type: "ResultFlagged", style: "flag",
          stationId: e.args.stationId,
          text: `${e.args.stationId} flagged — ${e.args.reason}`,
          officer: shortAddress(e.args.flaggedBy),
          blockNumber: e.blockNumber,
          txHash: e.transactionHash,
        })),
        ...locked.map(e => ({
          type: "ConstituencyLocked", style: "lock",
          stationId: e.args.constituency,
          text: `${e.args.constituency} constituency locked`,
          officer: shortAddress(e.args.returningOfficer),
          blockNumber: e.blockNumber,
          txHash: e.transactionHash,
        })),
      ].sort((a, b) => b.blockNumber - a.blockNumber);

      setEvents(parsed.slice(0, MAX_EVENTS));
    } catch (err) {
      console.error("Event fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    // Poll every 30 seconds instead of WebSocket listeners
    const interval = setInterval(fetchEvents, 30000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  return { events, loading };
}