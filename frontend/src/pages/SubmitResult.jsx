import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../context/WalletContext.jsx";
import { useContract } from "../hooks/useContract.js";
import { RoleGuard } from "../components/RoleGuard.jsx";
import Toast from "../components/Toast.jsx";
import OTPVerification from "../components/OTPVerification.jsx";
import { uploadToIPFS, uploadJSONToIPFS, ipfsUrl } from "../utils/ipfs.js";

// Parties whose agents MUST sign before submission is allowed.
const MAJOR_PARTIES = ["NPP", "NDC"];

export default function SubmitResult() {
  return (
    <RoleGuard roles={["PRESIDING_OFFICER"]}>
      <SubmitForm />
    </RoleGuard>
  );
}

function SubmitForm() {
  const { contract, station, account } = useWallet();
  const { call, loading, error: txError, txHash } = useContract();
  const navigate = useNavigate();

  const [stationInfo, setStationInfo] = useState(null); // { name, constituency, registeredVoters, submitted }
  const [candidates, setCandidates]   = useState([]);   // [{ name, party, color }]
  const [electionActive, setElectionActive] = useState(false);
  const [loadingCtx, setLoadingCtx]   = useState(true);

  const [imageFile, setImageFile] = useState(null);
  const [imageUrl,  setImageUrl]  = useState(null);
  const [zoom, setZoom]           = useState(1);

  const [votes, setVotes]         = useState([]);       // per candidate
  const [rejected, setRejected]   = useState("");
  const [accredited, setAccredited] = useState("");

  const [agents, setAgents]       = useState([]);       // [{ party, name, signed }]
  const [toast, setToast]         = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [stage, setStage]         = useState("");
  const [otpVerified, setOtpVerified] = useState(false);

  // Phone for OTP pre-fill — sourced from the RO's CSV upload (off-chain, per-device).
  const registeredPhone = useMemo(() => {
    const phones = JSON.parse(localStorage.getItem("officerPhones") || "{}");
    return account ? (phones[account.toLowerCase()] || "") : "";
  }, [account]);

  // ── Load on-chain context: station binding, candidates, status ──
  useEffect(() => {
    (async () => {
      if (!contract || !station) { setLoadingCtx(false); return; }
      try {
        const st = await contract.getStation(station);
        setStationInfo({
          name: st.name,
          constituency: st.constituency,
          registeredVoters: Number(st.registeredVoters),
          submitted: st.submitted,
        });

        const count = Number(await contract.getCandidateCount());
        const cs = [];
        for (let i = 0; i < count; i++) {
          const c = await contract.candidates(i);
          cs.push({ name: c.name, party: c.party, color: c.color });
        }
        setCandidates(cs);
        setVotes(cs.map(() => ""));
        setAgents(cs.map(c => ({ party: c.party, name: "", signed: false })));

        const status = Number(await contract.status());
        setElectionActive(status === 1); // 1 = Active
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingCtx(false);
      }
    })();
  }, [contract, station]);

  function onImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImageUrl(URL.createObjectURL(file));
    e.target.value = "";
  }

  // ── Derived totals ──
  const totalValid = useMemo(
    () => votes.reduce((s, v) => s + Number(v || 0), 0),
    [votes]
  );
  const rej = Number(rejected || 0);
  const acc = Number(accredited || 0);
  const totalCast = totalValid + rej;
  const registered = stationInfo?.registeredVoters || 0;

  // ── Validation ──
  const validation = useMemo(() => {
    const errs = [];
    if (votes.some(v => v === "" || Number(v) < 0)) errs.push("Enter votes for every candidate");
    if (accredited === "" || acc <= 0) errs.push("Enter accredited voters");
    if (rejected === "") errs.push("Enter rejected ballots (0 if none)");
    if (acc > 0 && totalCast > acc) errs.push(`Total cast (${totalCast}) exceeds accredited (${acc})`);
    if (registered > 0 && acc > registered) errs.push(`Accredited (${acc}) exceeds registered (${registered})`);
    return errs;
  }, [votes, accredited, rejected, acc, rej, totalCast, registered]);

  const figuresValid = validation.length === 0;

  // ── Agent sign-off rule: both major parties must sign ──
  const majorsSigned = MAJOR_PARTIES.every(
    mp => agents.find(a => a.party === mp)?.signed
  );
  const missingMajors = MAJOR_PARTIES.filter(
    mp => !agents.find(a => a.party === mp)?.signed
  );

  function setVote(i, val) {
    const clean = val.replace(/[^\d]/g, "");
    setVotes(v => { const n = [...v]; n[i] = clean; return n; });
  }
  function setAgentName(i, name) {
    setAgents(a => { const n = [...a]; n[i] = { ...n[i], name }; return n; });
  }
  function toggleAgentSign(i) {
    setAgents(a => {
      const n = [...a];
      // require a name before signing
      if (!n[i].signed && !n[i].name.trim()) {
        setToast({ message: "Enter the agent's name before they sign", type: "warning" });
        return a;
      }
      n[i] = { ...n[i], signed: !n[i].signed };
      return n;
    });
  }

  const canSubmit = imageFile && figuresValid && majorsSigned && otpVerified && !stationInfo?.submitted && electionActive;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      // 1. Pin the Pink Sheet image
      setStage("Uploading Pink Sheet image…");
      const imageCid = await uploadToIPFS(imageFile, station);

      // 2. Build the full verification record and pin it
      setStage("Creating verification record…");
      const record = {
        stationId: station,
        stationName: stationInfo.name,
        constituency: stationInfo.constituency,
        submittedBy: account,
        submittedAt: new Date().toISOString(),
        registeredVoters: registered,
        accreditedVoters: acc,
        rejectedBallots: rej,
        totalValidVotes: totalValid,
        totalVotesCast: totalCast,
        pinkSheetImageCid: imageCid,
        pinkSheetImageUrl: ipfsUrl(imageCid),
        candidates: candidates.map((c, i) => ({
          name: c.name, party: c.party, votes: Number(votes[i] || 0),
        })),
        partyAgents: agents.map(a => ({
          party: a.party, name: a.name.trim(), signed: a.signed,
          signedAt: a.signed ? new Date().toISOString() : null,
        })),
        majorPartiesRequired: MAJOR_PARTIES,
      };
      const recordCid = await uploadJSONToIPFS(record, station);

      // 3. Submit on-chain — immutable
      setStage("Recording result on-chain…");
      await call(() => contract.submitResult(
        votes.map(v => BigInt(v || 0)),
        BigInt(acc),
        BigInt(rej),
        recordCid,
      ));

      setToast({ message: "Result recorded permanently on-chain", type: "success" });
      setTimeout(() => navigate("/success", {
        state: { stationId: station, txHash, ipfsHash: recordCid, imageCid },
      }), 1400);
    } catch (err) {
      console.error(err);
      setToast({ message: err?.reason || err?.message || "Submission failed — check console", type: "error" });
    } finally {
      setSubmitting(false);
      setStage("");
    }
  }

  // ── Guard states ──
  if (loadingCtx) {
    return (
      <div className="page-wrap"><div className="loading-state"><div className="spinner" /> Loading station…</div></div>
    );
  }
  if (!station) {
    return (
      <div className="page-wrap">
        <div className="page-header"><span className="eyebrow">Presiding Officer</span><h1 className="page-title">Submit Result</h1></div>
        <div className="panel"><div style={{ textAlign: "center", padding: "32px", color: "var(--text2)", fontSize: "13px" }}>
          No polling station is bound to your wallet. Your returning officer must approve your assignment first.
        </div></div>
      </div>
    );
  }
  if (stationInfo?.submitted) {
    return (
      <div className="page-wrap">
        <div className="page-header"><span className="eyebrow">Presiding Officer</span><h1 className="page-title">Submit Result</h1></div>
        <div className="panel"><div style={{ textAlign: "center", padding: "32px", color: "var(--text2)", fontSize: "13px" }}>
          The result for <strong style={{ color: "var(--bright)" }}>{station}</strong> has already been submitted and is permanent. It cannot be changed.
        </div></div>
      </div>
    );
  }

  const inputBox = {
    width: "100%", padding: "10px", background: "var(--surface)", border: "1px solid var(--border)",
    borderRadius: "var(--r-sm)", color: "var(--bright)", fontSize: "16px",
    fontFamily: "DM Mono,monospace", fontWeight: 700, textAlign: "center", outline: "none",
  };

  return (
    <div className="page-wrap" style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <div className="page-header">
        <span className="eyebrow">Presiding Officer — {stationInfo?.constituency}</span>
        <h1 className="page-title">Submit Result: {station}</h1>
        <div className="page-sub">
          {stationInfo?.name}. Read the figures from your Pink Sheet and enter them. Once submitted, the result is permanent and cannot be changed.
          {!electionActive && <span style={{ color: "var(--gold)" }}> The election is not open for submissions yet.</span>}
        </div>
      </div>

      {/* Side-by-side: image left, form right (stacks on mobile via CSS grid auto) */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(280px, 1fr) minmax(320px, 1fr)", gap: "18px", alignItems: "start" }}>

        {/* LEFT — Pink Sheet image */}
        <div className="panel" style={{ position: "sticky", top: "70px" }}>
          <div className="panel-title">
            <div className="dot" style={{ background: "var(--gold)" }} />
            Pink Sheet (EC8A)
          </div>

          {!imageUrl ? (
            <label style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: "10px", padding: "48px 20px", border: "2px dashed var(--border)",
              borderRadius: "var(--r-sm)", cursor: "pointer", color: "var(--text2)", fontSize: "12px",
            }}>
              Click to upload the Pink Sheet photo
              <span style={{ fontSize: "10px" }}>Required — this becomes the permanent visual record</span>
              <input type="file" accept="image/*" onChange={onImage} style={{ display: "none" }} />
            </label>
          ) : (
            <div>
              <div style={{ display: "flex", gap: "6px", marginBottom: "8px", alignItems: "center" }}>
                <button className="btn btn-secondary" style={{ fontSize: "10px", padding: "4px 10px" }} onClick={() => setZoom(z => Math.max(1, z - 0.25))}>−</button>
                <span style={{ fontSize: "10px", color: "var(--text2)" }}>{Math.round(zoom * 100)}%</span>
                <button className="btn btn-secondary" style={{ fontSize: "10px", padding: "4px 10px" }} onClick={() => setZoom(z => Math.min(3, z + 0.25))}>+</button>
                <label className="btn btn-secondary" style={{ fontSize: "10px", padding: "4px 10px", cursor: "pointer", marginLeft: "auto" }}>
                  Replace
                  <input type="file" accept="image/*" onChange={onImage} style={{ display: "none" }} />
                </label>
              </div>
              <div style={{ overflow: "auto", maxHeight: "70vh", borderRadius: "var(--r-sm)", border: "1px solid var(--border)", background: "#000" }}>
                <img src={imageUrl} alt="Pink Sheet" style={{ width: `${zoom * 100}%`, display: "block" }} />
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — entry form */}
        <div>
          {/* Identity verification (OTP) */}
          {!otpVerified && (
            <OTPVerification
              onVerified={() => setOtpVerified(true)}
              registeredPhone={registeredPhone}
            />
          )}

          {/* Figures */}
          <div className="panel" style={{ marginBottom: "16px" }}>
            <div className="panel-title">
              <div className="dot" style={{ background: "var(--accent2)" }} />
              Votes Per Candidate
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px", marginBottom: "14px" }}>
              {candidates.map((c, i) => (
                <div key={c.party} style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderLeft: `3px solid ${c.color}`, borderRadius: "var(--r-sm)", padding: "10px" }}>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--bright)" }}>{c.name}</div>
                  <div style={{ fontSize: "9px", fontWeight: 700, color: c.color, marginBottom: "7px", textTransform: "uppercase" }}>{c.party}</div>
                  <input inputMode="numeric" value={votes[i] || ""} onChange={e => setVote(i, e.target.value)} style={inputBox} placeholder="0" />
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div className="field">
                <label>Rejected Ballots</label>
                <input inputMode="numeric" value={rejected} onChange={e => setRejected(e.target.value.replace(/[^\d]/g, ""))} style={{ ...inputBox, fontSize: "14px" }} placeholder="0" />
              </div>
              <div className="field">
                <label>Accredited Voters</label>
                <input inputMode="numeric" value={accredited} onChange={e => setAccredited(e.target.value.replace(/[^\d]/g, ""))} style={{ ...inputBox, fontSize: "14px" }} placeholder="0" />
              </div>
            </div>

            {/* Live tallies */}
            <div style={{ marginTop: "14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <TallyBox label="Registered Voters" value={registered} muted />
              <TallyBox label="Total Valid Votes" value={totalValid} />
              <TallyBox label="Total Rejected" value={rej} />
              <TallyBox label="Total Votes Cast" value={totalCast} />
            </div>

            {validation.length > 0 && (
              <div style={{ marginTop: "12px", background: "rgba(206,17,38,0.07)", border: "1px solid rgba(206,17,38,0.25)", borderRadius: "var(--r-sm)", padding: "10px 12px" }}>
                {validation.map((e, i) => (
                  <div key={i} style={{ fontSize: "11px", color: "#f87171" }}>• {e}</div>
                ))}
              </div>
            )}
          </div>

          {/* Party agent confirmation */}
          <div className="panel" style={{ marginBottom: "16px" }}>
            <div className="panel-title">
              <div className="dot" style={{ background: "var(--gold)" }} />
              Party Agent Confirmation
            </div>
            <div style={{ fontSize: "11px", color: "var(--text2)", marginBottom: "12px" }}>
              Agents review the figures against the Pink Sheet and sign. Agents for <strong style={{ color: "var(--bright)" }}>{MAJOR_PARTIES.join(" and ")}</strong> must sign before submission.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {agents.map((a, i) => {
                const isMajor = MAJOR_PARTIES.includes(a.party);
                return (
                  <div key={a.party} style={{ display: "flex", gap: "8px", alignItems: "center", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--r-sm)", padding: "8px 10px" }}>
                    <div style={{ minWidth: "44px", fontSize: "10px", fontWeight: 700, color: isMajor ? "var(--gold)" : "var(--text2)" }}>
                      {a.party}{isMajor ? " *" : ""}
                    </div>
                    <input
                      value={a.name}
                      onChange={e => setAgentName(i, e.target.value)}
                      placeholder="Agent name"
                      disabled={a.signed}
                      style={{ flex: 1, padding: "6px 9px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-sm)", color: "var(--bright)", fontSize: "11px" }}
                    />
                    <button
                      className={a.signed ? "btn btn-primary" : "btn btn-secondary"}
                      style={{ fontSize: "10px", padding: "5px 12px", whiteSpace: "nowrap" }}
                      onClick={() => toggleAgentSign(i)}
                    >
                      {a.signed ? "Signed ✓" : "Sign"}
                    </button>
                  </div>
                );
              })}
            </div>
            {!majorsSigned && (
              <div style={{ marginTop: "10px", fontSize: "11px", color: "var(--gold)" }}>
                Awaiting signature from: {missingMajors.join(", ")}
              </div>
            )}
          </div>

          {txError && (
            <div style={{ background: "rgba(206,17,38,0.07)", border: "1px solid rgba(206,17,38,0.25)", borderRadius: "var(--r-sm)", padding: "10px 14px", marginBottom: "14px", fontSize: "12px", color: "#f87171" }}>
              {txError}
            </div>
          )}

          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={!canSubmit || submitting || loading}
            style={{ width: "100%", justifyContent: "center", padding: "14px", fontSize: "14px" }}
          >
            {submitting || loading ? (
              <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div className="spinner" /> {stage || "Submitting…"}
              </span>
            ) : "Submit Result Permanently"}
          </button>

          {!otpVerified && <HelpNote text="Verify your identity via OTP to continue." />}
          {otpVerified && !imageFile && <HelpNote text="Upload the Pink Sheet image to continue." />}
          {otpVerified && imageFile && !figuresValid && <HelpNote text="Complete and correct all figures." />}
          {otpVerified && imageFile && figuresValid && !majorsSigned && <HelpNote text={`Agents for ${missingMajors.join(" and ")} must sign.`} />}
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} txHash={txHash} onClose={() => setToast(null)} />}
    </div>
  );
}

function TallyBox({ label, value, muted }) {
  return (
    <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--r-sm)", padding: "8px 12px" }}>
      <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text2)", marginBottom: "3px" }}>{label}</div>
      <div style={{ fontSize: "16px", fontWeight: 700, fontFamily: "DM Mono,monospace", color: muted ? "var(--text2)" : "var(--bright)" }}>
        {value.toLocaleString()}
      </div>
    </div>
  );
}

function HelpNote({ text }) {
  return (
    <div style={{ textAlign: "center", fontSize: "10px", color: "var(--text2)", marginTop: "8px" }}>{text}</div>
  );
}