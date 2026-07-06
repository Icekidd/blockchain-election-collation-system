import React, { useEffect, useState } from "react";
import { useWallet } from "../context/WalletContext.jsx";
import { getReadOnlyContract, ELECTION_STATUS } from "../utils/contract.js";
// import { CANDIDATES } from "../data/ghana.js";
import { formatNumber, percentage } from "../utils/format.js";
import { useCandidates } from "../hooks/useCandidates.js";

export default function ConstituencyMap() {
  const { contract } = useWallet();
  const [constituencies, setConstituencies] = useState([]);
  const [totals,         setTotals]         = useState([]);
  const [grandTotal,     setGrandTotal]     = useState(0n);
  const [electionStatus, setElectionStatus] = useState(null);
  const [stationCount,   setStationCount]   = useState(0);
  const [loading,        setLoading]        = useState(true);
  const [filter,         setFilter]         = useState("ALL");
  const [search,         setSearch]         = useState("");
  const { candidates: CANDIDATES } = useCandidates();

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

        // Get all station IDs to count confirmed per constituency
        const allIds = await c.getAllStationIds();
        const allResults = await Promise.all(allIds.map(id => c.getResult(id)));

        for (const name of constNames) {
            const [t, grandT] = await c.getConstituencyTotal(name);
            const info = await c.getConstituency(name);

            // Count submitted and confirmed stations for this constituency
            const constStations = allResults.filter(r =>
                r.constituency === name
            );
            const submittedCount = constStations.length;
            const confirmedCount = constStations.filter(r => Number(r.status) === 1 || Number(r.status) === 3).length;
            const totalStationsInConst = Number(info.reportedStations);
            const confirmedPct = submittedCount > 0
                ? Math.round((confirmedCount / submittedCount) * 100)
                : 0;

            constData.push({
                name,
                district:      info.district,
                region:        info.region,
                locked:        info.locked,
                reported:      submittedCount,
                confirmed:     confirmedCount,
                confirmedPct,
                total:         grandT,
                votes:         t,
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

  const lockedCount     = constituencies.filter(c => c.locked).length;
  const inProgressCount = constituencies.filter(c => !c.locked && c.reported > 0).length;
  const pendingCount    = constituencies.filter(c => c.reported === 0).length;

  const filtered = constituencies
    .filter(c => {
      if (filter === "LOCKED")      return c.locked;
      if (filter === "IN_PROGRESS") return !c.locked && c.reported > 0;
      if (filter === "PENDING")     return c.reported === 0;
      return true;
    })
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
          {constituencies.length} constituencies · Auto-refreshes every 30 seconds
        </div>
      </div>

        {/* Summary cards */}
        <div className="grid-4" style={{ marginBottom: "20px" }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "14px 16px" }}>
            <div style={{ fontSize: "10px", color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>Total Constituencies</div>
            <div style={{ fontSize: "26px", fontWeight: 700, color: "var(--text2)", fontFamily: "DM Mono,monospace" }}>275</div>
            <div style={{ fontSize: "10px", color: "var(--text2)", marginTop: "2px" }}>EC Ghana official count</div>
        </div>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "14px 16px" }}>
            <div style={{ fontSize: "10px", color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>Submitted</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
            <div style={{ fontSize: "26px", fontWeight: 700, color: "#3b82f6", fontFamily: "DM Mono,monospace" }}>{constituencies.filter(c => c.reported > 0).length}</div>
            <div style={{ fontSize: "13px", color: "var(--text2)", fontFamily: "DM Mono,monospace" }}>/ 275</div>
            </div>
            <div style={{ fontSize: "10px", color: "#3b82f6", marginTop: "2px" }}>{Math.round((constituencies.filter(c => c.reported > 0).length / 275) * 100)}% of total</div>
        </div>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "14px 16px" }}>
            <div style={{ fontSize: "10px", color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>Confirmed</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
            <div style={{ fontSize: "26px", fontWeight: 700, color: "var(--gold)", fontFamily: "DM Mono,monospace" }}>{constituencies.filter(c => (c.confirmed || 0) > 0).length}</div>
            <div style={{ fontSize: "13px", color: "var(--text2)", fontFamily: "DM Mono,monospace" }}>/ 275</div>
            </div>
            <div style={{ fontSize: "10px", color: "var(--gold)", marginTop: "2px" }}>{Math.round((constituencies.filter(c => (c.confirmed || 0) > 0).length / 275) * 100)}% of total</div>
        </div>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "14px 16px" }}>
            <div style={{ fontSize: "10px", color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>Locked</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
            <div style={{ fontSize: "26px", fontWeight: 700, color: "var(--accent2)", fontFamily: "DM Mono,monospace" }}>{lockedCount}</div>
            <div style={{ fontSize: "13px", color: "var(--text2)", fontFamily: "DM Mono,monospace" }}>/ 275</div>
            </div>
            <div style={{ fontSize: "10px", color: "var(--accent2)", marginTop: "2px" }}>{Math.round((lockedCount / 275) * 100)}% of total</div>
        </div>
        </div>

        {/* Master progress bars — out of 275 */}
        <div className="panel" style={{ marginBottom: "16px" }}>
        <div className="panel-title">
            <div className="dot" style={{ background: "var(--gold)" }} />
            Election Collation Progress — 275 Constituencies
        </div>

        {/* Submitted */}
        <div style={{ marginBottom: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", marginBottom: "4px" }}>
            <span style={{ color: "#3b82f6", fontWeight: 600 }}>Results Submitted</span>
            <span style={{ fontFamily: "DM Mono,monospace", color: "var(--bright)" }}>
                {constituencies.filter(c => c.reported > 0).length} / 275
                <span style={{ color: "#3b82f6", marginLeft: "6px" }}>
                ({Math.round((constituencies.filter(c => c.reported > 0).length / 275) * 100)}%)
                </span>
            </span>
            </div>
            <div style={{ background: "var(--bg2)", borderRadius: "4px", height: "10px", overflow: "hidden" }}>
            <div style={{
                height: "100%", borderRadius: "4px",
                width: `${(constituencies.filter(c => c.reported > 0).length / 275) * 100}%`,
                background: "linear-gradient(90deg, #1d4ed8, #3b82f6)",
                transition: "width 0.8s ease",
            }} />
            </div>
        </div>

        {/* Confirmed */}
        <div style={{ marginBottom: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", marginBottom: "4px" }}>
            <span style={{ color: "var(--gold)", fontWeight: 600 }}>Results Confirmed</span>
            <span style={{ fontFamily: "DM Mono,monospace", color: "var(--bright)" }}>
                {constituencies.filter(c => (c.confirmed || 0) > 0).length} / 275
                <span style={{ color: "var(--gold)", marginLeft: "6px" }}>
                ({Math.round((constituencies.filter(c => (c.confirmed || 0) > 0).length / 275) * 100)}%)
                </span>
            </span>
            </div>
            <div style={{ background: "var(--bg2)", borderRadius: "4px", height: "10px", overflow: "hidden" }}>
            <div style={{
                height: "100%", borderRadius: "4px",
                width: `${(constituencies.filter(c => (c.confirmed || 0) > 0).length / 275) * 100}%`,
                background: "linear-gradient(90deg, #b45309, var(--gold))",
                transition: "width 0.8s ease",
            }} />
            </div>
        </div>

        {/* Locked */}
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", marginBottom: "4px" }}>
            <span style={{ color: "var(--accent2)", fontWeight: 600 }}>Constituencies Locked</span>
            <span style={{ fontFamily: "DM Mono,monospace", color: "var(--bright)" }}>
                {lockedCount} / 275
                <span style={{ color: "var(--accent2)", marginLeft: "6px" }}>
                ({Math.round((lockedCount / 275) * 100)}%)
                </span>
            </span>
            </div>
            <div style={{ background: "var(--bg2)", borderRadius: "4px", height: "10px", overflow: "hidden" }}>
            <div style={{
                height: "100%", borderRadius: "4px",
                width: `${(lockedCount / 275) * 100}%`,
                background: "linear-gradient(90deg, #005838, var(--accent2))",
                transition: "width 0.8s ease",
            }} />
            </div>
        </div>
        </div>

      {/* Overall progress bar */}
      <div className="panel" style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text2)", marginBottom: "8px" }}>
          <span>Overall Collation Progress</span>
          <span style={{ fontFamily: "DM Mono,monospace", color: "var(--bright)" }}>
            {constituencies.length > 0 ? Math.round((lockedCount / constituencies.length) * 100) : 0}% complete
          </span>
        </div>
        {/* Overall progress */}
        <div style={{ marginBottom: "14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text2)", marginBottom: "6px" }}>
            <span>Overall Collation Progress</span>
            <span style={{ fontFamily: "DM Mono,monospace", color: "var(--bright)" }}>
            {constituencies.length > 0 ? Math.round((lockedCount / constituencies.length) * 100) : 0}% complete
            </span>
        </div>

        {/* Submitted bar */}
        <div style={{ marginBottom: "6px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", color: "var(--text2)", marginBottom: "3px" }}>
            <span>Submitted</span>
            <span style={{ fontFamily: "DM Mono,monospace" }}>
                {constituencies.filter(c => c.reported > 0).length} / {constituencies.length} constituencies
                ({constituencies.length > 0 ? Math.round((constituencies.filter(c => c.reported > 0).length / constituencies.length) * 100) : 0}%)
            </span>
            </div>
            <div style={{ background: "var(--bg2)", borderRadius: "4px", height: "8px", overflow: "hidden" }}>
            <div style={{
                height: "100%", borderRadius: "4px",
                width: constituencies.length > 0 ? `${(constituencies.filter(c => c.reported > 0).length / constituencies.length) * 100}%` : "0%",
                background: "linear-gradient(90deg, #1d4ed8, #3b82f6)",
                transition: "width 0.8s ease",
            }} />
            </div>
        </div>

        {/* Confirmed bar */}
        <div style={{ marginBottom: "6px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", color: "var(--text2)", marginBottom: "3px" }}>
            <span>Confirmed</span>
            <span style={{ fontFamily: "DM Mono,monospace" }}>
                {constituencies.filter(c => (c.confirmed || 0) > 0).length} / {constituencies.length} constituencies
                ({constituencies.length > 0 ? Math.round((constituencies.filter(c => (c.confirmed || 0) > 0).length / constituencies.length) * 100) : 0}%)
            </span>
            </div>
            <div style={{ background: "var(--bg2)", borderRadius: "4px", height: "8px", overflow: "hidden" }}>
            <div style={{
                height: "100%", borderRadius: "4px",
                width: constituencies.length > 0 ? `${(constituencies.filter(c => (c.confirmed || 0) > 0).length / constituencies.length) * 100}%` : "0%",
                background: "linear-gradient(90deg, var(--gold), var(--gold2))",
                transition: "width 0.8s ease",
            }} />
            </div>
        </div>

        {/* Locked bar */}
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", color: "var(--text2)", marginBottom: "3px" }}>
            <span>Locked</span>
            <span style={{ fontFamily: "DM Mono,monospace" }}>
                {lockedCount} / {constituencies.length} constituencies
                ({constituencies.length > 0 ? Math.round((lockedCount / constituencies.length) * 100) : 0}%)
            </span>
            </div>
            <div style={{ background: "var(--bg2)", borderRadius: "4px", height: "8px", overflow: "hidden" }}>
            <div style={{
                height: "100%", borderRadius: "4px",
                width: constituencies.length > 0 ? `${(lockedCount / constituencies.length) * 100}%` : "0%",
                background: "linear-gradient(90deg, #005838, var(--accent2))",
                transition: "width 0.8s ease",
            }} />
            </div>
        </div>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
        {[
            { color: "#3b82f6",          label: `${constituencies.filter(c => c.reported > 0).length} Submitted` },
            { color: "var(--gold)",      label: `${constituencies.filter(c => (c.confirmed || 0) > 0).length} Confirmed` },
            { color: "var(--accent2)",   label: `${lockedCount} Locked` },
            { color: "#f87171",          label: `${pendingCount} Pending` },
        ].map(l => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "10px", color: "var(--text2)" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: l.color, flexShrink: 0 }} />
            {l.label}
            </div>
        ))}
        </div>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
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
            Current Standings · {formatNumber(grandTotal)} total votes
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" }}>
            {CANDIDATES
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
                    <span style={{ fontSize: "11px", color: "var(--text2)" }}>
                      {percentage(c.votes, grandTotal)}%
                    </span>
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
            fontFamily: "DM Sans,sans-serif", outline: "none",
             boxShadow: "0 0 0 1px var(--border2)",
          }}
        />
        {[
          { key: "ALL",         label: `All (${constituencies.length})` },
          { key: "LOCKED",      label: `Locked (${lockedCount})` },
          { key: "IN_PROGRESS", label: `In Progress (${inProgressCount})` },
          { key: "PENDING",     label: `Pending (${pendingCount})` },
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
            const leading = leadingIndex >= 0 ? CANDIDATES[leadingIndex] : null;
            const hasVotes = c.total && Number(c.total) > 0;

            return (
              <div key={c.name} style={{
                background: "var(--surface)",
                border: `1px solid ${c.locked ? "rgba(0,146,79,0.3)" : c.reported > 0 ? "rgba(252,209,22,0.2)" : "var(--border)"}`,
                borderRadius: "var(--r-md)", padding: "14px",
                transition: "border-color 0.2s",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <div style={{ flex: 1, minWidth: 0, paddingRight: "8px" }}>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--bright)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {c.name}
                    </div>
                    <div style={{ fontSize: "10px", color: "var(--text2)", marginTop: "1px" }}>
                      {c.district}
                    </div>
                    <div style={{ fontSize: "9px", color: "var(--text3)", marginTop: "1px" }}>
                      {c.region}
                    </div>
                  </div>
                  <span className={`pill ${c.locked ? "ok" : c.reported > 0 ? "pend" : "flag"}`} style={{ flexShrink: 0 }}>
                    {c.locked ? "Locked" : c.reported > 0 ? "Active" : "Pending"}
                  </span>
                </div>

                {/* Stats row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px", marginBottom: "8px" }}>
                <div style={{ background: "var(--bg2)", borderRadius: "var(--r-sm)", padding: "6px 8px", textAlign: "center" }}>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--bright)", fontFamily: "DM Mono,monospace" }}>
                    {c.reported}
                    </div>
                    <div style={{ fontSize: "9px", color: "var(--text2)", marginTop: "1px" }}>Submitted</div>
                </div>
                <div style={{ background: "var(--bg2)", borderRadius: "var(--r-sm)", padding: "6px 8px", textAlign: "center" }}>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--accent2)", fontFamily: "DM Mono,monospace" }}>
                    {c.confirmed || 0}
                    </div>
                    <div style={{ fontSize: "9px", color: "var(--text2)", marginTop: "1px" }}>Confirmed</div>
                </div>
                <div style={{ background: "var(--bg2)", borderRadius: "var(--r-sm)", padding: "6px 8px", textAlign: "center" }}>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--gold)", fontFamily: "DM Mono,monospace" }}>
                    {c.confirmedPct || 0}%
                    </div>
                    <div style={{ fontSize: "9px", color: "var(--text2)", marginTop: "1px" }}>Approved</div>
                </div>
                </div>

                {/* Progress bar */}
                <div style={{ marginBottom: "6px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", color: "var(--text2)", marginBottom: "3px" }}>
                    <span>Confirmation progress</span>
                    <span style={{ fontFamily: "DM Mono,monospace" }}>{c.confirmed || 0}/{c.reported} stations</span>
                </div>
                <div style={{ background: "var(--border)", borderRadius: "3px", height: "4px", overflow: "hidden" }}>
                    <div style={{
                    height: "100%", borderRadius: "3px",
                    width: `${c.confirmedPct || 0}%`,
                    background: c.locked
                        ? "var(--accent2)"
                        : c.confirmedPct > 0
                        ? "linear-gradient(90deg, var(--gold), var(--accent2))"
                        : "var(--border2)",
                    transition: "width 0.6s ease",
                    }} />
                </div>
                </div>

                {hasVotes && leading && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: "5px",
                    padding: "5px 8px", borderRadius: "var(--r-sm)",
                    background: "var(--bg2)", marginTop: "4px",
                  }}>
                    <div style={{ width: "6px", height: "6px", borderRadius: "2px", background: leading.color, flexShrink: 0 }} />
                    <span style={{ fontSize: "9px", color: "var(--text2)" }}>Leading:</span>
                    <span style={{ fontSize: "9px", color: leading.color, fontWeight: 700 }}>
                      {leading.name} ({leading.party})
                    </span>
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