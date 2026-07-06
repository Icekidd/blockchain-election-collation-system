import React, { useEffect, useState } from "react";
import { useWallet } from "../context/WalletContext.jsx";
import { getReadOnlyContract, ELECTION_STATUS } from "../utils/contract.js";
import { formatNumber } from "../utils/format.js";
import { CANDIDATES } from "../data/ghana.js";
import StatCard from "../components/StatCard.jsx";
import CandidateBar from "../components/CandidateBar.jsx";
import ActivityFeed from "../components/ActivityFeed.jsx";
import { useEvents } from "../hooks/useEvents.js";
import { exportResultsPDF } from "../utils/exportPDF.js";

export default function Dashboard() {
  const { contract, role } = useWallet();
  const { events, loading: eventsLoading } = useEvents();
  const [stats, setStats] = useState(null);
  const [totals, setTotals] = useState([]);
  const [constituencies, setConstituencies] = useState([]);
  const [electionStatus, setElectionStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const c = contract || getReadOnlyContract();
        const [stationIds, constNames, status] = await Promise.all([
          c.getAllStationIds(),
          c.getAllConstituencies(),
          c.getElectionStatus(),
        ]);
        setElectionStatus(Number(status));
        const grandTotals = new Array(CANDIDATES.length).fill(0n);
        const constData = [];
        for (const name of constNames) {
          const [t, grand] = await c.getConstituencyTotal(name);
          const info = await c.getConstituency(name);
          constData.push({ name, totals: t, grandTotal: grand, locked: info.locked, reported: Number(info.reportedStations) });
          t.forEach((v, i) => { grandTotals[i] += BigInt(v); });
        }
        setConstituencies(constData);
        setTotals(grandTotals);
        setStats({ stationCount: stationIds.length, constCount: constNames.length });
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    }

    async function handleSetStatus(newStatus) {
      if (electionStatus === newStatus) return;
      const labels = { 0: "Setup", 1: "Active", 2: "Collating", 3: "Closed" };
      const confirm = window.confirm(
        `Change election status to "${labels[newStatus]}"?\n\n` +
        (newStatus === 3 ? "WARNING: Closing the election will prevent further submissions." : "")
      );
      if (!confirm) return;

      setStatusLoading(true);
      try {
        const tx = await contract.setElectionStatus(newStatus);
        await tx.wait();
        setElectionStatus(newStatus);
      } catch (err) {
        console.error("Status update failed:", err);
        alert("Failed to update status: " + (err.reason || err.message));
      } finally {
        setStatusLoading(false);
      }
    }

    load();
  }, [contract]);

  const grandTotal = totals.reduce((s, v) => s + v, 0n);
  const lockedCount = constituencies.filter(c => c.locked).length;

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

      {role === "SENIOR" && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
          
          {/* Election status control */}
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
                  { value: 0, label: "Setup",      color: "var(--text2)"   },
                  { value: 1, label: "Active",     color: "var(--accent2)" },
                  { value: 2, label: "Collating",  color: "var(--gold)"    },
                  { value: 3, label: "Closed",     color: "#f87171"        },
                ].map(s => (
                  <button
                    key={s.value}
                    onClick={() => handleSetStatus(s.value)}
                    disabled={statusLoading || electionStatus === s.value}
                    style={{
                      padding: "5px 12px", borderRadius: "20px", fontSize: "10px", fontWeight: 600,
                      cursor: electionStatus === s.value ? "default" : "pointer",
                      border: electionStatus === s.value
                        ? `1px solid ${s.color}`
                        : "1px solid var(--border)",
                      background: electionStatus === s.value
                        ? `${s.color}20`
                        : "var(--bg2)",
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

          {/* PDF export button */}
          <button
            className="btn btn-secondary"
            onClick={() => exportResultsPDF(
              CANDIDATES,
              totals,
              constituencies,
              stats?.stationCount || 0,
              ELECTION_STATUS[electionStatus] || "Active"
            )}
            style={{ display: "flex", alignItems: "center", gap: "7px", fontSize: "12px" }}
          >
            Download PDF Report
          </button>
        </div>
      )}

      <div className="grid-4" style={{ marginBottom: "20px" }}>
        <StatCard label="Stations Reported"   value={formatNumber(stats?.stationCount || 0)} sub="polling stations"        accentColor="var(--accent2)" />
        <StatCard label="Constituencies"      value={formatNumber(constituencies.length)}     sub={lockedCount + " locked"} accentColor="var(--gold)" />
        <StatCard label="Total Votes Counted" value={formatNumber(grandTotal)}                sub="confirmed only"          accentColor="var(--blue)" />
        <StatCard label="Election Status"     value={ELECTION_STATUS[electionStatus] || "-"} sub="current phase"           accentColor="var(--red)" />
      </div>

      <div className="grid-2" style={{ marginBottom: "16px" }}>
        <div className="panel">
          <div className="panel-title">
            <div className="dot" style={{ background: "var(--gold)" }} />
            Presidential Standings
          </div>
          {grandTotal === 0n ? (
            <div style={{ color: "var(--text2)", fontSize: "12px", textAlign: "center", padding: "20px 0" }}>
              No confirmed results yet
            </div>
          ) : (
            CANDIDATES.map((c, i) => (
              <CandidateBar
                key={c.party}
                name={c.name}
                party={c.party}
                votes={totals[i] || 0n}
                total={grandTotal}
                color={c.color}
              />
            ))
          )}
        </div>

        <div className="panel">
          <div className="panel-title">
            <div className="dot" style={{ background: "var(--accent2)" }} />
            Constituency Progress
          </div>
          {constituencies.length === 0 ? (
            <div style={{ color: "var(--text2)", fontSize: "12px", textAlign: "center", padding: "20px 0" }}>
              No data yet
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
                      width: c.locked ? "100%" : (c.reported > 0 ? "60%" : "0%"),
                      background: c.locked ? "var(--accent2)" : "var(--gold)",
                      borderRadius: "3px",
                    }} />
                  </div>
                  <span style={{ fontFamily: "DM Mono,monospace", fontSize: "10px", color: "var(--text)", width: "28px", textAlign: "right" }}>
                    {c.locked ? "Lock" : c.reported}
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