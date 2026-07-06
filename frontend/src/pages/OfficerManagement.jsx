import React, { useEffect, useState } from "react";
import { useWallet } from "../context/WalletContext.jsx";
import { useContract } from "../hooks/useContract.js";
import { RoleGuard } from "../components/RoleGuard.jsx";
import Toast from "../components/Toast.jsx";

export default function OfficerManagement() {
  return (
    <RoleGuard roles={["SENIOR"]}>
      <OfficerManagementContent />
    </RoleGuard>
  );
}

function OfficerManagementContent() {
  const { contract } = useWallet();
  const { call, loading, txHash } = useContract();

  const [requests, setRequests] = useState([]);
  const [approved, setApproved] = useState([]);
  const [toast,    setToast]    = useState(null);

  function loadData() {
    const pending  = JSON.parse(localStorage.getItem("officerRequests")  || "[]");
    const approved = JSON.parse(localStorage.getItem("approvedOfficers") || "[]");
    setRequests(pending);
    setApproved(approved);
  }

  useEffect(() => { loadData(); }, []);

  async function approve(request) {
    try {
      if (request.role === "PRESIDING") {
        await call(() => contract.registerPresidingOfficer(request.wallet, request.name));
      } else {
        await call(() => contract.registerReturningOfficer(request.wallet, request.name));
      }

      // Remove from pending
      const pending = JSON.parse(localStorage.getItem("officerRequests") || "[]");
      const updated = pending.filter(r => r.wallet !== request.wallet);
      localStorage.setItem("officerRequests", JSON.stringify(updated));

      // Add to approved list
      const approvedList = JSON.parse(localStorage.getItem("approvedOfficers") || "[]");
        approvedList.push({
            name:       request.name,
            email:      request.email,
            phone:      request.phone || "",
            wallet:     request.wallet,
            role:       request.role,
            reason:     request.reason,
            approvedAt: new Date().toISOString(),
        });
      localStorage.setItem("approvedOfficers", JSON.stringify(approvedList));

      loadData();
      setToast({ message: `${request.name} approved as ${request.role === "PRESIDING" ? "Presiding" : "Returning"} Officer`, type: "success" });
    } catch (err) {
      console.error(err);
      setToast({ message: "Approval failed — check console", type: "error" });
    }
  }

  function reject(wallet) {
    const pending = JSON.parse(localStorage.getItem("officerRequests") || "[]");
    const updated = pending.filter(r => r.wallet !== wallet);
    localStorage.setItem("officerRequests", JSON.stringify(updated));
    loadData();
    setToast({ message: "Request rejected", type: "warning" });
  }

  function removeApproved(wallet) {
    const approvedList = JSON.parse(localStorage.getItem("approvedOfficers") || "[]");
    const updated = approvedList.filter(o => o.wallet !== wallet);
    localStorage.setItem("approvedOfficers", JSON.stringify(updated));
    loadData();
    setToast({ message: "Officer removed from notification list", type: "warning" });
  }

  const roleLabel = (role) => role === "PRESIDING" ? "Presiding Officer" : role === "RETURNING" ? "Returning Officer" : "Senior EC Officer";
  const rolePill  = (role) => role === "PRESIDING" ? "pend" : role === "RETURNING" ? "lock" : "ok";

  return (
    <div className="page-wrap">
      <div className="page-header">
        <span className="eyebrow">Senior EC Officer</span>
        <h1 className="page-title">Officer Management</h1>
        <div className="page-sub">
          Review registration requests and manage approved officers
        </div>
      </div>

      {/* Registration link */}
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: "var(--r-md)", padding: "14px 18px",
        marginBottom: "20px", display: "flex", alignItems: "center",
        justifyContent: "space-between", flexWrap: "wrap", gap: "10px",
      }}>
        <div>
          <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--bright)", marginBottom: "2px" }}>
            Officer Registration Link
          </div>
          <div style={{ fontSize: "11px", color: "var(--text2)", fontFamily: "DM Mono,monospace" }}>
            {window.location.origin}/register
          </div>
        </div>
        <button
          className="btn btn-secondary"
          style={{ fontSize: "11px", padding: "6px 14px" }}
          onClick={() => {
            navigator.clipboard.writeText(window.location.origin + "/register");
            setToast({ message: "Registration link copied!", type: "success" });
          }}
        >
          Copy Link
        </button>
      </div>

      {/* Pending requests */}
      <div className="panel" style={{ marginBottom: "16px" }}>
        <div className="panel-title">
          <div className="dot" style={{ background: "var(--gold)" }} />
          Pending Requests
          {requests.length > 0 && (
            <span style={{
              marginLeft: "6px", background: "var(--gold)", color: "#000",
              borderRadius: "10px", padding: "1px 7px", fontSize: "10px", fontWeight: 700,
            }}>
              {requests.length}
            </span>
          )}
        </div>

        {requests.length === 0 ? (
          <div style={{ textAlign: "center", padding: "28px", color: "var(--text2)", fontSize: "12px" }}>
            No pending requests
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {requests.map(r => (
              <div key={r.wallet} style={{
                background: "var(--bg2)", border: "1px solid var(--border)",
                borderRadius: "var(--r-sm)", padding: "14px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--bright)" }}>{r.name}</div>
                    <div style={{ fontSize: "10px", color: "var(--text2)", fontFamily: "DM Mono,monospace", marginTop: "2px" }}>{r.wallet}</div>
                    <div style={{ fontSize: "10px", color: "var(--text2)", marginTop: "2px" }}>{r.email}</div>
                    {r.reason && <div style={{ fontSize: "10px", color: "var(--text2)", marginTop: "2px" }}>Staff ID: {r.reason}</div>}
                  </div>
                  <span className={`pill ${rolePill(r.role)}`}>{roleLabel(r.role)}</span>
                </div>
                <div style={{ fontSize: "10px", color: "var(--text2)", marginBottom: "10px" }}>
                  Submitted: {new Date(r.submittedAt).toLocaleString("en-GH")}
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    className="btn btn-primary"
                    style={{ padding: "6px 16px", fontSize: "11px" }}
                    onClick={() => approve(r)}
                    disabled={loading}
                  >
                    {loading ? "Approving..." : "Approve"}
                  </button>
                  <button
                    className="btn btn-danger"
                    style={{ padding: "6px 16px", fontSize: "11px" }}
                    onClick={() => reject(r.wallet)}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approved officers */}
      <div className="panel">
        <div className="panel-title">
          <div className="dot" style={{ background: "var(--accent2)" }} />
          Approved Officers ({approved.length})
        </div>

        {approved.length === 0 ? (
          <div style={{ textAlign: "center", padding: "28px", color: "var(--text2)", fontSize: "12px" }}>
            No approved officers yet
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Wallet</th>
                  <th>Role</th>
                  <th>Approved</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {approved.map(o => (
                  <tr key={o.wallet}>
                    <td style={{ color: "var(--bright)", fontWeight: 600, fontFamily: "DM Sans,sans-serif" }}>{o.name}</td>
                    <td style={{ color: "var(--text2)", fontFamily: "DM Sans,sans-serif", fontSize: "11px" }}>{o.email}</td>
                    <td style={{ color: "var(--accent2)" }}>{o.wallet.slice(0,6)}…{o.wallet.slice(-4)}</td>
                    <td><span className={`pill ${rolePill(o.role)}`}>{roleLabel(o.role)}</span></td>
                    <td style={{ color: "var(--text2)", fontSize: "10px" }}>{new Date(o.approvedAt).toLocaleDateString("en-GH")}</td>
                    <td>
                      <button
                        className="btn btn-danger"
                        style={{ padding: "3px 10px", fontSize: "10px" }}
                        onClick={() => removeApproved(o.wallet)}
                      >
                        Remove
                      </button>
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