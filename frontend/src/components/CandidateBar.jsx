import React from "react";
import { formatNumber, percentage } from "../utils/format.js";

export default function CandidateBar({ name, party, votes, total, color }) {
  const pct = percentage(votes, total);
  return (
    <div style={{ marginBottom:"12px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:"11px", marginBottom:"4px", alignItems:"center" }}>
        <span style={{ color:"var(--text)", display:"flex", alignItems:"center", gap:"6px" }}>
          <span style={{ width:"8px", height:"8px", borderRadius:"2px", background:color, display:"inline-block", flexShrink:0 }} />
          {name}
          <span style={{ color:"var(--text2)", fontSize:"10px" }}>({party})</span>
        </span>
        <span style={{ fontFamily:"DM Mono,monospace", color:"var(--bright)", display:"flex", gap:"8px" }}>
          <span>{formatNumber(votes)}</span>
          <span style={{ color:"var(--text2)" }}>{pct}%</span>
        </span>
      </div>
      <div style={{ background:"var(--bg2)", borderRadius:"3px", height:"7px", overflow:"hidden" }}>
        <div style={{
          height:"100%", borderRadius:"3px",
          width:`${pct}%`,
          background:`linear-gradient(90deg, ${color}99, ${color})`,
          transition:"width 0.8s cubic-bezier(.4,0,.2,1)",
        }} />
      </div>
    </div>
  );
}