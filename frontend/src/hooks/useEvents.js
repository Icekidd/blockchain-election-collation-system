import { useState, useEffect, useCallback } from "react";
import { getReadOnlyContract } from "../utils/contract.js";
import { shortAddress } from "../utils/format.js";

const MAX_EVENTS = 50;

export function useEvents() {
  const [events,  setEvents]  = useState([]);
  const [loading, setLoading] = useState(true);

  const addEvent = useCallback((entry) => {
    setEvents(prev => [entry, ...prev].slice(0, MAX_EVENTS));
  }, []);

  useEffect(() => {
    let contract;
    let cancelled = false;

    async function setup() {
      try {
        contract = getReadOnlyContract();
        const provider  = contract.runner.provider;
        const latest    = await provider.getBlockNumber();
        const fromBlock = Math.max(0, latest - 500);

        const [submitted, confirmed, flagged, locked] = await Promise.all([
          contract.queryFilter("ResultSubmitted",    fromBlock, latest),
          contract.queryFilter("ResultConfirmed",    fromBlock, latest),
          contract.queryFilter("ResultFlagged",      fromBlock, latest),
          contract.queryFilter("ConstituencyLocked", fromBlock, latest),
        ]);

        if (cancelled) return;

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
            text: `${e.args.stationId} confirmed by Returning Officer`,
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

        if (!cancelled) {
          setEvents(parsed.slice(0, MAX_EVENTS));
          setLoading(false);
        }

        contract.on("ResultSubmitted", (stationId, constituency, officer, ipfsHash, ts, event) => {
          if (!cancelled) addEvent({ type: "ResultSubmitted", style: "green", stationId, text: `${stationId} result submitted`, officer: shortAddress(officer), ipfsHash, txHash: event.log.transactionHash });
        });
        contract.on("ResultConfirmed", (stationId, ro, ts, event) => {
          if (!cancelled) addEvent({ type: "ResultConfirmed", style: "green", stationId, text: `${stationId} confirmed`, officer: shortAddress(ro), txHash: event.log.transactionHash });
        });
        contract.on("ResultFlagged", (stationId, by, reason, ts, event) => {
          if (!cancelled) addEvent({ type: "ResultFlagged", style: "flag", stationId, text: `${stationId} flagged — ${reason}`, officer: shortAddress(by), txHash: event.log.transactionHash });
        });
        contract.on("ConstituencyLocked", (constituency, ro, total, ts, event) => {
          if (!cancelled) addEvent({ type: "ConstituencyLocked", style: "lock", stationId: constituency, text: `${constituency} locked`, officer: shortAddress(ro), txHash: event.log.transactionHash });
        });

      } catch (err) {
        console.error("Event listener error:", err);
        if (!cancelled) setLoading(false);
      }
    }

    setup();
    return () => {
      cancelled = true;
      if (contract) contract.removeAllListeners();
    };
  }, [addEvent]);

  return { events, loading };
}