import React, { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { useWallet } from "../context/WalletContext.jsx";
import { useContract } from "../hooks/useContract.js";
import { RoleGuard } from "../components/RoleGuard.jsx";
import Toast from "../components/Toast.jsx";
import { GHANA_STATIONS } from "../data/ghana_stations.js";
import { ELECTION_STATUS } from "../utils/contract.js";

export default function ROOfficers() {
  return (
    <RoleGuard roles={["RETURNING_OFFICER"]}>
      <ROOfficersContent />
    </RoleGuard>
  );
}

// Stations belonging to a constituency, from the seed data.
function findStationsFor(constituency) {
  if (!constituency) return [];
  for (const region of Object.keys(GHANA_STATIONS)) {
    if (GHANA_STATIONS[region][constituency]) return GHANA_STATIONS[region][constituency];
  }
  return [];
}

function ROOfficersContent() {
  const { contract, constituency, account } = useWallet();
  const { call, loading, txHash } = useContract();

  const [toast, setToast]         = useState(null);
  const [status, setStatus]       = useState(null);   // election status (number)
  const [pending, setPending]     = useState([]);     // [{ wallet, name, district, stationId }]
  const [assigned, setAssigned]   = useState([]);     // [{ wallet, stationId, submitted }]
  const [csvRows, setCsvRows]     = useState([]);     // [{ wallet, stationId, valid, error }]
  const [busy, setBusy]           = useState(false);
  const [actingOn, setActingOn]   = useState(null);   // wallet currently being approved/rejected/removed
  const [loadingLists, setLoadingLists] = useState(true);

  const myStations = useMemo(() => findStationsFor(constituency), [constituency]);
  const myStationSet = useMemo(() => new Set(myStations.map(s => s.code)), [myStations]);
  const isSetup = status === 0;

  // Load election status, pending applications (for this constituency), and assigned POs.
  async function loadAll() {
    if (!contract || !constituency) { setLoadingLists(false); return; }
    setLoadingLists(true);
    try {
      const st = Number(await contract.status());
      setStatus(st);

      // Pending applications: read the global pending list, keep only ours.
      const addrs = await contract.getPendingApplicants();
      const mine = [];
      for (const addr of addrs) {
        try {
          const app = await contract.applications(addr);
          // app: [applicant, name, region, constituency, district, stationId, status, appliedAt]
          if (app.constituency === constituency && Number(app.status) === 1) {
            mine.push({
              wallet: app.applicant,
              name: app.name,
              district: app.district,
              stationId: app.stationId,
            });
          }
        } catch (_) {}
      }
      setPending(mine);

      // Assigned POs: for each station in my constituency, check officerStation bindings.
      // We derive assignment by scanning applications that are Approved + our constituency,
      // plus any station that reports submitted.
      const assignedList = [];
      // Use OfficerApproved events (bounded recent scan) to find bound wallets,
      // then verify each still bound via officerStation().
      try {
        const filter = contract.filters.OfficerApproved();
        const provider = contract.runner.provider;
        const latest = await provider.getBlockNumber();
        const from = Math.max(0, latest - 9);
        let logs = [];
        try { logs = await contract.queryFilter(filter, from, latest); } catch (_) {}
        const seen = new Set();
        for (const lg of logs) {
          const w = lg.args.officer;
          if (seen.has(w.toLowerCase())) continue;
          seen.add(w.toLowerCase());
          try {
            const boundStation = await contract.officerStation(w);
            if (boundStation && myStationSet.has(boundStation)) {
              const s = await contract.getStation(boundStation);
              assignedList.push({ wallet: w, stationId: boundStation, submitted: s.submitted });
            }
          } catch (_) {}
        }
      } catch (_) {}
      setAssigned(assignedList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLists(false);
    }
  }

  useEffect(() => { loadAll(); /* eslint-disable-next-line */ }, [contract, constituency]);

  // ── Approve / reject a pending application ──
  async function approve(wallet) {
    setActingOn(wallet);
    try {
      await call(() => contract.approveOfficer(wallet));
      setToast({ message: "Officer approved and bound to their station", type: "success" });
      await loadAll();
    } catch (err) {
      console.error(err);
      setToast({ message: err?.reason || "Approval failed — check console", type: "error" });
    } finally { setActingOn(null); }
  }

  async function reject(wallet) {
    setActingOn(wallet);
    try {
      await call(() => contract.rejectOfficer(wallet));
      setToast({ message: "Application rejected", type: "warning" });
      await loadAll();
    } catch (err) {
      console.error(err);
      setToast({ message: err?.reason || "Rejection failed — check console", type: "error" });
    } finally { setActingOn(null); }
  }

  // ── Remove an assigned PO (setup only, pre-submission) ──
  async function remove(wallet) {
    setActingOn(wallet);
    try {
      await call(() => contract.removePresidingOfficer(wallet));
      setToast({ message: "Officer removed — station is free to reassign", type: "success" });
      await loadAll();
    } catch (err) {
      console.error(err);
      setToast({ message: err?.reason || "Removal failed — check console", type: "error" });
    } finally { setActingOn(null); }
  }

  // ── CSV bulk assign: wallet,stationId,phone ──
  function handleCsv(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = String(ev.target.result || "");
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      const start = /wallet/i.test(lines[0]) && /station/i.test(lines[0]) ? 1 : 0;
      const rows = [];
      const seen = new Set();
      for (let i = start; i < lines.length; i++) {
        const [w, sid, phone] = lines[i].split(",").map(p => (p || "").trim());
        let error = "";
        if (!ethers.isAddress(w)) error = "Invalid address";
        else if (!myStationSet.has(sid)) error = "Station not in your constituency";
        else if (!phone || phone.replace(/[^\d]/g, "").length < 10) error = "Missing/invalid phone";
        else if (seen.has(w.toLowerCase())) error = "Duplicate in file";
        seen.add(w.toLowerCase());
        rows.push({ wallet: w, stationId: sid, phone: phone || "", valid: !error, error });
      }
      setCsvRows(rows);
      const ok = rows.filter(r => r.valid).length;
      setToast({ message: `Parsed ${rows.length} rows — ${ok} valid`, type: ok ? "success" : "warning" });
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function downloadTemplate() {
    const header = "wallet,stationId,phone\n";
    const sample = myStations.map(s => `,${s.code},`).join("\n");
    const blob = new Blob([header + sample], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(constituency || "officers").replace(/\s+/g, "-")}-officers-template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function submitCsvBatch() {
    const valid = csvRows.filter(r => r.valid);
    if (valid.length === 0) { setToast({ message: "No valid rows", type: "error" }); return; }
    setBusy(true);
    try {
      const officers = valid.map(r => r.wallet);
      const sids = valid.map(r => r.stationId);
      await call(() => contract.assignPresidingOfficersBatch(officers, sids));

      // Persist phones off-chain, keyed by wallet, for OTP pre-fill at submission.
      // (Phones are PII and must not go on-chain.) Per-device store, same as the
      // rest of the notification data.
      const phones = JSON.parse(localStorage.getItem("officerPhones") || "{}");
      for (const r of valid) phones[r.wallet.toLowerCase()] = r.phone;
      localStorage.setItem("officerPhones", JSON.stringify(phones));

      setToast({ message: `Assigned ${valid.length} presiding officers`, type: "success" });
      setCsvRows([]);
      await loadAll();
    } catch (err) {
      console.error(err);
      setToast({ message: err?.reason || "Batch assign failed — check console", type: "error" });
    } finally { setBusy(false); }
  }

  const short = (w) => `${w.slice(0, 6)}…${w.slice(-4)}`;

  if (!constituency) {
    return (
      <div className="page-wrap">
        <div className="page-header">
          <span className="eyebrow">Returning Officer</span>
          <h1 className="page-title">Officer Management</h1>
        </div>
        <div className="panel">
          <div style={{ textAlign: "center", padding: "32px", color: "var(--text2)", fontSize: "13px" }}>
            No constituency is bound to your wallet yet. The EC Chair must assign you before you can manage officers.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrap">
      <div className="page-header">
        <span className="eyebrow">Returning Officer — {constituency}</span>
        <h1 className="page-title">Officer Management</h1>
        <div className="page-sub">
          Approve presiding officer applications, bulk-assign by CSV, and manage assignments for your constituency.
          {status !== null && (
            <span style={{ marginLeft: "6px", color: isSetup ? "var(--accent2)" : "var(--gold)" }}>
              Election status: {ELECTION_STATUS[status]}.
            </span>
          )}
          {!isSetup && status !== null && " Officer changes are locked outside Setup."}
        </div>
      </div>

      {/* Pending applications */}
      <div className="panel" style={{ marginBottom: "16px" }}>
        <div className="panel-title">
          <div className="dot" style={{ background: "var(--gold)" }} />
          Pending Applications
          {pending.length > 0 && (
            <span style={{ marginLeft: "6px", background: "var(--gold)", color: "#000", borderRadius: "10px", padding: "1px 7px", fontSize: "10px", fontWeight: 700 }}>
              {pending.length}
            </span>
          )}
        </div>

        {loadingLists ? (
          <div className="loading-state"><div className="spinner" /> Loading…</div>
        ) : pending.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px", color: "var(--text2)", fontSize: "12px" }}>
            No pending applications for your constituency
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {pending.map(p => (
              <div key={p.wallet} style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--r-sm)", padding: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--bright)" }}>{p.name || "(no name)"}</div>
                    <div style={{ fontSize: "10px", color: "var(--text2)", fontFamily: "DM Mono,monospace", marginTop: "2px" }}>{p.wallet}</div>
                    <div style={{ fontSize: "10px", color: "var(--text2)", marginTop: "2px" }}>
                      Station: <span style={{ color: "var(--accent2)" }}>{p.stationId}</span>{p.district ? ` · ${p.district}` : ""}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button className="btn btn-primary" style={{ padding: "6px 16px", fontSize: "11px" }} onClick={() => approve(p.wallet)} disabled={!isSetup || actingOn === p.wallet}>
                    {actingOn === p.wallet ? "Working…" : "Approve"}
                  </button>
                  <button className="btn btn-danger" style={{ padding: "6px 16px", fontSize: "11px" }} onClick={() => reject(p.wallet)} disabled={!isSetup || actingOn === p.wallet}>
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CSV bulk assign */}
      <div className="panel" style={{ marginBottom: "16px" }}>
        <div className="panel-title">
          <div className="dot" style={{ background: "var(--accent2)" }} />
          Bulk Assign via CSV
        </div>
        <div style={{ fontSize: "11px", color: "var(--text2)", marginBottom: "12px" }}>
          Upload <code>wallet,stationId,phone</code> for officers in your constituency. All valid rows are assigned in one transaction.
          Only stations within {constituency} are accepted. Phone is required (used for OTP verification at submission).
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: csvRows.length ? "14px" : 0 }}>
          <button className="btn btn-secondary" style={{ fontSize: "11px", padding: "6px 14px" }} onClick={downloadTemplate}>
            Download Template
          </button>
          <label className="btn btn-secondary" style={{ fontSize: "11px", padding: "6px 14px", cursor: "pointer" }}>
            Upload CSV
            <input type="file" accept=".csv,text/csv" onChange={handleCsv} style={{ display: "none" }} />
          </label>
          {csvRows.length > 0 && (
            <button className="btn btn-primary" style={{ fontSize: "11px", padding: "6px 14px" }} onClick={submitCsvBatch} disabled={busy || !isSetup || csvRows.filter(r => r.valid).length === 0}>
              {busy ? "Assigning…" : `Assign ${csvRows.filter(r => r.valid).length} Valid`}
            </button>
          )}
        </div>

        {csvRows.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead><tr><th>Wallet</th><th>Station</th><th>Phone</th><th>Status</th></tr></thead>
              <tbody>
                {csvRows.map((r, i) => (
                  <tr key={i}>
                    <td style={{ color: "var(--accent2)", fontFamily: "DM Mono,monospace", fontSize: "10px" }}>{r.wallet ? short(r.wallet) : "—"}</td>
                    <td style={{ color: "var(--bright)" }}>{r.stationId || "—"}</td>
                    <td style={{ color: "var(--text2)", fontFamily: "DM Mono,monospace", fontSize: "10px" }}>{r.phone || "—"}</td>
                    <td><span className={`pill ${r.valid ? "ok" : "flag"}`}>{r.valid ? "Valid" : r.error}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assigned officers */}
      <div className="panel">
        <div className="panel-title">
          <div className="dot" style={{ background: "var(--accent2)" }} />
          Assigned Officers {assigned.length > 0 && `(${assigned.length})`}
        </div>

        {loadingLists ? (
          <div className="loading-state"><div className="spinner" /> Loading…</div>
        ) : assigned.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px", color: "var(--text2)", fontSize: "12px" }}>
            No officers assigned yet in recent view. (Shows recent assignments; older bindings remain valid on-chain.)
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead><tr><th>Wallet</th><th>Station</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {assigned.map(a => (
                  <tr key={a.wallet}>
                    <td style={{ color: "var(--accent2)", fontFamily: "DM Mono,monospace" }}>{short(a.wallet)}</td>
                    <td style={{ color: "var(--bright)", fontWeight: 600 }}>{a.stationId}</td>
                    <td>
                      {a.submitted
                        ? <span className="pill ok">Result Submitted</span>
                        : <span className="pill pend">Awaiting Result</span>}
                    </td>
                    <td>
                      {!a.submitted && isSetup && (
                        <button className="btn btn-danger" style={{ fontSize: "10px", padding: "4px 10px" }} onClick={() => remove(a.wallet)} disabled={actingOn === a.wallet}>
                          {actingOn === a.wallet ? "Removing…" : "Remove"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} txHash={txHash} onClose={() => setToast(null)} />}
    </div>
  );
}