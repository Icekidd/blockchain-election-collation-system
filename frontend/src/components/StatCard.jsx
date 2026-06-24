import React from "react";

export default function StatCard({ label, value, sub, accentColor = "var(--accent2)" }) {
  return (
    <div style={{
      background:"var(--surface)", border:"1px solid var(--border)",
      borderRadius:"var(--r-md)", padding:"14px 16px",
      position:"relative", overflow:"hidden",
    }}>
      <div style={{
        position:"absolute", top:0, left:0, right:0, height:"2px",
        background: accentColor,
      }} />
      <div style={{ fontSize:"10px", color:"var(--text2)", fontWeight:500, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:"6px" }}>
        {label}
      </div>
      <div style={{ fontSize:"26px", fontWeight:700, color:"var(--bright)", fontFamily:"DM Mono,monospace", lineHeight:1 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize:"10px", color:"var(--text2)", marginTop:"4px" }}>{sub}</div>
      )}
    </div>
  );
}