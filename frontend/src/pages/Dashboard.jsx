import React, { useEffect, useState } from "react";
import { useWallet } from "../context/WalletContext.jsx";
import { getReadOnlyContract, ELECTION_STATUS } from "../utils/contract.js";
import { formatNumber } from "../utils/format.js";
import { getConstituencyInfo } from "../data/constituencyLookup.js";
import StatCard from "../components/StatCard.jsx";
import CandidateBar from "../components/CandidateBar.jsx";
import ActivityFeed from "../components/ActivityFeed.jsx";
import { useEvents } from "../hooks/useEvents.js";
import { exportResultsPDF } from "../utils/exportPDF.js";

export default function Dashboard() {
  const { contract, isChair } = useWallet();
  const { events, loading: eventsLoading } = useEvents();

  const [candidates,     setCandidates]     = useState([]);
  const [totals,         setTotals]         = useState([]);
  const [constituencies, setConstituencies] = useState([]);
  const [electionStatus, setElectionStatus] = useState(null);
  const [registeredCount, setRegisteredCount] = useState(0);
  const [submittedCount,  setSubmittedCount]  = useState(0);
  const [loading,        setLoading]        = useState(true);
  const [statusLoading,  setStatusLoading]  = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const c = contract || getReadOnlyContract();

        const [status, candCount, regIds, subIds] = await Promise.all([
          c.status(),
          c.getCandidateCount(),
          c.getAllStationIds(),        // registered stations
          c.getSubmittedStationIds(),  // submitted stations
        ]);
        setElectionStatus(Number(status));
        setRegisteredCount(regIds.length);
        setSubmittedCount(subIds.length);

        // Candidates
        const cs = [];
        for (let i = 0; i < Number(candCount); i++) {
          const cand = await c.candidates(i);
          cs.push({ name: cand.name, party: cand.party, color: cand.color });
        }
        setCandidates(cs);

        // Registered stations grouped by constituency; district/region resolved
        // from the real EC seed data (the on-chain Station struct doesn't store
        // them — no need to, since constituency name alone determines both).
        const stations = await Promise.all(regIds.map(id => c.getStation(id)));
        const byConst = new Map();
        for (const s of stations) {
          const key = s.constituency;
          if (!byConst.has(key)) {
            const info = getConstituencyInfo(key);
            byConst.set(key, {
              name: key,
              district: info.district,
              region: info.region,
              registeredStations: 0, reportedStations: 0,
              totals: new Array(cs.length).fill(0n), grandTotal: 0n,
            });
          }
          const entry = byConst.get(key);
          entry.registeredStations += 1;
          if (s.submitted) entry.reportedStations += 1;
        }

        // Submitted results — accumulate votes per constituency + grand totals
        const grandTotals = new Array(cs.length).fill(0n);
        if (subIds.length > 0) {
          const results = await Promise.all(subIds.map(id => c.getResult(id)));
          const stationConst = new Map(stations.map(s => [s.stationId, s.constituency]));
          for (const r of results) {
            const constName = stationConst.get(r.stationId);
            if (!constName || !byConst.has(constName)) continue;
            const entry = byConst.get(constName);
            r.votes.forEach((v, i) => {
              entry.totals[i] = (entry.totals[i] || 0n) + BigInt(v);
              grandTotals[i] = (grandTotals[i] || 0n) + BigInt(v);
            });
            entry.grandTotal += r.votes.reduce((s, v) => s + BigInt(v), 0n);
          }
        }

        const constData = Array.from(byConst.values()).map(e => ({
          ...e,
          reported: e.reportedStations, // alias — keeps exportPDF.js field names unchanged
          locked: e.registeredStations > 0 && e.reportedStations === e.registeredStations, // "fully reported"
        }));

        setConstituencies(constData);
        setTotals(grandTotals);
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [contract]);

  async function handleSetStatus(newStatus) {
    if (electionStatus === newStatus) return;
    if (!contract) { alert("Contract not connected. Please reconnect your wallet."); return; }

    const labels = { 0: "Setup", 1: "Active", 2: "Closed" };
    const confirmed = window.confirm(
      `Change election status to "${labels[newStatus]}"?\n\n` +
      (newStatus === 1 ? "Once Active, officer/station registration and removal are locked. " : "") +
      (newStatus === 2 ? "Closing the election prevents any further result submissions." : "")
    );
    if (!confirmed) return;

    setStatusLoading(true);
    try {
      const tx = await contract.setStatus(newStatus);
      await tx.wait();
      setElectionStatus(newStatus);
    } catch (err) {
      console.error("Status update failed:", err);
      alert("Failed: " + (err.reason || err.shortMessage || err.message));
    } finally {
      setStatusLoading(false);
    }
  }

  const grandTotal = totals.reduce((s, v) => s + v, 0n);
  const fullyReportedCount = constituencies.filter(c => c.locked).length;

  if (loading) return (
    <div className="loading-state" style={{ paddingTop: "80px" }}>
      <div className="spinner" /> Loading dashboard...
    </div>
  );

  return (
    <div className="page-wrap">
      <div className="page-header">
        <span className="eyebrow">2024 Presidential Election - EC Ghana</span>
        <h1 className="page-title">Collation Dashboard</h1>
        <div className="page-sub">
          <span className="live-dot" />
          Live - Polygon Amoy -
          <span style={{ color: "var(--gold)" }}>
            {electionStatus !== null ? ELECTION_STATUS[electionStatus] : "-"}
          </span>
        </div>
      </div>

      {isChair && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>

          <div style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: "var(--r-md)", padding: "12px 16px",
            display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap",
          }}>
            <div>
              <div style={{ fontSize: "10px", color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "3px" }}>
                Election Status
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                {[
                  { value: 0, label: "Setup",  color: "var(--text2)" },
                  { value: 1, label: "Active", color: "var(--accent2)" },
                  { value: 2, label: "Closed", color: "#f87171" },
                ].map(s => (
                  <button
                    key={s.value}
                    onClick={() => handleSetStatus(s.value)}
                    disabled={statusLoading || electionStatus === s.value}
                    style={{
                      padding: "5px 12px", borderRadius: "20px", fontSize: "10px", fontWeight: 600,
                      cursor: electionStatus === s.value ? "default" : "pointer",
                      border: electionStatus === s.value ? `1px solid ${s.color}` : "1px solid var(--border)",
                      background: electionStatus === s.value ? `${s.color}20` : "var(--bg2)",
                      color: electionStatus === s.value ? s.color : "var(--text2)",
                      opacity: statusLoading ? 0.5 : 1,
                    }}
                  >
                    {electionStatus === s.value ? `● ${s.label}` : s.label}
                  </button>
                ))}
              </div>
            </div>
            {statusLoading && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "var(--text2)" }}>
                <div className="spinner" style={{ width: "14px", height: "14px" }} />
                Updating...
              </div>
            )}
          </div>

          <button
            className="btn btn-secondary"
            onClick={() => exportResultsPDF(
              candidates, totals, constituencies, submittedCount, ELECTION_STATUS[electionStatus] || "Active"
            )}
            style={{ display: "flex", alignItems: "center", gap: "7px", fontSize: "12px" }}
          >
            Download PDF Report
          </button>
        </div>
      )}

      <div className="grid-4" style={{ marginBottom: "20px" }}>
        <StatCard label="Stations Submitted"  value={formatNumber(submittedCount)}            sub={`of ${registeredCount} registered`} accentColor="var(--accent2)" />
        <StatCard label="Constituencies"      value={formatNumber(constituencies.length)}     sub={fullyReportedCount + " fully reported"} accentColor="var(--gold)" />
        <StatCard label="Total Votes Counted" value={formatNumber(grandTotal)}                sub="final — immutable"      accentColor="var(--blue)" />
        <StatCard label="Election Status"     value={ELECTION_STATUS[electionStatus] || "-"}  sub="current phase"          accentColor="var(--red)" />
      </div>

      <div className="grid-2" style={{ marginBottom: "16px" }}>
        <div className="panel">
          <div className="panel-title">
            <div className="dot" style={{ background: "var(--gold)" }} />
            Presidential Standings
          </div>
          {candidates.length === 0 ? (
            <div style={{ color: "var(--text2)", fontSize: "12px", textAlign: "center", padding: "20px 0" }}>
              No candidates registered yet
            </div>
          ) : (
            <>
              {grandTotal === 0n && (
                <div style={{ color: "var(--text2)", fontSize: "11px", marginBottom: "10px" }}>
                  No results submitted yet — standings will appear as stations report
                </div>
              )}
              {candidates.map((c, i) => (
                <CandidateBar key={c.party} name={c.name} party={c.party} votes={totals[i] || 0n} total={grandTotal} color={c.color} />
              ))}
            </>
          )}
        </div>

        <div className="panel">
          <div className="panel-title">
            <div className="dot" style={{ background: "var(--accent2)" }} />
            Constituency Progress
          </div>
          {constituencies.length === 0 ? (
            <div style={{ color: "var(--text2)", fontSize: "12px", textAlign: "center", padding: "20px 0" }}>
              No stations registered yet
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {constituencies.slice(0, 12).map(c => (
                <div key={c.name} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px" }}>
                  <span style={{ width: "130px", color: "var(--text2)", flexShrink: 0, fontSize: "10px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.name}
                  </span>
                  <div style={{ flex: 1, background: "var(--border)", borderRadius: "3px", height: "5px", overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: c.registeredStations > 0 ? `${(c.reportedStations / c.registeredStations) * 100}%` : "0%",
                      background: c.locked ? "var(--accent2)" : "var(--gold)",
                      borderRadius: "3px",
                    }} />
                  </div>
                  <span style={{ fontFamily: "DM Mono,monospace", fontSize: "10px", color: "var(--text)", width: "40px", textAlign: "right" }}>
                    {c.reportedStations}/{c.registeredStations}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="panel">
        <div className="panel-title">
          <div className="dot" style={{ background: "var(--blue)" }} />
          Live On-Chain Activity
        </div>
        <ActivityFeed events={events} loading={eventsLoading} />
      </div>
    </div>
  );
}