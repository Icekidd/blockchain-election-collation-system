import React from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../context/WalletContext.jsx";

export default function ConnectPage() {
  const { connectWallet, loading, error, account } = useWallet();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (account) navigate("/dashboard");
  }, [account, navigate]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "radial-gradient(ellipse 55% 45% at 50% 42%, rgba(0,107,63,0.1) 0%, transparent 70%)",
      padding: "24px",
    }}>
      <div style={{ maxWidth: "400px", width: "100%", textAlign: "center" }}>

        <div style={{
          width: "88px", height: "88px", borderRadius: "50%",
          margin: "0 auto 16px",
          background: "linear-gradient(145deg,#0e2015,#1a3d24)",
          border: "2px solid rgba(252,209,22,0.35)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexDirection: "column", gap: "2px",
          boxShadow: "0 0 56px rgba(0,107,63,0.2), 0 0 0 8px rgba(0,107,63,0.05)",
        }}>
          <div style={{ fontSize: "30px", lineHeight: 1 }}>*</div>
          <div style={{ fontSize: "7px", fontFamily: "DM Mono,monospace", color: "var(--gold)", letterSpacing: "0.1em" }}>
            EC GHANA
          </div>
        </div>

        <div style={{ display: "flex", height: "2px", width: "64px", borderRadius: "1px", overflow: "hidden", margin: "0 auto 20px" }}>
          <div style={{ background: "#CE1126", flex: 1 }} />
          <div style={{ background: "#FCD116", flex: 1 }} />
          <div style={{ background: "#006B3F", flex: 1 }} />
        </div>

        <div style={{ fontSize: "11px", fontFamily: "DM Mono,monospace", color: "var(--gold)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "10px" }}>
          Electoral Commission of Ghana
        </div>

        <h1 style={{ fontSize: "26px", fontWeight: 700, color: "var(--bright)", lineHeight: 1.2, marginBottom: "10px" }}>
          Election Collation System
        </h1>

        <p style={{ fontSize: "13px", color: "var(--text2)", lineHeight: 1.65, marginBottom: "28px" }}>
          Connect your EC Ghana registered wallet to collate and verify
          polling station results on Polygon Amoy. Only accredited
          officers may access this system.
        </p>

        {error && (
          <div style={{
            background: "rgba(206,17,38,0.08)",
            border: "1px solid rgba(206,17,38,0.25)",
            borderRadius: "var(--r-sm)",
            padding: "10px 14px",
            marginBottom: "14px",
            fontSize: "12px",
            color: "#f87171",
            textAlign: "left",
          }}>
            {error}
          </div>
        )}

        <button
          onClick={connectWallet}
          disabled={loading}
          className="btn btn-primary"
          style={{ width: "100%", justifyContent: "center", padding: "14px", fontSize: "14px" }}
        >
          {loading ? (
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div className="spinner" /> Connecting...
            </span>
          ) : (
            "Connect with MetaMask"
          )}
        </button>

        <p style={{ marginTop: "14px", fontSize: "11px", color: "var(--text2)" }}>
          Must be connected to{" "}
          <span style={{ color: "var(--accent2)" }}>Polygon Amoy</span>
          {" "}testnet - Chain ID 80002
        </p>

        <div style={{ display: "flex", gap: "8px", marginTop: "28px", justifyContent: "center", flexWrap: "wrap" }}>
          {[
            ["On-chain immutability"],
            ["Pink Sheet on IPFS"],
            ["Role-based access"],
          ].map(([label]) => (
            <div key={label} style={{
              padding: "7px 12px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-sm)",
              fontSize: "10px",
              color: "var(--text2)",
            }}>
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}