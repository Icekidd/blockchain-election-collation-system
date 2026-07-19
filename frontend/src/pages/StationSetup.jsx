import React, { useEffect, useMemo, useState } from "react";
import { useWallet } from "../context/WalletContext.jsx";
import { useContract } from "../hooks/useContract.js";
import { RoleGuard } from "../components/RoleGuard.jsx";
import Toast from "../components/Toast.jsx";
import { GHANA_STATIONS } from "../data/ghana_stations.js";

export default function StationSetup() {
  return (
    <RoleGuard roles={["RETURNING_OFFICER"]}>
      <StationSetupContent />
    </RoleGuard>
  );
}

// Find a constituency's stations across all regions in GHANA_STATIONS.
function findStationsFor(constituency) {
  if (!constituency) return { region: null, stations: [] };
  for (const region of Object.keys(GHANA_STATIONS)) {
    const consts = GHANA_STATIONS[region];
    if (consts[constituency]) {
      return { region, stations: consts[constituency] };
    }
  }
  return { region: null, stations: [] };
}

function StationSetupContent() {
  const { contract, constituency } = useWallet();
  const { call, loading, txHash } = useContract();

  const [toast, setToast]       = useState(null);
  const [voters, setVoters]     = useState({});      // { stationId: "1500" }
  const [onchain, setOnchain]   = useState({});      // { stationId: { registered, registeredVoters, submitted } }
  const [checking, setChecking] = useState(true);
  const [savingId, setSavingId] = useState(null);    // station currently being updated individually

  const { region, stations } = useMemo(
    () => findStationsFor(constituency),
    [constituency]
  );

  // Load on-chain state for each station so we can show registered status + counts.
  async function loadOnchain() {
    if (!contract || stations.length === 0) { setChecking(false); return; }
    setChecking(true);
    const map = {};
    const prefill = {};
    for (const st of stations) {
      try {
        const s = await contract.getStation(st.code);
        if (s.registered) {
          map[st.code] = {
            registered: true,
            registeredVoters: Number(s.registeredVoters),
            submitted: s.submitted,
          };
          prefill[st.code] = String(Number(s.registeredVoters));
        }
      } catch (_) { /* not registered yet */ }
    }
    setOnchain(map);
    setVoters(v => ({ ...prefill, ...v })); // keep any edits the user already typed
    setChecking(false);
  }

  useEffect(() => { loadOnchain(); /* eslint-disable-next-line */ }, [contract, constituency]);

  function setVoterCount(code, value) {
    // digits only
    const clean = value.replace(/[^\d]/g, "");
    setVoters(v => ({ ...v, [code]: clean }));
  }

  // ── CSV upload: stationId,registeredVoters ──
  function handleCsv(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = String(ev.target.result || "");
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      const start = /station/i.test(lines[0]) && /voter/i.test(lines[0]) ? 1 : 0;
      const valid = new Set(stations.map(s => s.code));
      const next = {};
      let matched = 0, skipped = 0;
      for (let i = start; i < lines.length; i++) {
        const [id, count] = lines[i].split(",").map(p => (p || "").trim());
        if (valid.has(id) && /^\d+$/.test(count)) { next[id] = count; matched++; }
        else skipped++;
      }
      setVoters(v => ({ ...v, ...next }));
      setToast({
        message: `Loaded ${matched} station${matched === 1 ? "" : "s"} from CSV${skipped ? `, ${skipped} skipped` : ""}`,
        type: matched ? "success" : "warning",
      });
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function downloadTemplate() {
    const header = "stationId,registeredVoters\n";
    const rows = stations.map(s => `${s.code},`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(constituency || "stations").replace(/\s+/g, "-")}-voters-template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Register all not-yet-registered stations in one batch ──
  async function registerAll() {
    const toRegister = stations.filter(s => !onchain[s.code]?.registered);
    if (toRegister.length === 0) {
      setToast({ message: "All stations already registered", type: "warning" }); return;
    }
    // validate every station has a voter count
    const missing = toRegister.filter(s => !voters[s.code] || Number(voters[s.code]) <= 0);
    if (missing.length > 0) {
      setToast({ message: `Enter registered voters for all ${toRegister.length} stations first`, type: "error" });
      return;
    }
    try {
      const ids   = toRegister.map(s => s.code);
      const names = toRegister.map(s => s.name);
      const regs  = toRegister.map(s => BigInt(voters[s.code]));
      await call(() => contract.registerStationsBatch(ids, names, regs));
      setToast({ message: `Registered ${toRegister.length} stations in one transaction`, type: "success" });
      await loadOnchain();
    } catch (err) {
      console.error(err);
      setToast({ message: err?.reason || "Registration failed — check console", type: "error" });
    }
  }

  // ── Update one already-registered station's voter count (Setup only) ──
  async function updateOne(code) {
    const val = voters[code];
    if (!val || Number(val) <= 0) { setToast({ message: "Enter a valid count", type: "error" }); return; }
    setSavingId(code);
    try {
      await call(() => contract.updateRegisteredVoters(code, BigInt(val)));
      setToast({ message: `Updated registered voters for ${code}`, type: "success" });
      await loadOnchain();
    } catch (err) {
      console.error(err);
      setToast({ message: err?.reason || "Update failed — check console", type: "error" });
    } finally {
      setSavingId(null);
    }
  }

  const inputStyle = {
    width: "120px", padding: "6px 9px", background: "var(--bg2)",
    border: "1px solid var(--border)", borderRadius: "var(--r-sm)",
    color: "var(--bright)", fontSize: "12px", fontFamily: "DM Mono,monospace",
  };

  const registeredCount = stations.filter(s => onchain[s.code]?.registered).length;
  const pendingCount = stations.length - registeredCount;

  // No constituency bound — RO hasn't been assigned, or wallet mismatch.
  if (!constituency) {
    return (
      <div className="page-wrap">
        <div className="page-header">
          <span className="eyebrow">Returning Officer</span>
          <h1 className="page-title">Station Setup</h1>
        </div>
        <div className="panel">
          <div style={{ textAlign: "center", padding: "32px", color: "var(--text2)", fontSize: "13px" }}>
            No constituency is bound to your wallet yet. The EC Chair must assign you to a constituency
            before you can set up its stations.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrap">
      <div className="page-header">
        <span className="eyebrow">Returning Officer — {region}</span>
        <h1 className="page-title">Station Setup: {constituency}</h1>
        <div className="page-sub">
          Register each polling station in your constituency with its number of registered voters.
          Counts can be edited until the election opens.
        </div>
      </div>

      {/* Summary + bulk actions */}
      <div className="panel" style={{ marginBottom: "16px" }}>
        <div className="panel-title">
          <div className="dot" style={{ background: "var(--gold)" }} />
          {constituency} — {stations.length} Stations
          <span style={{ marginLeft: "auto", fontSize: "11px", color: "var(--text2)", fontWeight: 400 }}>
            {registeredCount} registered · {pendingCount} pending
          </span>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
          <button className="btn btn-secondary" style={{ fontSize: "11px", padding: "6px 14px" }} onClick={downloadTemplate}>
            Download CSV Template
          </button>
          <label className="btn btn-secondary" style={{ fontSize: "11px", padding: "6px 14px", cursor: "pointer" }}>
            Upload CSV
            <input type="file" accept=".csv,text/csv" onChange={handleCsv} style={{ display: "none" }} />
          </label>
          <button
            className="btn btn-primary"
            style={{ fontSize: "11px", padding: "6px 14px" }}
            onClick={registerAll}
            disabled={loading || pendingCount === 0}
          >
            {loading ? "Registering…" : `Register ${pendingCount} Station${pendingCount === 1 ? "" : "s"}`}
          </button>
        </div>
      </div>

      {/* Station table */}
      <div className="panel">
        <div className="panel-title">
          <div className="dot" style={{ background: "var(--accent2)" }} />
          Polling Stations
        </div>

        {checking ? (
          <div className="loading-state"><div className="spinner" /> Checking on-chain status…</div>
        ) : stations.length === 0 ? (
          <div style={{ textAlign: "center", padding: "28px", color: "var(--text2)", fontSize: "12px" }}>
            No stations found for this constituency in the dataset.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Station ID</th>
                  <th>Name</th>
                  <th>Registered Voters</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {stations.map(st => {
                  const rec = onchain[st.code];
                  const isReg = rec?.registered;
                  return (
                    <tr key={st.code}>
                      <td style={{ color: "var(--bright)", fontWeight: 600, fontFamily: "DM Mono,monospace" }}>{st.code}</td>
                      <td style={{ color: "var(--text2)", fontSize: "11px" }}>{st.name}</td>
                      <td>
                        <input
                          style={inputStyle}
                          inputMode="numeric"
                          placeholder="e.g. 1500"
                          value={voters[st.code] || ""}
                          onChange={e => setVoterCount(st.code, e.target.value)}
                          disabled={rec?.submitted}
                        />
                      </td>
                      <td>
                        {rec?.submitted ? (
                          <span className="pill ok">Result Submitted</span>
                        ) : isReg ? (
                          <span className="pill ok">Registered</span>
                        ) : (
                          <span className="pill pend">Not Registered</span>
                        )}
                      </td>
                      <td>
                        {isReg && !rec?.submitted && (
                          <button
                            className="btn btn-secondary"
                            style={{ fontSize: "10px", padding: "4px 10px" }}
                            onClick={() => updateOne(st.code)}
                            disabled={savingId === st.code || loading}
                          >
                            {savingId === st.code ? "Saving…" : "Update"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} txHash={txHash} onClose={() => setToast(null)} />}
    </div>
  );
}