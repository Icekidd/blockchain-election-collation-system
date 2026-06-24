import React from "react";
import { explorerTx } from "../utils/format.js";

const STYLE_MAP = {
  green: { dot:"var(--accent2)" },
  flag:  { dot:"#f87171" },
  lock:  { dot:"#60a5fa" },
  pend:  { dot:"var(--gold)" },
};

export default function ActivityFeed({ events, loading }) {
  if (loading) return (
    <div className="loading-state" style={{ height:"120px" }}>
      <div className="spinner" /> Loading events…
    </div>
  );

  if (!events.length) return (
    <div style={{ textAlign:"center", padding:"28px", color:"var(--text2)", fontSize:"12px" }}>
      No on-chain events yet.
    </div>
  );

  return (
    <div>
      {events.map((e, i) => {
        const s = STYLE_MAP[e.style] || STYLE_MAP.pend;
        return (
          <div key={i} style={{
            display:"flex", alignItems:"flex-start", gap:"9px",
            padding:"9px 0", borderBottom:"1px solid var(--border)",
          }}>
            <div style={{ width:"7px", height:"7px", borderRadius:"50%", background:s.dot, marginTop:"4px", flexShrink:0 }} />
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:"11px", color:"var(--text)", lineHeight:1.45 }}>
                <span style={{ color:"var(--bright)", fontWeight:600 }}>{e.stationId}</span>
                {" — "}{e.text}
              </div>
              <div style={{ display:"flex", gap:"10px", marginTop:"2px" }}>
                {e.officer && (
                  <span style={{ fontSize:"9px", color:"var(--text2)", fontFamily:"DM Mono,monospace" }}>
                    by {e.officer}
                  </span>
                )}
                {e.txHash && (
                  <a href={explorerTx(e.txHash)} target="_blank" rel="noreferrer" style={{
                    fontSize:"9px", color:"var(--accent2)", textDecoration:"none", fontFamily:"DM Mono,monospace",
                  }}>
                    {e.txHash.slice(0,8)}…
                  </a>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}