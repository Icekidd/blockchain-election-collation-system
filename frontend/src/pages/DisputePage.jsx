import React, { useEffect, useState } from "react";
import { useWallet } from "../context/WalletContext.jsx";
import { useContract } from "../hooks/useContract.js";
import { useIPFS } from "../hooks/useIPFS.js";
import { formatNumber, shortAddress } from "../utils/format.js";
import PinkSheetUpload from "../components/PinkSheetUpload.jsx";
import Toast from "../components/Toast.jsx";
import { useCandidates } from "../hooks/useCandidates.js";

const MAX_CORRECTIONS_SCAN = 500; // correction IDs are sequential from 0

export default function DisputePage() {
  const { candidates: CANDIDATES } = useCandidates();
  const { contract, role } = useWallet();
  const { call, loading, txHash } = useContract();
  const { upload, ipfsHash: correctedHash, uploading, progress, error: ipfsError, fileName, reset } = useIPFS();

  const [flagged, setFlagged] = useState([]);
  const [pending, setPending] = useState(new Map()); // stationId -> latest unexecuted CorrectionRequest
  const [fetching, setFetching] = useState(true);
  const [selected, setSelected] = useState(null);
  const [corrVotes, setCorrVotes] = useState([]);
  const [corrRejected, setCorrRejected] = useState("0");
  const [reason, setReason] = useState("");
  const [toast, setToast] = useState(null);

  // On-chain approval rights — mirrors exactly what approveCorrection checks,
  // so it stays correct even if the app-level role string and chain disagree.
  const [canRO, setCanRO] = useState(false);
  const [canSenior, setCanSenior] = useState(false);

  React.useEffect(() => {
    if (CANDIDATES.length > 0 && corrVotes.length === 0) {
      setCorrVotes(CANDIDATES.map(() => ""));
    }
  }, [CANDIDATES]);

  async function loadRoles() {
    try {
      const addr = await contract.runner.getAddress();
      const [roRole, srRole] = await Promise.all([
        contract.RETURNING_OFFICER_ROLE(),
        contract.SENIOR_EC_OFFICER_ROLE(),
      ]);
      const [isRO, isSenior] = await Promise.all([
        contract.hasRole(roRole, addr),
        contract.hasRole(srRole, addr),
      ]);
      setCanRO(isRO);
      setCanSenior(isSenior);
    } catch (err) {
      // Fallback to the app-level role string if the ABI lacks AccessControl views
      console.warn("hasRole check failed, falling back to app role:", err);
      setCanRO(role === "RETURNING");
      setCanSenior(role === "SENIOR");
    }
  }

  async function load() {
    try {
      const ids = await contract.getAllStationIds();
      const results = await Promise.all(ids.map(id => contract.getResult(id)));
      setFlagged(results.filter(r => Number(r.status) === 2));

      // Enumerate correction requests. IDs are assigned sequentially from 0
      // (_correctionCount++), so scan until the first empty slot.
      const map = new Map();
      for (let id = 0; id < MAX_CORRECTIONS_SCAN; id++) {
        const c = await contract.getCorrection(id);
        if (Number(c.requestedAt) === 0) break;
        if (c.executed) continue;
        // Latest pending request per station wins
        map.set(c.stationId, {
          id,
          stationId: c.stationId,
          correctedVotes: c.correctedVotes.map(v => Number(v)),
          correctedRejected: Number(c.correctedRejected),
          correctedIpfsHash: c.correctedIpfsHash,
          reason: c.reason,
          requestedBy: c.requestedBy,
          requestedAt: Number(c.requestedAt),
          roApproved: c.roApproved,
          seniorApproved: c.seniorApproved,
        });
      }
      setPending(map);
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  }

  useEffect(() => {
    if (contract) {
      load();
      loadRoles();
    }
  }, [contract]);

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
    } catch (err) {
      console.error(err);
      setToast({ message: err?.reason || err?.shortMessage || "Correction failed", type: "warning" });
    }
  }

  async function approve(correctionId) {
    try {
      await call(() => contract.approveCorrection(correctionId));
      setToast({ message: "Approval recorded on-chain", type: "success" });
      load();
    } catch (err) {
      console.error(err);
      setToast({ message: err?.reason || err?.shortMessage || "Approval failed", type: "warning" });
    }
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
          {flagged.map(r => {
            const p = pending.get(r.stationId) || null;
            const iApprovedAlready = p && ((canRO && p.roApproved && !canSenior) || (canSenior && p.seniorApproved && !canRO));
            const canApproveNow = p && ((canRO && !p.roApproved) || (canSenior && !p.seniorApproved && !canRO));
            // Deadlock guard: a wallet holding BOTH roles always enters the
            // contract's RO branch first, so once roApproved is true it can
            // never provide the senior approval — surface that instead of a
            // button that would revert.
            const dualRoleBlocked = p && canRO && canSenior && p.roApproved && !p.seniorApproved;

            return (
              <div key={r.stationId} className="panel" style={{ border: "1px solid rgba(206,17,38,0.3)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--bright)" }}>{r.stationId} - {r.stationName}</div>
                    <div style={{ fontSize: "11px", color: "var(--text2)" }}>{r.constituency} - {r.district}</div>
                  </div>
                  <span className="pill flag">{p ? "Correction Pending" : "Flagged"}</span>
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

                {/* ── Pending correction: proposed figures + 2-of-2 progress ── */}
                {p && (
                  <div style={{ background: "rgba(0,107,63,0.05)", border: "1px solid rgba(0,107,63,0.25)", borderRadius: "var(--r-sm)", padding: "14px", marginBottom: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}>
                      <div style={{ fontSize: "9px", fontWeight: 700, color: "var(--accent2)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                        Proposed Correction #{p.id}
                      </div>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <span className={"pill " + (p.roApproved ? "ok" : "lock")}>
                          RO {p.roApproved ? "Approved" : "Pending"}
                        </span>
                        <span className={"pill " + (p.seniorApproved ? "ok" : "lock")}>
                          Senior EC {p.seniorApproved ? "Approved" : "Pending"}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "8px", marginBottom: "8px" }}>
                      {CANDIDATES.map((c, i) => (
                        <div key={c.party}>
                          <div style={{ fontSize: "9px", color: "var(--text2)" }}>{c.name} ({c.party})</div>
                          <div style={{ fontFamily: "DM Mono,monospace", fontSize: "14px", color: "var(--accent2)", fontWeight: 600 }}>
                            {formatNumber(p.correctedVotes[i] || 0)}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ fontSize: "10px", color: "var(--text2)", marginBottom: "10px" }}>
                      Rejected: <span style={{ fontFamily: "DM Mono,monospace", color: "var(--bright)" }}>{formatNumber(p.correctedRejected)}</span>
                      {" - "}Reason: <span style={{ color: "var(--bright)" }}>{p.reason}</span>
                      {" - "}By: <span style={{ fontFamily: "DM Mono,monospace" }}>{shortAddress(p.requestedBy)}</span>
                      {p.correctedIpfsHash && (
                        <>
                          {" - "}
                          <a href={"https://gateway.pinata.cloud/ipfs/" + p.correctedIpfsHash} target="_blank" rel="noreferrer" style={{ color: "#a78bfa", textDecoration: "none" }}>
                            Corrected Pink Sheet
                          </a>
                        </>
                      )}
                    </div>

                    {canApproveNow && !dualRoleBlocked && (
                      <button className="btn btn-primary" onClick={() => approve(p.id)} disabled={loading}>
                        {canRO && !p.roApproved
                          ? "Approve as Returning Officer"
                          : "Approve as Senior EC Officer"}
                      </button>
                    )}

                    {dualRoleBlocked && (
                      <div style={{ fontSize: "10px", color: "#fbbf24", lineHeight: 1.5 }}>
                        This wallet holds both the RO and Senior EC roles, and the contract's
                        approval routing always enters the RO branch first — so it cannot
                        record the Senior approval. Revoke this wallet's RETURNING_OFFICER_ROLE
                        (via revokeRole on the contract) or approve from a wallet holding only
                        the Senior EC role.
                      </div>
                    )}

                    {iApprovedAlready && (
                      <div style={{ fontSize: "10px", color: "var(--text2)" }}>
                        Your approval is recorded — awaiting the second signature.
                      </div>
                    )}

                    {!canApproveNow && !dualRoleBlocked && !iApprovedAlready && (
                      <div style={{ fontSize: "10px", color: "var(--text2)" }}>
                        Awaiting approval from the Returning Officer and Senior EC Officer.
                      </div>
                    )}
                  </div>
                )}

                {/* PO can only open a new correction when none is pending */}
                {role === "PRESIDING" && !p && selected?.stationId !== r.stationId && (
                  <button className="btn btn-secondary" onClick={() => { setSelected(r); setCorrVotes(r.votes.map(v => v.toString())); }}>
                    Submit Correction
                  </button>
                )}

                {selected?.stationId === r.stationId && !p && (
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
            );
          })}
        </div>
      )}
      {toast && <Toast message={toast.message} type={toast.type} txHash={txHash} onClose={() => setToast(null)} />}
    </div>
  );
}