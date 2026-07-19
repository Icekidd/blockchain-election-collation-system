import React, { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { useWallet } from "../context/WalletContext.jsx";
import { useContract } from "../hooks/useContract.js";
import { RoleGuard } from "../components/RoleGuard.jsx";
import Toast from "../components/Toast.jsx";
import { GHANA_STATIONS } from "../data/ghana_stations.js";

export default function AssignOfficers() {
  return (
    <RoleGuard roles={["EC_CHAIR"]}>
      <AssignOfficersContent />
    </RoleGuard>
  );
}

// Flatten GHANA_STATIONS into a sorted [{ region, constituency }] list
function useConstituencies() {
  return useMemo(() => {
    const out = [];
    for (const region of Object.keys(GHANA_STATIONS)) {
      for (const constituency of Object.keys(GHANA_STATIONS[region])) {
        out.push({ region, constituency });
      }
    }
    out.sort((a, b) =>
      a.region.localeCompare(b.region) || a.constituency.localeCompare(b.constituency)
    );
    return out;
  }, []);
}

function AssignOfficersContent() {
  const { contract, account } = useWallet();
  const { call, loading, txHash } = useContract();
  const constituencies = useConstituencies();

  const [toast, setToast] = useState(null);

  // ── Manual single-assign state ──
  const [wallet, setWallet]             = useState("");
  const [constituency, setConstituency] = useState("");

  // ── Assigned list (read from chain via events is heavy; we track locally + verify) ──
  const [assigned, setAssigned] = useState([]);

  // ── CSV bulk state ──
  const [csvRows, setCsvRows] = useState([]); // [{ wallet, constituency, valid, error }]

  const validConstSet = useMemo(
    () => new Set(constituencies.map(c => c.constituency)),
    [constituencies]
  );

  useEffect(() => {
    setAssigned(JSON.parse(localStorage.getItem("assignedROs") || "[]"));
  }, []);

  function persistAssigned(list) {
    localStorage.setItem("assignedROs", JSON.stringify(list));
    setAssigned(list);
  }

  // ── Single manual assign ──
  async function handleAssign() {
    if (!ethers.isAddress(wallet)) {
      setToast({ message: "Invalid wallet address", type: "error" });
      return;
    }
    if (!constituency) {
      setToast({ message: "Select a constituency", type: "error" });
      return;
    }
    try {
      await call(() => contract.assignReturningOfficer(wallet, constituency));
      const list = [
        ...assigned.filter(a => a.wallet.toLowerCase() !== wallet.toLowerCase()),
        { wallet, constituency, assignedAt: new Date().toISOString() },
      ];
      persistAssigned(list);
      setToast({ message: `Returning Officer assigned to ${constituency}`, type: "success" });
      setWallet("");
      setConstituency("");
    } catch (err) {
      console.error(err);
      setToast({ message: err?.reason || "Assignment failed — check console", type: "error" });
    }
  }

  // ── CSV parse ──
  function handleCsvFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = String(ev.target.result || "");
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      // Skip header if present
      const start = /wallet/i.test(lines[0]) && /constituenc/i.test(lines[0]) ? 1 : 0;
      const rows = [];
      const seen = new Set();
      for (let i = start; i < lines.length; i++) {
        const parts = lines[i].split(",").map(p => p.trim());
        const w = parts[0] || "";
        const c = (parts.slice(1).join(",") || "").trim(); // constituency may contain no comma; keep simple
        let error = "";
        if (!ethers.isAddress(w)) error = "Invalid address";
        else if (!validConstSet.has(c)) error = "Unknown constituency";
        else if (seen.has(w.toLowerCase())) error = "Duplicate in file";
        seen.add(w.toLowerCase());
        rows.push({ wallet: w, constituency: c, valid: !error, error });
      }
      setCsvRows(rows);
      const okCount = rows.filter(r => r.valid).length;
      setToast({ message: `Parsed ${rows.length} rows — ${okCount} valid`, type: okCount ? "success" : "warning" });
    };
    reader.readAsText(file);
    e.target.value = ""; // allow re-upload of same file
  }

  // ── CSV batch assign ──
  async function handleBatchAssign() {
    const valid = csvRows.filter(r => r.valid);
    if (valid.length === 0) {
      setToast({ message: "No valid rows to assign", type: "error" });
      return;
    }
    try {
      const wallets = valid.map(r => r.wallet);
      const consts  = valid.map(r => r.constituency);
      await call(() => contract.assignReturningOfficersBatch(wallets, consts));

      const merged = [...assigned];
      for (const r of valid) {
        const idx = merged.findIndex(a => a.wallet.toLowerCase() === r.wallet.toLowerCase());
        const entry = { wallet: r.wallet, constituency: r.constituency, assignedAt: new Date().toISOString() };
        if (idx >= 0) merged[idx] = entry; else merged.push(entry);
      }
      persistAssigned(merged);
      setToast({ message: `${valid.length} Returning Officers assigned in one transaction`, type: "success" });
      setCsvRows([]);
    } catch (err) {
      console.error(err);
      setToast({ message: err?.reason || "Batch assignment failed — check console", type: "error" });
    }
  }

  function downloadTemplate() {
    const header = "wallet,constituency\n";
    const sample = "0x1234567890123456789012345678901234567890,JOMORO\n";
    const blob = new Blob([header + sample], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "returning-officers-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const validCsvCount = csvRows.filter(r => r.valid).length;

  return (
    <div className="page-wrap">
      <div className="page-header">
        <span className="eyebrow">EC Chair</span>
        <h1 className="page-title">Assign Returning Officers</h1>
        <div className="page-sub">
          Bind a wallet to a constituency. The officer gains Returning Officer powers scoped to that constituency only.
        </div>
      </div>

      {/* Manual single assign */}
      <div className="panel" style={{ marginBottom: "16px" }}>
        <div className="panel-title">
          <div className="dot" style={{ background: "var(--gold)" }} />
          Assign One Officer
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "560px" }}>
          <div>
            <label style={{ fontSize: "11px", color: "var(--text2)", display: "block", marginBottom: "4px" }}>
              Officer Wallet Address
            </label>
            <input
              className="input"
              placeholder="0x..."
              value={wallet}
              onChange={e => setWallet(e.target.value)}
              style={{ fontFamily: "DM Mono,monospace", width: "100%" }}
            />
          </div>

          <div>
            <label style={{ fontSize: "11px", color: "var(--text2)", display: "block", marginBottom: "4px" }}>
              Constituency
            </label>
            <select
              className="input"
              value={constituency}
              onChange={e => setConstituency(e.target.value)}
              style={{ width: "100%" }}
            >
              <option value="">— Select constituency —</option>
              {constituencies.map(c => (
                <option key={c.constituency} value={c.constituency}>
                  {c.constituency} ({c.region})
                </option>
              ))}
            </select>
          </div>

          <button
            className="btn btn-primary"
            onClick={handleAssign}
            disabled={loading}
            style={{ alignSelf: "flex-start", padding: "8px 20px", fontSize: "12px" }}
          >
            {loading ? "Assigning..." : "Assign Officer"}
          </button>
        </div>
      </div>

      {/* CSV bulk assign */}
      <div className="panel" style={{ marginBottom: "16px" }}>
        <div className="panel-title">
          <div className="dot" style={{ background: "var(--accent2)" }} />
          Bulk Assign via CSV
        </div>

        <div style={{ fontSize: "11px", color: "var(--text2)", marginBottom: "12px" }}>
          Upload a CSV with columns <code>wallet,constituency</code>. All valid rows are assigned in a single transaction.
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: csvRows.length ? "14px" : 0 }}>
          <button className="btn btn-secondary" style={{ fontSize: "11px", padding: "6px 14px" }} onClick={downloadTemplate}>
            Download Template
          </button>
          <label className="btn btn-secondary" style={{ fontSize: "11px", padding: "6px 14px", cursor: "pointer" }}>
            Upload CSV
            <input type="file" accept=".csv,text/csv" onChange={handleCsvFile} style={{ display: "none" }} />
          </label>
          {csvRows.length > 0 && (
            <button
              className="btn btn-primary"
              style={{ fontSize: "11px", padding: "6px 14px" }}
              onClick={handleBatchAssign}
              disabled={loading || validCsvCount === 0}
            >
              {loading ? "Assigning..." : `Assign ${validCsvCount} Valid`}
            </button>
          )}
        </div>

        {csvRows.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr><th>Wallet</th><th>Constituency</th><th>Status</th></tr>
              </thead>
              <tbody>
                {csvRows.map((r, i) => (
                  <tr key={i}>
                    <td style={{ color: "var(--accent2)", fontFamily: "DM Mono,monospace", fontSize: "10px" }}>
                      {r.wallet.length > 14 ? `${r.wallet.slice(0, 8)}…${r.wallet.slice(-6)}` : r.wallet}
                    </td>
                    <td style={{ color: "var(--bright)" }}>{r.constituency || "—"}</td>
                    <td>
                      <span className={`pill ${r.valid ? "ok" : "flag"}`}>
                        {r.valid ? "Valid" : r.error}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assigned list */}
      <div className="panel">
        <div className="panel-title">
          <div className="dot" style={{ background: "var(--accent2)" }} />
          Assigned Returning Officers ({assigned.length})
        </div>

        {assigned.length === 0 ? (
          <div style={{ textAlign: "center", padding: "28px", color: "var(--text2)", fontSize: "12px" }}>
            No officers assigned yet
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr><th>Wallet</th><th>Constituency</th><th>Assigned</th></tr>
              </thead>
              <tbody>
                {assigned.map(a => (
                  <tr key={a.wallet}>
                    <td style={{ color: "var(--accent2)", fontFamily: "DM Mono,monospace" }}>
                      {a.wallet.slice(0, 6)}…{a.wallet.slice(-4)}
                    </td>
                    <td style={{ color: "var(--bright)", fontWeight: 600 }}>{a.constituency}</td>
                    <td style={{ color: "var(--text2)", fontSize: "10px" }}>
                      {new Date(a.assignedAt).toLocaleDateString("en-GH")}
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