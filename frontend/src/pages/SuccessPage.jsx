import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { shortHash, explorerTx } from "../utils/format.js";
import { ipfsUrl } from "../utils/ipfs.js";

export default function SuccessPage() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const stationId = state?.stationId || "-";
  const txHash    = state?.txHash    || null;
  const recordCid = state?.ipfsHash  || null; // the full verification record JSON
  const imageCid  = state?.imageCid  || null; // the Pink Sheet photo

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "radial-gradient(ellipse 50% 40% at 50% 40%, rgba(0,107,63,0.08) 0%, transparent 70%)",
      padding: "48px 24px",
    }}>
      <div style={{ maxWidth: "440px", width: "100%", textAlign: "center" }}>

        <div style={{
          width: "88px", height: "88px", borderRadius: "50%",
          border: "2px solid rgba(0,146,79,0.4)",
          background: "rgba(0,107,63,0.08)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 8px", position: "relative",
        }}>
          <div style={{ fontSize: "36px" }}>OK</div>
        </div>

        <div style={{ display: "flex", height: "2px", width: "80px", borderRadius: "1px", overflow: "hidden", margin: "14px auto 20px" }}>
          <div style={{ background: "#CE1126", flex: 1 }} />
          <div style={{ background: "#FCD116", flex: 1 }} />
          <div style={{ background: "#006B3F", flex: 1 }} />
        </div>

        <h2 style={{ fontSize: "24px", fontWeight: 700, color: "var(--bright)", marginBottom: "8px" }}>
          Result Recorded On-Chain
        </h2>
        <p style={{ fontSize: "12px", color: "var(--text2)", lineHeight: 1.65, marginBottom: "24px" }}>
          {stationId} has been committed to Polygon Amoy. The Pink Sheet and the full verification
          record — including party agent sign-offs — are permanently pinned to IPFS. This result
          is now final and cannot be altered by anyone.
        </p>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "16px", marginBottom: "20px", textAlign: "left" }}>
          <div style={{ display: "flex", height: "2px", borderRadius: "1px", overflow: "hidden", marginBottom: "14px" }}>
            <div style={{ background: "#CE1126", flex: 1 }} />
            <div style={{ background: "#FCD116", flex: 1 }} />
            <div style={{ background: "#006B3F", flex: 1 }} />
          </div>
          {[
            ["Polling Station", stationId],
            ["Transaction Hash", txHash ? shortHash(txHash) : "-"],
            ["Verification Record (IPFS)", recordCid ? shortHash(recordCid) : "-"],
            ["Pink Sheet Photo (IPFS)", imageCid ? shortHash(imageCid) : "-"],
            ["Network", "Polygon Amoy"],
            ["Status", "Final — Immutable"],
          ].map(([label, value]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid var(--border)", fontSize: "11px" }}>
              <span style={{ color: "var(--text2)" }}>{label}</span>
              <span style={{ color: label === "Status" ? "var(--accent2)" : "var(--bright)", fontFamily: "DM Mono,monospace", fontSize: "10px" }}>
                {value}
              </span>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
          {txHash && (
            <a href={explorerTx(txHash)} target="_blank" rel="noreferrer" style={{ fontSize: "12px", color: "var(--accent2)", textDecoration: "none" }}>
              View Transaction on PolygonScan
            </a>
          )}
          {recordCid && (
            <a href={ipfsUrl(recordCid)} target="_blank" rel="noreferrer" style={{ fontSize: "12px", color: "var(--accent2)", textDecoration: "none" }}>
              View Full Verification Record
            </a>
          )}
          {imageCid && (
            <a href={ipfsUrl(imageCid)} target="_blank" rel="noreferrer" style={{ fontSize: "12px", color: "var(--accent2)", textDecoration: "none" }}>
              View Pink Sheet Photo
            </a>
          )}
        </div>

        <button
          className="btn btn-secondary"
          onClick={() => navigate("/dashboard")}
          style={{ width: "100%", justifyContent: "center" }}
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}