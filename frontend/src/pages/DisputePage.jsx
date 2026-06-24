import React, { useEffect, useState } from "react";
import { useWallet } from "../context/WalletContext.jsx";
import { useContract } from "../hooks/useContract.js";
import { useIPFS } from "../hooks/useIPFS.js";
import { CANDIDATES } from "../data/ghana.js";
import { formatNumber, shortAddress } from "../utils/format.js";
import PinkSheetUpload from "../components/PinkSheetUpload.jsx";
import Toast from "../components/Toast.jsx";

export default function DisputePage() {
  const { contract, role } = useWallet();
  const { call, loading, txHash } = useContract();
  const { upload, ipfsHash: correctedHash, uploading, progress, error: ipfsError, fileName, reset } = useIPFS();

  const [flagged, setFlagged] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [selected, setSelected] = useState(null);
  const [corrVotes, setCorrVotes] = useState(CANDIDATES.map(() => ""));
  const [corrRejected, setCorrRejected] = useState("0");
  const [reason, setReason] = useState("");
  const [toast, setToast] = useState(null);

  async function load() {
    try {
      const ids = await contract.getAllStationIds();
      const results = await Promise.all(ids.map(id => contract.getResult(id)));
      setFlagged(results.filter(r => Number(r.status) === 2));
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  }

  useEffect(() => { if (contract) load(); }, [contract]);

  async function submitCorrection() {
    if (!selected || !correctedHash || !reason) return;
    try {
      await call(() => contract.requestCorrection(
        selected.stationId,
        corrVotes.map(v => BigInt(v || 0)),
        BigInt(corrRejected || 0),
        correctedHash,
        reason
      ));
      setToast({ message: "Correction submitted - awaiting 2-of-2 approval", type: "warning" });
      reset(); setSelected(null); setReason("");
      load();
    } catch (err) { console.error(err); }
  }

  async function approve(correctionId) {
    try {
      await call(() => contract.approveCorrection(correctionId));
      setToast({ message: "Correction approved", type: "success" });
      load();
    } catch (err) { console.error(err); }
  }

  if (fetching) return (
    <div className="loading-state" style={{ paddingTop: "80px" }}>
      <div className="spinner" /> Loading disputes...
    </div>
  );

  return (
    <div className="page-wrap">
      <div className="page-header">
        <span className="eyebrow">Multi-Sig Dispute Resolution</span>
        <h1 className="page-title">Flagged Results</h1>
        <div className="page-sub">{flagged.length} result(s) require attention</div>
      </div>

      {flagged.length === 0 ? (
        <div className="panel" style={{ textAlign: "center", padding: "48px" }}>
          <div style={{ fontSize: "28px", marginBottom: "10px" }}>OK</div>
          <div style={{ fontSize: "14px", color: "var(--bright)", fontWeight: 600, marginBottom: "5px" }}>No Disputes</div>
          <div style={{ fontSize: "12px", color: "var(--text2)" }}>All results are in good standing.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {flagged.map(r => (
            <div key={r.stationId} className="panel" style={{ border: "1px solid rgba(206,17,38,0.3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--bright)" }}>{r.stationId} - {r.stationName}</div>
                  <div style={{ fontSize: "11px", color: "var(--text2)" }}>{r.constituency} - {r.district}</div>
                </div>
                <span className="pill flag">Flagged</span>
              </div>

              <div style={{ background: "rgba(206,17,38,0.05)", border: "1px solid rgba(206,17,38,0.2)", borderRadius: "var(--r-sm)", padding: "12px", marginBottom: "12px" }}>
                <div style={{ fontSize: "9px", fontWeight: 700, color: "#f87171", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>
                  Original Flagged Figures
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "8px" }}>
                  {CANDIDATES.map((c, i) => (
                    <div key={c.party}>
                      <div style={{ fontSize: "9px", color: "var(--text2)" }}>{c.name} ({c.party})</div>
                      <div style={{ fontFamily: "DM Mono,monospace", fontSize: "14px", color: "#f87171", fontWeight: 600 }}>
                        {formatNumber(r.votes[i] || 0)}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: "8px", fontSize: "10px", color: "var(--text2)" }}>
                  Accredited: <span style={{ fontFamily: "DM Mono,monospace", color: "var(--bright)" }}>{formatNumber(r.accreditedVoters)}</span>
                  {" - "}Submitted by: <span style={{ fontFamily: "DM Mono,monospace" }}>{shortAddress(r.submittedBy)}</span>
                </div>
              </div>

              {role === "PRESIDING" && selected?.stationId !== r.stationId && (
                <button className="btn btn-secondary" onClick={() => { setSelected(r); setCorrVotes(r.votes.map(v => v.toString())); }}>
                  Submit Correction
                </button>
              )}

              {selected?.stationId === r.stationId && (
                <div style={{ background: "rgba(0,107,63,0.05)", border: "1px solid rgba(0,107,63,0.2)", borderRadius: "var(--r-sm)", padding: "14px", marginTop: "10px" }}>
                  <div style={{ fontSize: "9px", fontWeight: 700, color: "var(--accent2)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>
                    Corrected Figures
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "8px", marginBottom: "10px" }}>
                    {CANDIDATES.map((c, i) => (
                      <div key={c.party} className="field">
                        <label>{c.name} ({c.party})</label>
                        <input type="number" min="0" value={corrVotes[i]}
                          onChange={e => setCorrVotes(v => { const n = [...v]; n[i] = e.target.value; return n; })}
                          style={{ fontFamily: "DM Mono,monospace" }} />
                      </div>
                    ))}
                  </div>
                  <div className="field" style={{ marginBottom: "10px" }}>
                    <label>Rejected Ballots</label>
                    <input type="number" min="0" value={corrRejected} onChange={e => setCorrRejected(e.target.value)} style={{ fontFamily: "DM Mono,monospace" }} />
                  </div>
                  <div className="field" style={{ marginBottom: "10px" }}>
                    <label>Reason for Correction</label>
                    <input value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Data entry error - transposed digits" />
                  </div>
                  <div style={{ marginBottom: "10px" }}>
                    <label style={{ fontSize: "9px", fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "5px" }}>
                      Corrected Pink Sheet
                    </label>
                    <PinkSheetUpload onUpload={f => upload(f, r.stationId)} ipfsHash={correctedHash} uploading={uploading} progress={progress} error={ipfsError} fileName={fileName} />
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button className="btn btn-primary" onClick={submitCorrection} disabled={loading || !correctedHash || !reason}>
                      Submit Correction
                    </button>
                    <button className="btn btn-ghost" onClick={() => { setSelected(null); reset(); }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {toast && <Toast message={toast.message} type={toast.type} txHash={txHash} onClose={() => setToast(null)} />}
    </div>
  );
}