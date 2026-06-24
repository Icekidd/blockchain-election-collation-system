import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../context/WalletContext.jsx";
import { useContract } from "../hooks/useContract.js";
import { useIPFS } from "../hooks/useIPFS.js";
import { validateSubmission } from "../utils/validation.js";
import { CANDIDATES, REGIONS, DISTRICTS_BY_REGION, CONSTITUENCIES_BY_DISTRICT } from "../data/ghana.js";
import PinkSheetUpload from "../components/PinkSheetUpload.jsx";
import Toast from "../components/Toast.jsx";
import { RoleGuard } from "../components/RoleGuard.jsx";

export default function SubmitResult() {
  return (
    <RoleGuard roles={["PRESIDING"]}>
      <SubmitForm />
    </RoleGuard>
  );
}

function SubmitForm() {
  const { contract } = useWallet();
  const { call, loading, error: txError, txHash } = useContract();
  const { upload, ipfsHash, uploading, progress, error: ipfsError, fileName, reset: resetIPFS } = useIPFS();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    stationId: "", stationName: "", region: "",
    district: "", constituency: "",
    registeredVoters: "", accreditedVoters: "", rejectedBallots: "0",
  });
  const [votes, setVotes] = useState(CANDIDATES.map(() => ""));
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  const districts = form.region ? (DISTRICTS_BY_REGION[form.region] || []) : [];
  const constituencies = form.district ? (CONSTITUENCIES_BY_DISTRICT[form.district] || []) : [];

  async function handleUpload(file) {
    if (!form.stationId) {
      setErrors(e => ({ ...e, ipfsHash: "Enter Station ID before uploading" }));
      return;
    }
    await upload(file, form.stationId);
  }

  async function handleSubmit() {
    const { errors: errs, isValid } = validateSubmission({
      ...form, votes: votes.map(Number), ipfsHash,
    });
    setErrors(errs);
    if (!isValid) return;

    try {
      await call(() => contract.submitResult(
        form.stationId.toUpperCase(),
        form.stationName,
        form.constituency,
        form.district,
        form.region,
        votes.map(v => BigInt(v || 0)),
        BigInt(form.registeredVoters),
        BigInt(form.accreditedVoters),
        BigInt(form.rejectedBallots || 0),
        ipfsHash
      ));
      setToast({ message: "Result recorded on-chain successfully", type: "success" });
      setTimeout(() => navigate("/success", {
        state: { stationId: form.stationId, txHash, ipfsHash }
      }), 1500);
    } catch (err) {
      console.error(err);
    }
  }

  const totalVotes = votes.reduce((s, v) => s + Number(v || 0), 0);
  const accredited = Number(form.accreditedVoters || 0);
  const rejected = Number(form.rejectedBallots || 0);
  const validTotal = accredited > 0 && (totalVotes + rejected) <= accredited;

  return (
    <div className="page-wrap" style={{ maxWidth: "700px", margin: "0 auto" }}>
      <div className="page-header">
        <span className="eyebrow">Presiding Officer</span>
        <h1 className="page-title">Submit Polling Station Result</h1>
        <div className="page-sub">Results are permanently recorded on-chain once submitted</div>
      </div>

      <div style={{ maxWidth: "600px", margin: "0 auto" }}>

        <div style={{ marginBottom: "22px" }}>
          <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text2)", marginBottom: "10px", paddingBottom: "7px", borderBottom: "1px solid var(--border)" }}>
            01 - Station Location
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
            <div className="field">
              <label>Region</label>
              <select value={form.region} onChange={e => { set("region", e.target.value); set("district", ""); set("constituency", ""); }}>
                <option value="">Select region...</option>
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="field">
              <label>District</label>
              <select value={form.district} onChange={e => { set("district", e.target.value); set("constituency", ""); }} disabled={!form.region}>
                <option value="">Select district...</option>
                {districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
            <div className="field">
              <label>Constituency</label>
              <select value={form.constituency} onChange={e => set("constituency", e.target.value)} disabled={!form.district}>
                <option value="">Select constituency...</option>
                {constituencies.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.constituency && <div className="field-error">{errors.constituency}</div>}
            </div>
            <div className="field">
              <label>Polling Station ID</label>
              <input value={form.stationId} onChange={e => set("stationId", e.target.value)} placeholder="e.g. PS-GA-0221" style={{ fontFamily: "DM Mono,monospace" }} />
              {errors.stationId && <div className="field-error">{errors.stationId}</div>}
            </div>
          </div>
          <div className="field">
            <label>Station Name</label>
            <input value={form.stationName} onChange={e => set("stationName", e.target.value)} placeholder="e.g. Ablekuma D/A Primary School" />
            {errors.stationName && <div className="field-error">{errors.stationName}</div>}
          </div>
        </div>

        <div style={{ marginBottom: "22px" }}>
          <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text2)", marginBottom: "10px", paddingBottom: "7px", borderBottom: "1px solid var(--border)" }}>
            02 - Accreditation Figures
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
            {[["registeredVoters", "Registered Voters"], ["accreditedVoters", "Accredited Voters"], ["rejectedBallots", "Rejected Ballots"]].map(([k, label]) => (
              <div key={k} className="field">
                <label>{label}</label>
                <input type="number" min="0" value={form[k]} onChange={e => set(k, e.target.value)} placeholder="0" style={{ fontFamily: "DM Mono,monospace" }} />
                {errors[k] && <div className="field-error">{errors[k]}</div>}
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: "22px" }}>
          <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text2)", marginBottom: "10px", paddingBottom: "7px", borderBottom: "1px solid var(--border)" }}>
            03 - Votes Per Candidate
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px", marginBottom: "12px" }}>
            {CANDIDATES.map((c, i) => (
              <div key={c.party} style={{
                background: "var(--bg2)",
                border: "1px solid var(--border)",
                borderLeft: "3px solid " + c.color,
                borderRadius: "var(--r-sm)",
                padding: "10px",
              }}>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--bright)", marginBottom: "2px" }}>{c.name}</div>
                <div style={{ fontSize: "9px", fontWeight: 700, color: c.color, marginBottom: "7px", textTransform: "uppercase" }}>{c.party}</div>
                <input
                  type="number" min="0" value={votes[i]}
                  onChange={e => setVotes(v => { const n = [...v]; n[i] = e.target.value; return n; })}
                  style={{ width: "100%", padding: "7px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-sm)", color: "var(--bright)", fontSize: "16px", fontFamily: "DM Mono,monospace", fontWeight: 700, textAlign: "center", outline: "none" }}
                />
              </div>
            ))}
          </div>
          {accredited > 0 && (
            <div style={{
              background: validTotal ? "rgba(0,107,63,0.07)" : "rgba(206,17,38,0.07)",
              border: "1px solid " + (validTotal ? "rgba(0,146,79,0.2)" : "rgba(206,17,38,0.25)"),
              borderRadius: "var(--r-sm)", padding: "10px 14px",
              display: "flex", alignItems: "center", gap: "9px", fontSize: "11px",
            }}>
              <span>{validTotal ? "OK" : "!!"}</span>
              <span style={{ color: "var(--text)" }}>
                Total: <strong style={{ color: "var(--bright)", fontFamily: "DM Mono,monospace" }}>{totalVotes}</strong>
                {" + rejected: "}
                <strong style={{ color: "var(--bright)", fontFamily: "DM Mono,monospace" }}>{rejected}</strong>
                {" of accredited: "}
                <strong style={{ color: "var(--bright)", fontFamily: "DM Mono,monospace" }}>{accredited}</strong>
              </span>
            </div>
          )}
          {errors.votes && <div className="field-error" style={{ marginTop: "6px" }}>{errors.votes}</div>}
        </div>

        <div style={{ marginBottom: "22px" }}>
          <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text2)", marginBottom: "10px", paddingBottom: "7px", borderBottom: "1px solid var(--border)" }}>
            04 - Upload Pink Sheet (EC8A Form)
          </div>
          <PinkSheetUpload
            onUpload={handleUpload}
            ipfsHash={ipfsHash}
            uploading={uploading}
            progress={progress}
            error={ipfsError || errors.ipfsHash}
            fileName={fileName}
          />
        </div>

        {txError && (
          <div style={{ background: "rgba(206,17,38,0.07)", border: "1px solid rgba(206,17,38,0.25)", borderRadius: "var(--r-sm)", padding: "10px 14px", marginBottom: "14px", fontSize: "12px", color: "#f87171" }}>
            {txError}
          </div>
        )}

        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={loading || uploading}
          style={{ width: "100%", justifyContent: "center", padding: "14px", fontSize: "14px" }}
        >
          {loading ? (
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div className="spinner" /> Recording on-chain...
            </span>
          ) : "Record Result On-Chain"}
        </button>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} txHash={txHash} onClose={() => setToast(null)} />}
    </div>
  );
}