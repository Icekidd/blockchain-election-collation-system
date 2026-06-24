import React, { useEffect, useState } from "react";
import { getReadOnlyContract, ELECTION_STATUS } from "../utils/contract.js";
import { CANDIDATES } from "../data/ghana.js";
import { formatNumber, percentage } from "../utils/format.js";

export default function PublicResults() {
  const [totals,       setTotals]       = useState([]);
  const [grandTotal,   setGrandTotal]   = useState(0n);
  const [status,       setStatus]       = useState(null);
  const [stationCount, setStationCount] = useState(0);
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
        setStatus(Number(electionStatus));

        const grand = new Array(CANDIDATES.length).fill(0n);
        for (const name of constNames) {
          const [t] = await c.getConstituencyTotal(name);
          t.forEach((v, i) => { grand[i] += BigInt(v); });
        }
        setTotals(grand);
        setGrandTotal(grand.reduce((s, v) => s + v, 0n));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
    // Refresh every 30 seconds
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ textAlign:"center" }}>
        <div className="spinner" style={{ margin:"0 auto 12px" }} />
        <div style={{ color:"var(--text2)", fontSize:"13px" }}>Loading live results...</div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", padding:"40px 24px" }}>
      <div style={{ maxWidth:"700px", margin:"0 auto" }}>

        {/* Header */}
        <div style={{ textAlign:"center", marginBottom:"40px" }}>
          <div style={{ display:"flex", height:"3px", borderRadius:"2px", overflow:"hidden", width:"80px", margin:"0 auto 20px" }}>
            <div style={{ background:"#CE1126", flex:1 }} />
            <div style={{ background:"#FCD116", flex:1 }} />
            <div style={{ background:"#006B3F", flex:1 }} />
          </div>
          <div style={{ fontSize:"11px", fontFamily:"DM Mono,monospace", color:"var(--gold)", letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:"8px" }}>
            Electoral Commission of Ghana
          </div>
          <h1 style={{ fontSize:"28px", fontWeight:700, color:"var(--bright)", marginBottom:"6px" }}>
            2024 Presidential Election
          </h1>
          <div style={{ display:"flex", alignItems:"center", gap:"8px", justifyContent:"center", fontSize:"12px", color:"var(--text2)" }}>
            <span className="live-dot" />
            Live Results · {stationCount} stations reported ·
            <span style={{ color:"var(--gold)" }}>{status !== null ? ELECTION_STATUS[status] : "-"}</span>
          </div>
          <div style={{ fontSize:"10px", color:"var(--text2)", marginTop:"6px", fontFamily:"DM Mono,monospace" }}>
            Verified on Polygon Amoy blockchain · Updates every 30 seconds
          </div>
        </div>

        {/* Results */}
        {grandTotal === 0n ? (
          <div style={{ textAlign:"center", padding:"48px", color:"var(--text2)", fontSize:"13px" }}>
            No confirmed results yet. Check back soon.
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:"12px", marginBottom:"32px" }}>
            {CANDIDATES
              .map((c, i) => ({ ...c, votes: totals[i] || 0n, index: i }))
              .sort((a, b) => (b.votes > a.votes ? 1 : -1))
              .map((c, rank) => {
                const pct = percentage(c.votes, grandTotal);
                const isLeading = rank === 0;
                return (
                  <div key={c.party} style={{
                    background: isLeading ? "rgba(0,107,63,0.06)" : "var(--surface)",
                    border: `1px solid ${isLeading ? "rgba(0,146,79,0.3)" : "var(--border)"}`,
                    borderRadius:"var(--r-md)", padding:"18px 20px",
                    position:"relative", overflow:"hidden",
                  }}>
                    {isLeading && (
                      <div style={{ position:"absolute", top:"10px", right:"14px", fontSize:"9px", fontWeight:700, color:"var(--accent2)", letterSpacing:"0.1em", textTransform:"uppercase", fontFamily:"DM Mono,monospace" }}>
                        Leading
                      </div>
                    )}
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"10px" }}>
                      <div>
                        <div style={{ fontSize:"15px", fontWeight:700, color:"var(--bright)" }}>{c.name}</div>
                        <div style={{ fontSize:"10px", fontWeight:700, color:c.color, textTransform:"uppercase", letterSpacing:"0.06em" }}>{c.party}</div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:"24px", fontWeight:700, color:"var(--bright)", fontFamily:"DM Mono,monospace" }}>
                          {formatNumber(c.votes)}
                        </div>
                        <div style={{ fontSize:"12px", color:"var(--text2)" }}>{pct}%</div>
                      </div>
                    </div>
                    <div style={{ background:"var(--bg2)", borderRadius:"3px", height:"8px", overflow:"hidden" }}>
                      <div style={{
                        height:"100%", borderRadius:"3px",
                        width:`${pct}%`,
                        background:`linear-gradient(90deg, ${c.color}88, ${c.color})`,
                        transition:"width 1s cubic-bezier(.4,0,.2,1)",
                      }} />
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* Total votes */}
        <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--r-md)", padding:"14px 20px", display:"flex", justifyContent:"space-between", fontSize:"12px" }}>
          <span style={{ color:"var(--text2)" }}>Total Votes Counted</span>
          <span style={{ fontFamily:"DM Mono,monospace", color:"var(--bright)", fontWeight:600 }}>{formatNumber(grandTotal)}</span>
        </div>

        <div style={{ textAlign:"center", marginTop:"20px", fontSize:"10px", color:"var(--text2)", fontFamily:"DM Mono,monospace" }}>
          Contract: 0xe3299C6E42AcB56104E1b5D4354b56d518cc66Cd · Polygon Amoy
        </div>
      </div>
    </div>
  );
}