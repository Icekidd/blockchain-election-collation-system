import React, { useEffect, useState } from "react";
import { useWallet } from "../context/WalletContext.jsx";
import { getReadOnlyContract, ELECTION_STATUS } from "../utils/contract.js";
import { formatNumber, percentage } from "../utils/format.js";
import { getConstituencyInfo, TOTAL_CONSTITUENCIES } from "../data/constituencyLookup.js";
import GhanaMap from "../components/GhanaMap.jsx";

export default function ConstituencyMap() {
  const { contract } = useWallet();
  const [candidates,     setCandidates]     = useState([]);
  const [constituencies, setConstituencies] = useState([]);
  const [totals,         setTotals]         = useState([]);
  const [grandTotal,     setGrandTotal]     = useState(0n);
  const [electionStatus, setElectionStatus] = useState(null);
  const [registeredCount, setRegisteredCount] = useState(0);
  const [submittedCount,  setSubmittedCount]  = useState(0);
  const [loading,        setLoading]        = useState(true);
  const [filter,         setFilter]         = useState("ALL");
  const [search,         setSearch]         = useState("");
  const [regionFilter,   setRegionFilter]   = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const c = contract || getReadOnlyContract();
        const [status, candCount, regIds, subIds] = await Promise.all([
          c.status(),
          c.getCandidateCount(),
          c.getAllStationIds(),
          c.getSubmittedStationIds(),
        ]);
        setElectionStatus(Number(status));
        setRegisteredCount(regIds.length);
        setSubmittedCount(subIds.length);

        const cs = [];
        for (let i = 0; i < Number(candCount); i++) {
          const cand = await c.candidates(i);
          cs.push({ name: cand.name, party: cand.party, color: cand.color });
        }
        setCandidates(cs);

        const stations = await Promise.all(regIds.map(id => c.getStation(id)));
        const byConst = new Map();
        for (const s of stations) {
          const key = s.constituency;
          if (!byConst.has(key)) {
            const info = getConstituencyInfo(key);
            byConst.set(key, {
              name: key, district: info.district, region: info.region,
              registeredStations: 0, reportedStations: 0,
              votes: new Array(cs.length).fill(0n), total: 0n,
            });
          }
          const entry = byConst.get(key);
          entry.registeredStations += 1;
          if (s.submitted) entry.reportedStations += 1;
        }

        const grand = new Array(cs.length).fill(0n);
        if (subIds.length > 0) {
          const results = await Promise.all(subIds.map(id => c.getResult(id)));
          const stationConst = new Map(stations.map(s => [s.stationId, s.constituency]));
          for (const r of results) {
            const constName = stationConst.get(r.stationId);
            if (!constName || !byConst.has(constName)) continue;
            const entry = byConst.get(constName);
            r.votes.forEach((v, i) => {
              entry.votes[i] = (entry.votes[i] || 0n) + BigInt(v);
              grand[i] = (grand[i] || 0n) + BigInt(v);
            });
            entry.total += r.votes.reduce((s, v) => s + BigInt(v), 0n);
          }
        }

        const constData = Array.from(byConst.values()).map(e => ({
          ...e,
          reported: e.reportedStations, // GhanaMap expects this field name
          locked: e.registeredStations > 0 && e.reportedStations === e.registeredStations, // "fully reported"
        }));

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

  const fullyReportedCount = constituencies.filter(c => c.locked).length;
  const inProgressCount    = constituencies.filter(c => !c.locked && c.reportedStations > 0).length;
  const notStartedCount    = constituencies.filter(c => c.reportedStations === 0).length;

  const filtered = constituencies
    .filter(c => {
      if (filter === "FULLY_REPORTED") return c.locked;
      if (filter === "IN_PROGRESS")    return !c.locked && c.reportedStations > 0;
      if (filter === "NOT_STARTED")    return c.reportedStations === 0;
      return true;
    })
    .filter(c => !regionFilter || c.region === regionFilter)
    .filter(c =>
      search === "" ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.district?.toLowerCase().includes(search.toLowerCase()) ||
      c.region?.toLowerCase().includes(search.toLowerCase())
    );

  if (loading) return (
    <div className="loading-state" style={{ paddingTop: "80px" }}>
      <div className="spinner" /> Loading constituency data...
    </div>
  );

  return (
    <div className="page-wrap">
      <div className="page-header">
        <span className="eyebrow">Live Collation Progress</span>
        <h1 className="page-title">Constituency Progress Map</h1>
        <div className="page-sub">
          <span className="live-dot" />
          {constituencies.length} of {TOTAL_CONSTITUENCIES} constituencies have registered stations · Auto-refreshes every 30 seconds
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid-4" style={{ marginBottom: "20px" }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "14px 16px" }}>
          <div style={{ fontSize: "10px", color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>Total Constituencies</div>
          <div style={{ fontSize: "26px", fontWeight: 700, color: "var(--text2)", fontFamily: "DM Mono,monospace" }}>{TOTAL_CONSTITUENCIES}</div>
          <div style={{ fontSize: "10px", color: "var(--text2)", marginTop: "2px" }}>EC Ghana official count</div>
        </div>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "14px 16px" }}>
          <div style={{ fontSize: "10px", color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>Stations Registered</div>
          <div style={{ fontSize: "26px", fontWeight: 700, color: "#3b82f6", fontFamily: "DM Mono,monospace" }}>{registeredCount}</div>
          <div style={{ fontSize: "10px", color: "#3b82f6", marginTop: "2px" }}>across {constituencies.length} constituencies</div>
        </div>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "14px 16px" }}>
          <div style={{ fontSize: "10px", color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>Stations Submitted</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
            <div style={{ fontSize: "26px", fontWeight: 700, color: "var(--gold)", fontFamily: "DM Mono,monospace" }}>{submittedCount}</div>
            <div style={{ fontSize: "13px", color: "var(--text2)", fontFamily: "DM Mono,monospace" }}>/ {registeredCount}</div>
          </div>
          <div style={{ fontSize: "10px", color: "var(--gold)", marginTop: "2px" }}>
            {registeredCount > 0 ? Math.round((submittedCount / registeredCount) * 100) : 0}% of registered
          </div>
        </div>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "14px 16px" }}>
          <div style={{ fontSize: "10px", color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>Fully Reported</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
            <div style={{ fontSize: "26px", fontWeight: 700, color: "var(--accent2)", fontFamily: "DM Mono,monospace" }}>{fullyReportedCount}</div>
            <div style={{ fontSize: "13px", color: "var(--text2)", fontFamily: "DM Mono,monospace" }}>/ {constituencies.length}</div>
          </div>
          <div style={{ fontSize: "10px", color: "var(--accent2)", marginTop: "2px" }}>constituencies complete</div>
        </div>
      </div>

      {/* Ghana map */}
      <div className="panel" style={{ marginBottom: "16px" }}>
        <div className="panel-title">
          <div className="dot" style={{ background: "var(--gold)" }} />
          Election Collation Progress
        </div>

        <GhanaMap constituencies={constituencies} selectedRegion={regionFilter} onSelectRegion={setRegionFilter} />

        {/* Submitted progress */}
        <div style={{ marginBottom: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", marginBottom: "4px" }}>
            <span style={{ color: "#3b82f6", fontWeight: 600 }}>Stations Submitted</span>
            <span style={{ fontFamily: "DM Mono,monospace", color: "var(--bright)" }}>
              {submittedCount} / {registeredCount}
              <span style={{ color: "#3b82f6", marginLeft: "6px" }}>
                ({registeredCount > 0 ? Math.round((submittedCount / registeredCount) * 100) : 0}%)
              </span>
            </span>
          </div>
          <div style={{ background: "var(--bg2)", borderRadius: "4px", height: "10px", overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: "4px",
              width: registeredCount > 0 ? `${(submittedCount / registeredCount) * 100}%` : "0%",
              background: "linear-gradient(90deg, #1d4ed8, #3b82f6)", transition: "width 0.8s ease",
            }} />
          </div>
        </div>

        {/* Fully reported progress */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", marginBottom: "4px" }}>
            <span style={{ color: "var(--accent2)", fontWeight: 600 }}>Constituencies Fully Reported</span>
            <span style={{ fontFamily: "DM Mono,monospace", color: "var(--bright)" }}>
              {fullyReportedCount} / {TOTAL_CONSTITUENCIES}
              <span style={{ color: "var(--accent2)", marginLeft: "6px" }}>
                ({Math.round((fullyReportedCount / TOTAL_CONSTITUENCIES) * 100)}%)
              </span>
            </span>
          </div>
          <div style={{ background: "var(--bg2)", borderRadius: "4px", height: "10px", overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: "4px",
              width: `${(fullyReportedCount / TOTAL_CONSTITUENCIES) * 100}%`,
              background: "linear-gradient(90deg, #005838, var(--accent2))", transition: "width 0.8s ease",
            }} />
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginTop: "14px" }}>
          {[
            { color: "var(--accent2)", label: `${fullyReportedCount} Fully Reported` },
            { color: "var(--gold)",    label: `${inProgressCount} In Progress` },
            { color: "#f87171",        label: `${notStartedCount} Not Started` },
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
            Current Standings · {formatNumber(grandTotal)} total votes
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" }}>
            {candidates
              .map((c, i) => ({ ...c, votes: totals[i] || 0n }))
              .sort((a, b) => (b.votes > a.votes ? 1 : -1))
              .map((c, rank) => (
                <div key={c.party} style={{
                  background: "var(--bg2)",
                  border: `1px solid ${rank === 0 ? "rgba(0,146,79,0.3)" : "var(--border)"}`,
                  borderLeft: `3px solid ${c.color}`,
                  borderRadius: "var(--r-sm)", padding: "10px 12px",
                }}>
                  {rank === 0 && (
                    <div style={{ fontSize: "8px", color: "var(--accent2)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "3px" }}>
                      Leading
                    </div>
                  )}
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--bright)" }}>{c.name}</div>
                  <div style={{ fontSize: "9px", color: c.color, textTransform: "uppercase", fontWeight: 700 }}>{c.party}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px", alignItems: "baseline" }}>
                    <span style={{ fontSize: "18px", fontWeight: 700, color: "var(--bright)", fontFamily: "DM Mono,monospace" }}>
                      {formatNumber(c.votes)}
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--text2)" }}>{percentage(c.votes, grandTotal)}%</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Search and filters */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "14px", flexWrap: "wrap", alignItems: "center" }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search constituency, district or region..."
          style={{
            flex: 1, minWidth: "200px", padding: "7px 12px",
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: "var(--r-sm)", color: "var(--bright)", fontSize: "12px",
            fontFamily: "DM Sans,sans-serif", outline: "none", boxShadow: "0 0 0 1px var(--border2)",
          }}
        />
        {[
          { key: "ALL",             label: `All (${constituencies.length})` },
          { key: "FULLY_REPORTED",  label: `Fully Reported (${fullyReportedCount})` },
          { key: "IN_PROGRESS",     label: `In Progress (${inProgressCount})` },
          { key: "NOT_STARTED",     label: `Not Started (${notStartedCount})` },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{
            padding: "6px 13px", borderRadius: "20px", fontSize: "10px", fontWeight: 600,
            border: filter === f.key ? "1px solid rgba(252,209,22,0.35)" : "1px solid var(--border)",
            background: filter === f.key ? "rgba(252,209,22,0.1)" : "var(--surface)",
            color: filter === f.key ? "var(--gold)" : "var(--text2)",
            cursor: "pointer", fontFamily: "DM Mono,monospace", whiteSpace: "nowrap",
          }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Constituency cards */}
      {filtered.length === 0 ? (
        <div className="panel" style={{ textAlign: "center", padding: "32px", color: "var(--text2)", fontSize: "12px" }}>
          {search ? `No results for "${search}"` : "No constituencies match this filter"}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "10px" }}>
          {filtered.map(c => {
            const leadingIndex = c.votes && c.votes.length > 0
              ? c.votes.reduce((maxI, v, i) => BigInt(v) > BigInt(c.votes[maxI]) ? i : maxI, 0)
              : -1;
            const leading = leadingIndex >= 0 ? candidates[leadingIndex] : null;
            const hasVotes = c.total && c.total > 0n;
            const pct = c.registeredStations > 0 ? Math.round((c.reportedStations / c.registeredStations) * 100) : 0;

            return (
              <div key={c.name} style={{
                background: "var(--surface)",
                border: `1px solid ${c.locked ? "rgba(0,146,79,0.3)" : c.reportedStations > 0 ? "rgba(252,209,22,0.2)" : "var(--border)"}`,
                borderRadius: "var(--r-md)", padding: "14px",
                transition: "border-color 0.2s",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <div style={{ flex: 1, minWidth: 0, paddingRight: "8px" }}>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--bright)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {c.name}
                    </div>
                    <div style={{ fontSize: "10px", color: "var(--text2)", marginTop: "1px" }}>{c.district}</div>
                    <div style={{ fontSize: "9px", color: "var(--text3)", marginTop: "1px" }}>{c.region}</div>
                  </div>
                  <span className={`pill ${c.locked ? "ok" : c.reportedStations > 0 ? "pend" : "flag"}`} style={{ flexShrink: 0 }}>
                    {c.locked ? "Fully Reported" : c.reportedStations > 0 ? "In Progress" : "Not Started"}
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px", marginBottom: "8px" }}>
                  <div style={{ background: "var(--bg2)", borderRadius: "var(--r-sm)", padding: "6px 8px", textAlign: "center" }}>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--bright)", fontFamily: "DM Mono,monospace" }}>{c.registeredStations}</div>
                    <div style={{ fontSize: "9px", color: "var(--text2)", marginTop: "1px" }}>Registered</div>
                  </div>
                  <div style={{ background: "var(--bg2)", borderRadius: "var(--r-sm)", padding: "6px 8px", textAlign: "center" }}>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--accent2)", fontFamily: "DM Mono,monospace" }}>{c.reportedStations}</div>
                    <div style={{ fontSize: "9px", color: "var(--text2)", marginTop: "1px" }}>Submitted</div>
                  </div>
                  <div style={{ background: "var(--bg2)", borderRadius: "var(--r-sm)", padding: "6px 8px", textAlign: "center" }}>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--gold)", fontFamily: "DM Mono,monospace" }}>{pct}%</div>
                    <div style={{ fontSize: "9px", color: "var(--text2)", marginTop: "1px" }}>Complete</div>
                  </div>
                </div>

                <div style={{ marginBottom: "6px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", color: "var(--text2)", marginBottom: "3px" }}>
                    <span>Reporting progress</span>
                    <span style={{ fontFamily: "DM Mono,monospace" }}>{c.reportedStations}/{c.registeredStations} stations</span>
                  </div>
                  <div style={{ background: "var(--border)", borderRadius: "3px", height: "4px", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: "3px", width: `${pct}%`,
                      background: c.locked ? "var(--accent2)" : pct > 0 ? "linear-gradient(90deg, var(--gold), var(--accent2))" : "var(--border2)",
                      transition: "width 0.6s ease",
                    }} />
                  </div>
                </div>

                {hasVotes && leading && (
                  <div style={{ display: "flex", alignItems: "center", gap: "5px", padding: "5px 8px", borderRadius: "var(--r-sm)", background: "var(--bg2)", marginTop: "4px" }}>
                    <div style={{ width: "6px", height: "6px", borderRadius: "2px", background: leading.color, flexShrink: 0 }} />
                    <span style={{ fontSize: "9px", color: "var(--text2)" }}>Leading:</span>
                    <span style={{ fontSize: "9px", color: leading.color, fontWeight: 700 }}>{leading.name} ({leading.party})</span>
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