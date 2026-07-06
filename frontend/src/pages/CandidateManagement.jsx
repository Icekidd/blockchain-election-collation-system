import React, { useEffect, useState } from "react";
import { useWallet } from "../context/WalletContext.jsx";
import { useContract } from "../hooks/useContract.js";
import { ELECTION_STATUS } from "../utils/contract.js";
import { RoleGuard } from "../components/RoleGuard.jsx";
import Toast from "../components/Toast.jsx";

export default function CandidateManagement() {
  return (
    <RoleGuard roles={["SENIOR"]}>
      <CandidateManagementContent />
    </RoleGuard>
  );
}

function CandidateManagementContent() {
  const { contract } = useWallet();
  const { call, loading, txHash } = useContract();

  const [candidates,     setCandidates]     = useState([]);
  const [electionStatus, setElectionStatus] = useState(null);
  const [fetching,       setFetching]       = useState(true);
  const [toast,          setToast]          = useState(null);
  const [form,           setForm]           = useState({ name: "", party: "", color: "#006B3F" });
  const [error,          setError]          = useState("");

  const isSetup = electionStatus === 0;

  async function load() {
    try {
      const [cands, status] = await Promise.all([
        contract.getCandidates(),
        contract.getElectionStatus(),
      ]);
      setCandidates(cands.map(c => ({ name: c.name, party: c.party, color: c.color })));
      setElectionStatus(Number(status));
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  }

  useEffect(() => { if (contract) load(); }, [contract]);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function addCandidate() {
    setError("");
    if (!form.name.trim())  { setError("Candidate name is required"); return; }
    if (!form.party.trim()) { setError("Party name is required"); return; }
    if (candidates.find(c => c.party.toLowerCase() === form.party.trim().toLowerCase())) {
      setError("This party already has a candidate"); return;
    }

    try {
      await call(() => contract.addCandidate(form.name.trim(), form.party.trim().toUpperCase(), form.color));
      setToast({ message: `${form.name} (${form.party.toUpperCase()}) added`, type: "success" });
      setForm({ name: "", party: "", color: "#006B3F" });
      load();
    } catch (err) { console.error(err); }
  }

  async function removeCandidate(index, name) {
    if (!window.confirm(`Remove ${name} from the ballot?`)) return;
    try {
      await call(() => contract.removeCandidate(index));
      setToast({ message: `${name} removed`, type: "warning" });
      load();
    } catch (err) { console.error(err); }
  }

  if (fetching) return (
    <div className="loading-state" style={{ paddingTop: "80px" }}>
      <div className="spinner" /> Loading candidates...
    </div>
  );

  return (
    <div className="page-wrap">
      <div className="page-header">
        <span className="eyebrow">Senior EC Officer</span>
        <h1 className="page-title">Candidate Management</h1>
        <div className="page-sub">
          Election status:{" "}
          <span style={{ color: isSetup ? "var(--accent2)" : "var(--gold)" }}>
            {ELECTION_STATUS[electionStatus] || "-"}
          </span>
          {" · "}{candidates.length} candidate{candidates.length !== 1 ? "s" : ""} registered
        </div>
      </div>

      {!isSetup && (
        <div style={{
          background: "rgba(252,209,22,0.06)", border: "1px solid rgba(252,209,22,0.25)",
          borderRadius: "var(--r-md)", padding: "12px 16px", marginBottom: "16px",
          fontSize: "12px", color: "var(--gold)",
        }}>
          Candidates can only be added or removed while the election is in SETUP status.
          Change the status from the Dashboard if you need to modify the ballot.
        </div>
      )}

      {/* Add candidate form */}
      {isSetup && (
        <div className="panel" style={{ marginBottom: "16px" }}>
          <div className="panel-title">
            <div className="dot" style={{ background: "var(--accent2)" }} />
            Add Candidate to Ballot
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr auto auto", gap: "10px", alignItems: "flex-end" }}>
            <div className="field">
              <label>Candidate Full Name</label>
              <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Mahamudu Bawumia" />
            </div>
            <div className="field">
              <label>Party</label>
              <input value={form.party} onChange={e => set("party", e.target.value)} placeholder="e.g. NPP" style={{ textTransform: "uppercase" }} />
            </div>
            <div className="field">
              <label>Party Color</label>
              <input type="color" value={form.color} onChange={e => set("color", e.target.value)} style={{ width: "54px", height: "38px", padding: "3px", cursor: "pointer" }} />
            </div>
            <button className="btn btn-primary" onClick={addCandidate} disabled={loading} style={{ height: "38px" }}>
              {loading ? "Adding..." : "Add"}
            </button>
          </div>
          {error && <div className="field-error" style={{ marginTop: "8px" }}>{error}</div>}
        </div>
      )}

      {/* Candidate list */}
      <div className="panel">
        <div className="panel-title">
          <div className="dot" style={{ background: "var(--gold)" }} />
          Ballot — {candidates.length} Candidate{candidates.length !== 1 ? "s" : ""}
        </div>

        {candidates.length === 0 ? (
          <div style={{ textAlign: "center", padding: "36px", color: "var(--text2)", fontSize: "12px" }}>
            No candidates on the ballot yet. Add candidates above before activating the election.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {candidates.map((c, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: "12px",
                background: "var(--bg2)", border: "1px solid var(--border)",
                borderLeft: `4px solid ${c.color}`,
                borderRadius: "var(--r-sm)", padding: "12px 14px",
              }}>
                <div style={{
                  width: "34px", height: "34px", borderRadius: "50%",
                  background: c.color + "22", border: `2px solid ${c.color}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "13px", fontWeight: 700, color: c.color, flexShrink: 0,
                }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--bright)" }}>{c.name}</div>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: c.color, textTransform: "uppercase" }}>{c.party}</div>
                </div>
                <div style={{ fontFamily: "DM Mono,monospace", fontSize: "10px", color: "var(--text2)" }}>{c.color}</div>
                {isSetup && (
                  <button className="btn btn-danger" style={{ padding: "5px 12px", fontSize: "10px" }}
                    onClick={() => removeCandidate(i, c.name)} disabled={loading}>
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} txHash={txHash} onClose={() => setToast(null)} />}
    </div>
  );
}