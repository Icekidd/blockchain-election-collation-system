import React, { useEffect } from "react";
import { explorerTx } from "../utils/format.js";

export default function Toast({ message, type = "success", txHash, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);

  const colors = {
    success: { border:"var(--accent2)", icon:"✓" },
    error:   { border:"#f87171",        icon:"✕" },
    warning: { border:"var(--gold)",    icon:"!" },
  };
  const c = colors[type] || colors.success;

  return (
    <div style={{
      position:"fixed", bottom:"24px", right:"24px", zIndex:9999,
      background:"var(--surface2)", border:`1px solid ${c.border}`,
      borderRadius:"var(--r-md)", padding:"12px 16px",
      display:"flex", alignItems:"flex-start", gap:"10px",
      maxWidth:"360px", boxShadow:"0 8px 32px rgba(0,0,0,0.4)",
      animation:"slideUp 0.25s ease",
    }}>
      <div style={{
        width:"20px", height:"20px", borderRadius:"50%", flexShrink:0,
        border:`1.5px solid ${c.border}`, display:"flex",
        alignItems:"center", justifyContent:"center",
        fontSize:"11px", color:c.border, marginTop:"1px",
      }}>
        {c.icon}
      </div>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:"12px", color:"var(--bright)", lineHeight:1.4 }}>{message}</div>
        {txHash && (
          <a href={explorerTx(txHash)} target="_blank" rel="noreferrer" style={{
            fontSize:"10px", color:"var(--accent2)", textDecoration:"none", fontFamily:"DM Mono,monospace",
          }}>
            View on PolygonScan →
          </a>
        )}
      </div>
      <button onClick={onClose} style={{
        background:"none", border:"none", color:"var(--text2)",
        cursor:"pointer", fontSize:"14px", lineHeight:1, flexShrink:0,
      }}>✕</button>
    </div>
  );
}