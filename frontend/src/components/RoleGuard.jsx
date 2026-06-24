import React from "react";
import { useWallet } from "../context/WalletContext.jsx";

export function RoleGuard({ roles, children }) {
  const { role } = useWallet();
  if (!role || !roles.includes(role)) {
    return (
      <div style={{ padding:"88px 28px 40px", maxWidth:"480px", margin:"0 auto", textAlign:"center" }}>
        <div style={{ fontSize:"32px", marginBottom:"14px" }}>🔒</div>
        <div style={{ fontSize:"16px", fontWeight:600, color:"var(--bright)", marginBottom:"6px" }}>
          Access Restricted
        </div>
        <div style={{ fontSize:"13px", color:"var(--text2)" }}>
          Requires: <strong style={{ color:"var(--gold)" }}>{roles.join(" or ")}</strong><br />
          Your role: <strong style={{ color:"var(--accent2)" }}>{role || "None assigned"}</strong>
        </div>
      </div>
    );
  }
  return children;
}