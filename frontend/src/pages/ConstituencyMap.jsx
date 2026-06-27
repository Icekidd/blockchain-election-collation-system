import React, { useEffect, useState } from "react";
import { useWallet } from "../context/WalletContext.jsx";
import { getReadOnlyContract, ELECTION_STATUS } from "../utils/contract.js";
import { CANDIDATES } from "../data/ghana.js";
import { formatNumber, percentage } from "../utils/format.js";

export default function ConstituencyMap() {
  const { contract } = useWallet();
  const [constituencies, setConstituencies] = useState([]);
  const [totals,         setTotals]         = useState([]);
  const [grandTotal,     setGrandTotal]     = useState(0n);
  const [electionStatus, setElectionStatus] = useState(null);
  const [stationCount,   setStationCount]   = useState(0);
  const [loading,        setLoading]        = useState(true);
  const [filter,         setFilter]         = useState("ALL");

  useEffect(() => {
    async function load() {
      try {
        const c = contract || getReadOnlyContract();
        const [ids, constNames, status] = await Promise.all([
          c.getAllStationIds(),
          c.getAllConstituencies(),
          c.getElectionStatus(),
        ]);
        setStationCount(ids.length);
        setElectionStatus(Number(status));

        const grand = new Array(CANDIDATES.length).fill(0n);
        const constData = [];

        for (const name of constNames) {
          const [t, grandT] = await c.getConstituencyTotal(name);
          const info = await c.getConstituency(name);
          constData.push({
            name,
            district: info.district,
            region:   info.region,
            locked:   info.locked,
            reported: Number(info.reportedStations),
            total:    grandT,
            votes:    t,
          });
          t.forEach((v, i) => { grand[i] += BigInt(v); });
        }

        setConstituencies(constData);
        setTotals(grand);
        setGrandTotal(grand.reduce((s, v) => s + v, 0n));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [contract]);

  const filtered = constituencies.filter(c => {
    if (filter === "LOCKED")      return c.locked;
    if (filter === "IN_PROGRESS") return !c.locked && c.reported > 0;
    if (filter === "PENDING")     return c.reported === 0;
    return true;
  });

  const lockedCount    = constituencies.filter(c => c.locked).length;
  const inProgressCount = constituencies.filter(c => !c.locked && c.reported > 0).length;
  const pendingCount   = constituencies.filter(c => c.reported === 0).length;

  if (loading) return (
    <div className="loading-state" style={{ paddingTop: "80px" }}>
      <div className="spinner" /> Loading constituency data...
    </div>
  );

  return (
    <div className="page-wrap">
      <div className="page-header">
        <span className="eyebrow">Live Collation Progress</span>
        <h1 className="page-title">Constituency Progress</h1>
        <div className="page-sub">
          <span className="live-dot" />
          {constituencies.length} constituencies · Updates every 30 seconds
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid-4" style={{ marginBottom: "20px" }}>
        {[
          { label: "Total Constituencies", value: constituencies.length,  color: "var(--text2)" },
          { label: "Locked",               value: lockedCount,            color: "var(--accent2)" },
          { label: "In Progress",          value: inProgressCount,        color: "var(--gold)" },
          { label: "Pending",              value: pendingCount,           color: "#f87171" },
        ].map(s => (
          <div key={s.label} style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: "var(--r-md)", padding: "14px 16px",
          }}>
            <div style={{ fontSize: "10px", color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>{s.label}</div>
            <div style={{ fontSize: "26px", fontWeight: 700, color: s.color, fontFamily: "DM Mono,monospace" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Overall progress bar */}
      <div className="panel" style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text2)", marginBottom: "8px" }}>
          <span>Overall Collation Progress</span>
          <span style={{ fontFamily: "DM Mono,monospace", color: "var(--bright)" }}>
            {constituencies.length > 0 ? Math.round((lockedCount / constituencies.length) * 100) : 0}% complete
          </span>
        </div>
        <div style={{ background: "var(--bg2)", borderRadius: "4px", height: "10px", overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: "4px",
            width: constituencies.length > 0 ? `${(lockedCount / constituencies.length) * 100}%` : "0%",
            background: "linear-gradient(90deg, #005838, var(--accent2))",
            transition: "width 0.8s ease",
          }} />
        </div>
        <div style={{ display: "flex", gap: "16px", marginTop: "8px", flexWrap: "wrap" }}>
          {[
            { color: "var(--accent2)", label: `${lockedCount} Locked` },
            { color: "var(--gold)",    label: `${inProgressCount} In Progress` },
            { color: "#f87171",        label: `${pendingCount} Pending` },
          ].map(l => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "10px", color: "var(--text2)" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: l.color, flexShrink: 0 }} />
              {l.label}
            </div>
          ))}
        </div>
      </div>

      {/* Candidate totals */}
      {grandTotal > 0n && (
        <div className="panel" style={{ marginBottom: "16px" }}>
          <div className="panel-title">
            <div className="dot" style={{ background: "var(--gold)" }} />
            Current Standings · {formatNumber(grandTotal)} votes counted
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" }}>
            {CANDIDATES
              .map((c, i) => ({ ...c, votes: totals[i] || 0n }))
              .sort((a, b) => (b.votes > a.votes ? 1 : -1))
              .map((c, rank) => (
                <div key={c.party} style={{
                  background: "var(--bg2)", border: `1px solid ${rank === 0 ? "rgba(0,146,79,0.3)" : "var(--border)"}`,
                  borderLeft: `3px solid ${c.color}`, borderRadius: "var(--r-sm)", padding: "10px 12px",
                }}>
                  {rank === 0 && <div style={{ fontSize: "8px", color: "var(--accent2)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "3px" }}>Leading</div>}
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--bright)" }}>{c.name}</div>
                  <div style={{ fontSize: "9px", color: c.color, textTransform: "uppercase", fontWeight: 700 }}>{c.party}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px", alignItems: "baseline" }}>
                    <span style={{ fontSize: "18px", fontWeight: 700, color: "var(--bright)", fontFamily: "DM Mono,monospace" }}>{formatNumber(c.votes)}</span>
                    <span style={{ fontSize: "11px", color: "var(--text2)" }}>{percentage(c.votes, grandTotal)}%</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Filter chips */}
      <div style={{ display: "flex", gap: "7px", marginBottom: "14px", flexWrap: "wrap" }}>
        {[
          { key: "ALL",         label: `All (${constituencies.length})` },
          { key: "LOCKED",      label: `Locked (${lockedCount})` },
          { key: "IN_PROGRESS", label: `In Progress (${inProgressCount})` },
          { key: "PENDING",     label: `Pending (${pendingCount})` },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{
            padding: "5px 13px", borderRadius: "20px", fontSize: "10px", fontWeight: 600,
            border: filter === f.key ? "1px solid rgba(252,209,22,0.35)" : "1px solid var(--border)",
            background: filter === f.key ? "rgba(252,209,22,0.1)" : "var(--surface)",
            color: filter === f.key ? "var(--gold)" : "var(--text2)",
            cursor: "pointer", fontFamily: "DM Mono,monospace",
          }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Constituency list */}
      {filtered.length === 0 ? (
        <div className="panel" style={{ textAlign: "center", padding: "32px", color: "var(--text2)", fontSize: "12px" }}>
          No constituencies match this filter yet
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "10px" }}>
          {filtered.map(c => {
            const leading = c.votes
              ? CANDIDATES[c.votes.reduce((maxI, v, i) => BigInt(v) > BigInt(c.votes[maxI]) ? i : maxI, 0)]
              : null;
            return (
              <div key={c.name} style={{
                background: "var(--surface)",
                border: `1px solid ${c.locked ? "rgba(0,146,79,0.3)" : c.reported > 0 ? "rgba(252,209,22,0.2)" : "var(--border)"}`,
                borderRadius: "var(--r-md)", padding: "14px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--bright)" }}>{c.name}</div>
                    <div style={{ fontSize: "10px", color: "var(--text2)" }}>{c.district} · {c.region}</div>
                  </div>
                  <span className={`pill ${c.locked ? "ok" : c.reported > 0 ? "pend" : "flag"}`}>
                    {c.locked ? "Locked" : c.reported > 0 ? "Active" : "Pending"}
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--text2)", marginBottom: "4px" }}>
                  <span>{c.reported} stations reported</span>
                  <span style={{ fontFamily: "DM Mono,monospace", color: "var(--bright)" }}>{formatNumber(c.total)} votes</span>
                </div>

                {leading && Number(c.total) > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "6px", fontSize: "10px" }}>
                    <div style={{ width: "6px", height: "6px", borderRadius: "2px", background: leading.color, flexShrink: 0 }} />
                    <span style={{ color: "var(--text2)" }}>Leading:</span>
                    <span style={{ color: leading.color, fontWeight: 600 }}>{leading.name} ({leading.party})</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}