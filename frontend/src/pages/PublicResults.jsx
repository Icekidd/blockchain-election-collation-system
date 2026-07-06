import React, { useEffect, useState } from "react";
import { getReadOnlyContract, ELECTION_STATUS } from "../utils/contract.js";
import { useCandidates } from "../hooks/useCandidates.js";
import { formatNumber, percentage } from "../utils/format.js";

const CONTRACT_ADDR = import.meta.env.VITE_CONTRACT_ADDRESS;

export default function PublicResults() {
  const { candidates: CANDIDATES } = useCandidates();
  const [totals,       setTotals]       = useState([]);
  const [grandTotal,   setGrandTotal]   = useState(0n);
  const [status,       setStatus]       = useState(null);
  const [stationCount, setStationCount] = useState(0);
  const [constCount,   setConstCount]   = useState(0);
  const [lockedCount,  setLockedCount]  = useState(0);
  const [lastUpdated,  setLastUpdated]  = useState(null);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const c = getReadOnlyContract();
        const [ids, constNames, electionStatus] = await Promise.all([
          c.getAllStationIds(),
          c.getAllConstituencies(),
          c.getElectionStatus(),
        ]);
        setStationCount(ids.length);
        setConstCount(constNames.length);
        setStatus(Number(electionStatus));

        const grand = new Array(Math.max(CANDIDATES.length, 4)).fill(0n);
        let locked = 0;
        for (const name of constNames) {
          const [t] = await c.getConstituencyTotal(name);
          const info = await c.getConstituency(name);
          if (info.locked) locked++;
          t.forEach((v, i) => { grand[i] = (grand[i] || 0n) + BigInt(v); });
        }
        setLockedCount(locked);
        setTotals(grand);
        setGrandTotal(grand.reduce((s, v) => s + v, 0n));
        setLastUpdated(new Date());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [CANDIDATES.length]);

  const ranked = CANDIDATES
    .map((c, i) => ({ ...c, votes: totals[i] || 0n }))
    .sort((a, b) => (b.votes > a.votes ? 1 : b.votes < a.votes ? -1 : 0));

  const leader    = ranked[0];
  const runnerUp  = ranked[1];
  const margin    = leader && runnerUp ? leader.votes - runnerUp.votes : 0n;
  const hasVotes  = grandTotal > 0n;

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ display: "flex", height: "3px", width: "72px", margin: "0 auto 18px", borderRadius: "2px", overflow: "hidden" }}>
          <div style={{ background: "#CE1126", flex: 1 }} />
          <div style={{ background: "#FCD116", flex: 1 }} />
          <div style={{ background: "#006B3F", flex: 1 }} />
        </div>
        <div className="spinner" style={{ margin: "0 auto 12px" }} />
        <div style={{ color: "var(--text2)", fontSize: "13px" }}>Reading results from the blockchain…</div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <div style={{
        background: "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(0,107,63,0.16) 0%, transparent 70%)",
        borderBottom: "1px solid var(--border)",
        padding: "56px 24px 40px",
      }}>
        <div style={{ maxWidth: "820px", margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "flex", height: "3px", width: "88px", borderRadius: "2px", overflow: "hidden", margin: "0 auto 22px" }}>
            <div style={{ background: "#CE1126", flex: 1 }} />
            <div style={{ background: "#FCD116", flex: 1 }} />
            <div style={{ background: "#006B3F", flex: 1 }} />
          </div>

          <div style={{ fontSize: "11px", fontFamily: "DM Mono,monospace", color: "var(--gold)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "10px" }}>
            Electoral Commission of Ghana
          </div>
          <h1 style={{ fontSize: "clamp(26px, 5vw, 40px)", fontWeight: 700, color: "var(--bright)", lineHeight: 1.15, marginBottom: "14px" }}>
            2024 Presidential Election
          </h1>

          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 16px", borderRadius: "24px", background: "var(--surface)", border: "1px solid var(--border2)", fontSize: "12px", color: "var(--text)" }}>
            <span className="live-dot" />
            Live blockchain results
            <span style={{ color: "var(--border2)" }}>|</span>
            <span style={{ color: "var(--gold)", fontWeight: 600 }}>
              {status !== null ? ELECTION_STATUS[status] : "—"}
            </span>
          </div>

          {/* Stats strip */}
          <div style={{ display: "flex", justifyContent: "center", gap: "clamp(18px, 5vw, 48px)", marginTop: "30px", flexWrap: "wrap" }}>
            {[
              [formatNumber(grandTotal), "votes counted"],
              [stationCount,             "stations reported"],
              [`${constCount} / 275`,    "constituencies"],
              [lockedCount,              "locked"],
            ].map(([value, label]) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "clamp(18px, 3vw, 26px)", fontWeight: 700, color: "var(--bright)", fontFamily: "DM Mono,monospace" }}>{value}</div>
                <div style={{ fontSize: "10px", color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: "2px" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Results ──────────────────────────────────────────── */}
      <div style={{ maxWidth: "820px", margin: "0 auto", padding: "36px 24px 48px" }}>

        {CANDIDATES.length === 0 ? (
          <div className="panel" style={{ textAlign: "center", padding: "48px" }}>
            <div style={{ fontSize: "14px", color: "var(--bright)", fontWeight: 600, marginBottom: "6px" }}>Ballot not yet published</div>
            <div style={{ fontSize: "12px", color: "var(--text2)" }}>Candidates will appear here once the EC finalises the ballot.</div>
          </div>
        ) : (
          <>
            {!hasVotes && (
              <div style={{
                background: "rgba(252,209,22,0.05)", border: "1px solid rgba(252,209,22,0.2)",
                borderRadius: "var(--r-md)", padding: "11px 16px", marginBottom: "20px",
                fontSize: "12px", color: "var(--gold)", textAlign: "center",
              }}>
                Counting has not started — results will appear live as constituencies confirm.
              </div>
            )}

            {/* Leader spotlight */}
            {hasVotes && leader && (
              <div style={{
                background: `linear-gradient(135deg, ${leader.color}14, var(--surface))`,
                border: `1px solid ${leader.color}55`,
                borderRadius: "var(--r-lg)", padding: "22px 24px", marginBottom: "14px",
                position: "relative", overflow: "hidden",
              }}>
                <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: "5px", background: leader.color }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
                  <div>
                    <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: leader.color, marginBottom: "6px", fontFamily: "DM Mono,monospace" }}>
                      ★ Currently Leading
                    </div>
                    <div style={{ fontSize: "clamp(20px, 4vw, 27px)", fontWeight: 700, color: "var(--bright)", lineHeight: 1.1 }}>
                      {leader.name}
                    </div>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: leader.color, textTransform: "uppercase", marginTop: "3px" }}>
                      {leader.party}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "clamp(26px, 5vw, 38px)", fontWeight: 700, color: "var(--bright)", fontFamily: "DM Mono,monospace", lineHeight: 1 }}>
                      {percentage(leader.votes, grandTotal)}%
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text2)", fontFamily: "DM Mono,monospace", marginTop: "4px" }}>
                      {formatNumber(leader.votes)} votes
                    </div>
                    {margin > 0n && (
                      <div style={{ fontSize: "10px", color: leader.color, marginTop: "3px" }}>
                        +{formatNumber(margin)} ahead
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* All candidates */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {ranked.map((c, rank) => {
                const pct = hasVotes ? percentage(c.votes, grandTotal) : "0.0";
                const isLeader = hasVotes && rank === 0;
                if (isLeader) return null; // already in spotlight
                return (
                  <div key={c.party} style={{
                    background: "var(--surface)", border: "1px solid var(--border)",
                    borderRadius: "var(--r-md)", padding: "16px 18px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "10px" }}>
                      <div style={{
                        width: "30px", height: "30px", borderRadius: "50%", flexShrink: 0,
                        border: `2px solid ${c.color}`, background: c.color + "18",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontFamily: "DM Mono,monospace", fontSize: "12px", fontWeight: 700, color: c.color,
                      }}>
                        {hasVotes ? rank + 1 : "–"}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--bright)" }}>{c.name}</div>
                        <div style={{ fontSize: "10px", fontWeight: 700, color: c.color, textTransform: "uppercase" }}>{c.party}</div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: "19px", fontWeight: 700, color: "var(--bright)", fontFamily: "DM Mono,monospace", lineHeight: 1 }}>
                          {formatNumber(c.votes)}
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--text2)", marginTop: "2px" }}>{pct}%</div>
                      </div>
                    </div>
                    <div style={{ background: "var(--bg2)", borderRadius: "3px", height: "7px", overflow: "hidden" }}>
                      <div style={{
                        height: "100%", borderRadius: "3px",
                        width: `${pct}%`, minWidth: c.votes > 0n ? "4px" : "0",
                        background: `linear-gradient(90deg, ${c.color}88, ${c.color})`,
                        transition: "width 1s cubic-bezier(.4,0,.2,1)",
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── Verification footer ─────────────────────────────── */}
        <div style={{
          marginTop: "32px", padding: "18px 20px",
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: "var(--r-md)", textAlign: "center",
        }}>
          <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--accent2)", marginBottom: "8px" }}>
            Blockchain Verified
          </div>
          <div style={{ fontSize: "11px", color: "var(--text2)", lineHeight: 1.7 }}>
            Every figure on this page is read directly from an immutable smart contract on Polygon Amoy.
            Anyone can independently verify these results.
          </div>
          <a
            href={`https://amoy.polygonscan.com/address/${CONTRACT_ADDR}`}
            target="_blank" rel="noreferrer"
            style={{
              display: "inline-block", marginTop: "10px",
              fontSize: "10px", fontFamily: "DM Mono,monospace",
              color: "var(--accent2)", textDecoration: "none",
              padding: "6px 14px", border: "1px solid var(--border2)", borderRadius: "20px",
            }}
          >
            {CONTRACT_ADDR?.slice(0, 10)}…{CONTRACT_ADDR?.slice(-8)} — View on PolygonScan
          </a>
          {lastUpdated && (
            <div style={{ fontSize: "9px", color: "var(--text3)", marginTop: "10px", fontFamily: "DM Mono,monospace" }}>
              Last updated {lastUpdated.toLocaleTimeString("en-GH")} · refreshes every 30s
            </div>
          )}
        </div>
      </div>
    </div>
  );
}