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
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "12px" }}>
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