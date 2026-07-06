import React, { useState } from "react";
import { getReadOnlyContract, RESULT_STATUS } from "../utils/contract.js";
import { useCandidates } from "../hooks/useCandidates.js";
import { formatNumber, formatTimestamp, shortAddress, ipfsGateway } from "../utils/format.js";

const CONTRACT_ADDR = import.meta.env.VITE_CONTRACT_ADDRESS;

export default function VerifyResult() {
  const { candidates: CANDIDATES } = useCandidates();
  const [stationId, setStationId] = useState("");
  const [result,    setResult]    = useState(null);
  const [error,     setError]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [searched,  setSearched]  = useState(false);

  async function verify() {
    const id = stationId.trim().toUpperCase();
    if (!id) { setError("Enter a polling station ID"); return; }

    setLoading(true);
    setError("");
    setResult(null);
    setSearched(false);

    try {
      const c = getReadOnlyContract();
      const r = await c.getResult(id);
      if (Number(r.submittedAt) === 0) {
        setError(`No result found for station "${id}". Check the ID and try again — results only appear after a Presiding Officer submits them.`);
      } else {
        setResult(r);
      }
    } catch (err) {
      console.error(err);
      setError(`No result found for station "${id}". Check the ID and try again.`);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }

  const statusInfo = result ? (RESULT_STATUS[Number(result.status)] || RESULT_STATUS[0]) : null;
  const totalVotes = result ? result.votes.reduce((s, v) => s + BigInt(v), 0n) : 0n;

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse 70% 40% at 50% 0%, rgba(0,107,63,0.1) 0%, transparent 60%), var(--bg)",
      padding: "44px 20px 56px",
    }}>
      <div style={{ maxWidth: "640px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <div style={{ display: "flex", height: "3px", borderRadius: "2px", overflow: "hidden", width: "80px", margin: "0 auto 18px" }}>
            <div style={{ background: "#CE1126", flex: 1 }} />
            <div style={{ background: "#FCD116", flex: 1 }} />
            <div style={{ background: "#006B3F", flex: 1 }} />
          </div>
          <div style={{ fontSize: "10px", fontFamily: "DM Mono,monospace", color: "var(--gold)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: "8px" }}>
            Electoral Commission of Ghana
          </div>
          <h1 style={{ fontSize: "26px", fontWeight: 700, color: "var(--bright)", marginBottom: "8px" }}>
            Verify a Polling Station Result
          </h1>
          <p style={{ fontSize: "12px", color: "var(--text2)", lineHeight: 1.65, maxWidth: "440px", margin: "0 auto" }}>
            Enter any polling station code to see its official result exactly as recorded
            on the blockchain — including the original Pink Sheet. No login required.
          </p>
        </div>

        {/* Search */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
          <input
            value={stationId}
            onChange={e => setStationId(e.target.value)}
            onKeyDown={e => e.key === "Enter" && verify()}
            placeholder="e.g. A010101"
            style={{
              flex: 1, padding: "13px 16px",
              background: "var(--surface)", border: "1px solid var(--border2)",
              borderRadius: "var(--r-md)", color: "var(--bright)",
              fontSize: "15px", fontFamily: "DM Mono,monospace",
              letterSpacing: "0.08em", outline: "none", textTransform: "uppercase",
            }}
          />
          <button className="btn btn-primary" onClick={verify} disabled={loading} style={{ padding: "13px 22px" }}>
            {loading ? <span style={{ display: "flex", alignItems: "center", gap: "7px" }}><div className="spinner" style={{ width: "14px", height: "14px" }} /> Checking...</span> : "Verify"}
          </button>
        </div>

        {error && searched && (
          <div style={{
            background: "rgba(206,17,38,0.07)", border: "1px solid rgba(206,17,38,0.25)",
            borderRadius: "var(--r-md)", padding: "16px 18px",
            fontSize: "12px", color: "#f87171", lineHeight: 1.6, textAlign: "center",
          }}>
            {error}
          </div>
        )}

        {/* Result card */}
        {result && (
          <div style={{ animation: "slideUp 0.3s ease" }}>

            {/* Station header */}
            <div className="panel" style={{ marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <div style={{ fontSize: "11px", fontFamily: "DM Mono,monospace", color: "var(--gold)", marginBottom: "4px" }}>
                    {result.stationId}
                  </div>
                  <div style={{ fontSize: "17px", fontWeight: 700, color: "var(--bright)" }}>{result.stationName}</div>
                  <div style={{ fontSize: "11px", color: "var(--text2)", marginTop: "3px" }}>
                    {result.constituency} Constituency · {result.district} · {result.region} Region
                  </div>
                </div>
                <span className={`pill ${statusInfo.style}`} style={{ fontSize: "11px", padding: "4px 12px" }}>
                  {statusInfo.label}
                </span>
              </div>
            </div>

            {/* Votes */}
            <div className="panel" style={{ marginBottom: "12px" }}>
              <div className="panel-title">
                <div className="dot" style={{ background: "var(--gold)" }} />
                Votes Recorded — {formatNumber(totalVotes)} total
              </div>
              {CANDIDATES.map((c, i) => {
                const v = BigInt(result.votes[i] || 0);
                const pct = totalVotes > 0n ? Number((v * 1000n) / totalVotes) / 10 : 0;
                return (
                  <div key={c.party} style={{ marginBottom: "11px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                      <span style={{ color: "var(--text)", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ width: "9px", height: "9px", borderRadius: "2px", background: c.color, display: "inline-block" }} />
                        {c.name} <span style={{ color: "var(--text2)", fontSize: "10px" }}>({c.party})</span>
                      </span>
                      <span style={{ fontFamily: "DM Mono,monospace", color: "var(--bright)" }}>
                        {formatNumber(v)} <span style={{ color: "var(--text2)" }}>· {pct}%</span>
                      </span>
                    </div>
                    <div style={{ background: "var(--bg2)", borderRadius: "3px", height: "7px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: c.color, borderRadius: "3px" }} />
                    </div>
                  </div>
                );
              })}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginTop: "14px", paddingTop: "12px", borderTop: "1px solid var(--border)" }}>
                {[
                  ["Registered", result.registeredVoters],
                  ["Accredited", result.accreditedVoters],
                  ["Rejected",   result.rejectedBallots],
                ].map(([label, value]) => (
                  <div key={label} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--bright)", fontFamily: "DM Mono,monospace" }}>{formatNumber(value)}</div>
                    <div style={{ fontSize: "9px", color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Provenance */}
            <div className="panel">
              <div className="panel-title">
                <div className="dot" style={{ background: "var(--accent2)" }} />
                On-Chain Provenance
              </div>
              {[
                ["Submitted by",  shortAddress(result.submittedBy)],
                ["Submitted at",  formatTimestamp(result.submittedAt)],
                ["Status",        statusInfo.label],
              ].map(([label, value]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid var(--border)", fontSize: "11px" }}>
                  <span style={{ color: "var(--text2)" }}>{label}</span>
                  <span style={{ color: "var(--bright)", fontFamily: "DM Mono,monospace", fontSize: "10px" }}>{value}</span>
                </div>
              ))}
              <div style={{ display: "flex", gap: "8px", marginTop: "14px", flexWrap: "wrap" }}>
                {result.ipfsHash && (
                  <a href={ipfsGateway(result.ipfsHash)} target="_blank" rel="noreferrer"
                    className="btn btn-secondary" style={{ fontSize: "11px", textDecoration: "none" }}>
                    View Original Pink Sheet (IPFS)
                  </a>
                )}
                <a href={`https://amoy.polygonscan.com/address/${CONTRACT_ADDR}`} target="_blank" rel="noreferrer"
                  className="btn btn-ghost" style={{ fontSize: "11px", textDecoration: "none" }}>
                  Verify Contract on PolygonScan
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Footer note */}
        <div style={{ textAlign: "center", marginTop: "28px", fontSize: "10px", color: "var(--text3)", fontFamily: "DM Mono,monospace" }}>
          Results are immutable once recorded · Contract: {CONTRACT_ADDR?.slice(0, 10)}…{CONTRACT_ADDR?.slice(-6)}
        </div>
      </div>
    </div>
  );
}