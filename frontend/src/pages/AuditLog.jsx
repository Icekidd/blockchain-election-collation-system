import React, { useState } from "react";
import { useEvents } from "../hooks/useEvents.js";
import { explorerTx, shortHash } from "../utils/format.js";
import { ipfsUrl } from "../utils/ipfs.js";

const FILTERS = [
  "All", "ResultSubmitted", "StationRegistered",
  "OfficerApproved", "OfficerRejected", "PresidingOfficerRemoved",
  "ReturningOfficerAssigned", "ReturningOfficerRemoved",
  "CandidateAdded", "StatusChanged",
];

const isEnriching = (e) => Boolean(e.lookupType) && !e.txHash;

const Pending = () => (
  <span style={{ color: "var(--text2)", opacity: 0.6, animation: "pulse 1.2s ease-in-out infinite" }} title="Locating transaction on-chain...">
    …
  </span>
);

export default function AuditLog() {
  const { events, loading } = useEvents();
  const [filter, setFilter] = useState("All");

  const filtered = filter === "All" ? events : events.filter(e => e.type === filter);

  return (
    <div className="page-wrap">
      <div className="page-header">
        <span className="eyebrow">Immutable Record</span>
        <h1 className="page-title">On-Chain Audit Log</h1>
        <div className="page-sub">
          Every event pulled directly from the smart contract. Submitted results are final — there is
          no confirm, flag, or correction step in this system.
        </div>
      </div>

      <div style={{ display: "flex", gap: "7px", marginBottom: "16px", flexWrap: "wrap" }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "5px 12px", borderRadius: "20px", fontSize: "10px", fontWeight: 600,
            border: filter === f ? "1px solid rgba(252,209,22,0.35)" : "1px solid var(--border)",
            background: filter === f ? "rgba(252,209,22,0.1)" : "var(--surface)",
            color: filter === f ? "var(--gold)" : "var(--text2)",
            cursor: "pointer", fontFamily: "DM Mono,monospace",
          }}>
            {f}
          </button>
        ))}
      </div>

      <div className="panel" style={{ overflowX: "auto" }}>
        {loading ? (
          <div className="loading-state"><div className="spinner" /> Loading events...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px", color: "var(--text2)", fontSize: "12px" }}>
            No events found
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Detail</th>
                <th>Officer</th>
                <th>Tx Hash</th>
                <th>Block</th>
                <th>Record</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => {
                const pending = isEnriching(e);
                return (
                  <tr key={e.key || `${e.type}-${e.stationId}`}>
                    <td>
                      <span className={"pill " + (e.style === "green" ? "ok" : e.style === "flag" ? "flag" : "lock")}>
                        {e.type}
                      </span>
                    </td>
                    <td style={{ color: "var(--bright)", fontWeight: 600, maxWidth: "320px" }}>
                      {e.text || e.stationId}
                    </td>
                    <td style={{ color: "var(--text2)" }}>
                      {e.officer || (pending ? <Pending /> : "-")}
                    </td>
                    <td>
                      {e.txHash ? (
                        <a href={explorerTx(e.txHash)} target="_blank" rel="noreferrer" style={{ color: "var(--accent2)", textDecoration: "none" }}>
                          {shortHash(e.txHash)}
                        </a>
                      ) : pending ? <Pending /> : "-"}
                    </td>
                    <td style={{ color: "var(--text2)" }}>
                      {e.blockNumber ? "#" + e.blockNumber : pending ? <Pending /> : "-"}
                    </td>
                    <td>
                      {e.ipfsHash ? (
                        <a href={ipfsUrl(e.ipfsHash)} target="_blank" rel="noreferrer" style={{ color: "#a78bfa", textDecoration: "none" }}>
                          {shortHash(e.ipfsHash)}
                        </a>
                      ) : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}