import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useWallet } from "../context/WalletContext.jsx";
import { shortAddress } from "../utils/format.js";

const ROLE_LABELS = {
  PRESIDING: "Presiding Officer",
  RETURNING: "Returning Officer",
  SENIOR:    "Senior EC Officer",
};

const NAV_LINKS = [
  { to: "/dashboard", label: "Dashboard",    roles: ["PRESIDING","RETURNING","SENIOR"] },
  { to: "/submit",    label: "Submit Result",roles: ["PRESIDING"] },
  { to: "/ro-review", label: "RO Review",    roles: ["RETURNING","SENIOR"] },
  { to: "/audit",     label: "Audit Log",    roles: ["PRESIDING","RETURNING","SENIOR"] },
  { to: "/dispute",   label: "Disputes",     roles: ["PRESIDING","RETURNING","SENIOR"] },
  { to: "/map",      label: "Progress Map", roles: ["PRESIDING","RETURNING","SENIOR"] },
  { to: "/officers", label: "Officers",     roles: ["SENIOR"] },
];

export default function Navbar() {
  const { account, role, officerName, disconnect } = useWallet();
  const { pathname } = useLocation();

  const visibleLinks = account
    ? NAV_LINKS.filter(l => !role || l.roles.includes(role))
    : [];

  return (
    <nav style={{
      position:"fixed", top:0, left:0, right:0, zIndex:200,
      background:"rgba(7,17,10,0.97)", backdropFilter:"blur(16px)",
      borderBottom:"1px solid var(--border)",
    }}>
      <div style={{ display:"flex", height:"2px" }}>
        <div style={{ background:"#CE1126", flex:1 }} />
        <div style={{ background:"#FCD116", flex:1 }} />
        <div style={{ background:"#006B3F", flex:1 }} />
      </div>
      <div style={{
        display:"flex", alignItems:"center",
        padding:"0 20px", height:"54px", gap:"4px",
        overflowX:"auto",
      }}>
        <Link to="/" style={{
          textDecoration:"none", marginRight:"14px", flexShrink:0,
          display:"flex", alignItems:"center", gap:"9px",
        }}>
          <div style={{
            display:"flex", height:"22px", width:"22px", borderRadius:"4px",
            overflow:"hidden", flexDirection:"column",
            border:"1px solid rgba(255,255,255,0.1)", flexShrink:0,
          }}>
            <div style={{ background:"#CE1126", flex:1 }} />
            <div style={{ background:"#FCD116", flex:1, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"9px" }}>★</div>
            <div style={{ background:"#006B3F", flex:1 }} />
          </div>
          <div>
            <div style={{ fontFamily:"DM Mono,monospace", fontSize:"12px", fontWeight:500, color:"var(--gold)", lineHeight:1 }}>EC Ghana</div>
            <div style={{ fontSize:"9px", color:"var(--text2)", letterSpacing:"0.06em", textTransform:"uppercase" }}>Collation System</div>
          </div>
        </Link>

        {visibleLinks.map(l => (
          <Link key={l.to} to={l.to} style={{
            padding:"5px 11px", borderRadius:"var(--r-sm)", fontSize:"11px",
            fontWeight:500, textDecoration:"none", whiteSpace:"nowrap", flexShrink:0,
            color:      pathname === l.to ? "var(--gold)"            : "var(--text2)",
            background: pathname === l.to ? "rgba(252,209,22,0.08)"  : "transparent",
            border:     pathname === l.to ? "1px solid rgba(252,209,22,0.2)" : "1px solid transparent",
            transition:"all 0.15s",
          }}>
            {l.label}
          </Link>
        ))}

        <div style={{ marginLeft:"auto" }} />

        {account ? (
          <div style={{ display:"flex", alignItems:"center", gap:"8px", flexShrink:0 }}>
            {role && (
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:"10px", color:"var(--bright)", fontWeight:600 }}>
                  {officerName || shortAddress(account)}
                </div>
                <div style={{ fontSize:"9px", color:"var(--gold)", letterSpacing:"0.06em" }}>
                  {ROLE_LABELS[role]}
                </div>
              </div>
            )}
            <div style={{
              display:"flex", alignItems:"center", gap:"5px",
              padding:"4px 10px", borderRadius:"20px",
              background:"rgba(0,146,79,0.1)", border:"1px solid rgba(0,146,79,0.25)",
              fontFamily:"DM Mono,monospace", fontSize:"10px", color:"var(--accent2)",
            }}>
              <span className="live-dot" />
              {shortAddress(account)}
            </div>
            <button onClick={disconnect} style={{
              padding:"4px 10px", borderRadius:"var(--r-sm)", fontSize:"10px",
              background:"transparent", border:"1px solid var(--border)",
              color:"var(--text2)", cursor:"pointer",
            }}>
              Disconnect
            </button>
          </div>
        ) : (
          <Link to="/" style={{
            padding:"6px 14px", borderRadius:"var(--r-sm)", fontSize:"12px", fontWeight:600,
            background:"linear-gradient(135deg,#005838,#00924f)", color:"#fff",
            textDecoration:"none",
          }}>
            Connect Wallet
          </Link>
        )}
      </div>
    </nav>
  );
}