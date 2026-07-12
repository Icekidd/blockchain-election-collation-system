import React, { useEffect, useState } from "react";
import { useWallet } from "../context/WalletContext.jsx";
import { useContract } from "../hooks/useContract.js";
import { RESULT_STATUS } from "../utils/contract.js";
import { ipfsGateway } from "../utils/format.js";
import { RoleGuard } from "../components/RoleGuard.jsx";
import Toast from "../components/Toast.jsx";
import { notifyResultConfirmed, notifyResultFlagged, notifyConstituencyLocked } from "../utils/notify.js";

export default function ROReview() {
  return (
    <RoleGuard roles={["RETURNING", "SENIOR"]}>
      <ROReviewContent />
    </RoleGuard>
  );
}

function ROReviewContent() {
  const { contract } = useWallet();
  const { call, loading, txHash } = useContract();
  const [stations, setStations] = useState([]);
  const [lockedConstituencies, setLockedConstituencies] = useState(new Set());
  const [fetching, setFetching] = useState(true);
  const [toast, setToast] = useState(null);
  const [filter, setFilter] = useState("ALL");

  async function loadStations() {
    try {
      const ids = await contract.getAllStationIds();
      const results = await Promise.all(ids.map(id => contract.getResult(id)));
      setStations(results);

      // Fetch locked state per constituency
      const constNames = await contract.getAllConstituencies();
      const constData = await Promise.all(constNames.map(name => contract.getConstituency(name)));
      const locked = new Set(constNames.filter((_, i) => constData[i].locked));
      setLockedConstituencies(locked);
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  }

  useEffect(() => { if (contract) loadStations(); }, [contract]);

  async function confirm(r) {
    try {
      await call(() => contract.confirmResult(r.stationId));
      setToast({ message: r.stationId + " confirmed", type: "success" });
      try { await notifyResultConfirmed(r.stationId, r.constituency); } catch(e) { console.error(e); }
      loadStations();
    } catch (err) { console.error(err); }
  }

  async function flag(r) {
    const reason = window.prompt("Enter reason for flagging:");
    if (!reason) return;
    try {
      await call(() => contract.flagResult(r.stationId, reason));
      setToast({ message: r.stationId + " flagged", type: "warning" });
      try { await notifyResultFlagged(r.stationId, r.constituency, reason); } catch(e) { console.error(e); }
      loadStations();
    } catch (err) { console.error(err); }
  }

  async function lockConst(constituency) {
    if (!window.confirm("Lock " + constituency + "? This cannot be undone.")) return;
    try {
      await call(() => contract.lockConstituency(constituency));
      setToast({ message: constituency + " locked", type: "success" });
      try { await notifyConstituencyLocked(constituency); } catch(e) { console.error(e); }
      loadStations();
    } catch (err) { console.error(err); }
  }

  const filtered = stations.filter(r => {
    if (filter === "ALL")       return true;
    if (filter === "PENDING")   return Number(r.status) === 0;
    if (filter === "CONFIRMED") return Number(r.status) === 1;
    if (filter === "FLAGGED")   return Number(r.status) === 2;
    return true;
  });

  return (
    <div className="page-wrap">
      <div className="page-header">
        <span className="eyebrow">Returning Officer</span>
        <h1 className="page-title">Constituency Review</h1>
        <div className="page-sub">
          {stations.length} stations submitted - {stations.filter(r => Number(r.status) === 2).length} flagged
        </div>
      </div>

      <div style={{ display: "flex", gap: "7px", marginBottom: "16px", flexWrap: "wrap" }}>
        {["ALL", "PENDING", "CONFIRMED", "FLAGGED"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "5px 13px", borderRadius: "20px", fontSize: "10px", fontWeight: 600,
            border: filter === f ? "1px solid rgba(252,209,22,0.35)" : "1px solid var(--border)",
            background: filter === f ? "rgba(252,209,22,0.1)" : "var(--surface)",
            color: filter === f ? "var(--gold)" : "var(--text2)",
            cursor: "pointer", fontFamily: "DM Mono,monospace",
          }}>
            {f}
          </button>
        ))}
      </div>

      {fetching ? (
        <div className="loading-state"><div className="spinner" /> Loading stations...</div>
      ) : (
        <div className="panel" style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Station ID</th>
                <th>Name</th>
                <th>Constituency</th>
                <th>Total Votes</th>
                <th>Pink Sheet</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", color: "var(--text2)", padding: "24px" }}>
                    No results
                  </td>
                </tr>
              ) : filtered.map(r => {
                const s = RESULT_STATUS[Number(r.status)] || RESULT_STATUS[0];
                const total = r.votes.reduce((acc, v) => acc + BigInt(v), 0n);
                const isLocked = lockedConstituencies.has(r.constituency);
                const canLock = (Number(r.status) === 1 || Number(r.status) === 3) && !isLocked;

                return (
                  <tr key={r.stationId}>
                    <td style={{ color: "var(--bright)", fontWeight: 600 }}>{r.stationId}</td>
                    <td style={{ color: "var(--text)", fontFamily: "DM Sans,sans-serif", fontSize: "11px" }}>{r.stationName}</td>
                    <td style={{ color: "var(--text2)", fontFamily: "DM Sans,sans-serif", fontSize: "11px" }}>{r.constituency}</td>
                    <td style={{ color: "var(--bright)" }}>{total.toString()}</td>
                    <td>
                      {r.ipfsHash ? (
                        <a href={ipfsGateway(r.ipfsHash)} target="_blank" rel="noreferrer" style={{ color: "#a78bfa", fontSize: "10px", textDecoration: "none" }}>
                          View
                        </a>
                      ) : "-"}
                    </td>
                    <td><span className={"pill " + s.style}>{s.label}</span></td>
                    <td>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        {Number(r.status) === 0 && (
                          <>
                            <button className="btn btn-primary" style={{ padding: "4px 10px", fontSize: "10px" }} onClick={() => confirm(r)} disabled={loading}>Confirm</button>
                            <button className="btn btn-danger"  style={{ padding: "4px 10px", fontSize: "10px" }} onClick={() => flag(r)} disabled={loading}>Flag</button>
                          </>
                        )}
                        {canLock && (
                          <button className="btn btn-secondary" style={{ padding: "4px 10px", fontSize: "10px" }} onClick={() => lockConst(r.constituency)} disabled={loading}>
                            Lock Constituency
                          </button>
                        )}
                        {isLocked && (Number(r.status) === 1 || Number(r.status) === 3) && (
                          <span style={{ fontSize: "10px", color: "var(--text2)", fontFamily: "DM Mono,monospace" }}>
                            🔒 Locked
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {toast && <Toast message={toast.message} type={toast.type} txHash={txHash} onClose={() => setToast(null)} />}
    </div>
  );
}