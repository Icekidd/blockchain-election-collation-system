import React, { useState } from "react";

export default function RegisterRequest() {
  const [form, setForm] = useState({
    name: "", wallet: "", email: "",phone: "", role: "PRESIDING", reason: ""
  });
  const [submitted, setSubmitted] = useState(false);
  const [error,     setError]     = useState("");

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function handleSubmit() {
    if (!form.name.trim())   { setError("Full name is required"); return; }
    if (!form.email.trim() || !form.email.includes("@")) {
      setError("Valid email address is required"); return;
    }
    if (!form.wallet.trim()) { setError("Wallet address is required"); return; }
    if (!form.wallet.startsWith("0x") || form.wallet.length !== 42) {
      setError("Invalid wallet address — must start with 0x and be 42 characters"); return;
    }
    if (!form.phone.trim() || form.phone.replace(/\s/g, "").length < 10) {
      setError("Valid phone number is required"); return;
    }
    if (!form.reason.trim()) {
      setError("EC Staff ID is required"); return;
    }

    const existing = JSON.parse(localStorage.getItem("officerRequests") || "[]");
    if (existing.find(r => r.wallet.toLowerCase() === form.wallet.toLowerCase())) {
      setError("This wallet already has a pending request"); return;
    }

    existing.push({ ...form, submittedAt: new Date().toISOString(), status: "pending" });
    localStorage.setItem("officerRequests", JSON.stringify(existing));
    setSubmitted(true);
  }

  if (submitted) return (
    <div style={{
      minHeight: "100vh", background: "var(--bg)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "24px",
    }}>
      <div style={{ maxWidth: "420px", width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px", color: "var(--accent2)" }}>✓</div>
        <h2 style={{ fontSize: "22px", fontWeight: 700, color: "var(--bright)", marginBottom: "8px" }}>
          Request Submitted
        </h2>
        <p style={{ fontSize: "13px", color: "var(--text2)", lineHeight: 1.65, marginBottom: "20px" }}>
          Your registration request has been submitted to the Senior EC Officer for approval.
          You will receive an email once your wallet is approved.
        </p>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "14px", textAlign: "left", marginBottom: "16px" }}>
          <div style={{ fontSize: "10px", color: "var(--text2)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Your Request Summary
          </div>
          {[
            ["Name",   form.name],
            ["Email",  form.email],
            ["Wallet", form.wallet],
            ["Role",   form.role === "PRESIDING" ? "Presiding Officer" : "Returning Officer"],
          ].map(([label, value]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid var(--border)", fontSize: "11px" }}>
              <span style={{ color: "var(--text2)" }}>{label}</span>
              <span style={{ color: "var(--bright)", fontFamily: "DM Mono,monospace", fontSize: "10px", maxWidth: "240px", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</span>
            </div>
          ))}
        </div>
        <button className="btn btn-secondary" style={{ width: "100%", justifyContent: "center" }}
          onClick={() => { setSubmitted(false); setForm({ name:"", wallet:"", email:"", role:"PRESIDING", reason:"" }); }}>
          Submit Another Request
        </button>
      </div>
    </div>
  );

  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "24px",
    }}>
      <div style={{ maxWidth: "480px", width: "100%" }}>

        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ display: "flex", height: "2px", width: "64px", borderRadius: "1px", overflow: "hidden", margin: "0 auto 16px" }}>
            <div style={{ background: "#CE1126", flex: 1 }} />
            <div style={{ background: "#FCD116", flex: 1 }} />
            <div style={{ background: "#006B3F", flex: 1 }} />
          </div>
          <div style={{ fontSize: "10px", fontFamily: "DM Mono,monospace", color: "var(--gold)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "8px" }}>
            Electoral Commission of Ghana
          </div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--bright)", marginBottom: "6px" }}>
            Officer Registration Request
          </h1>
          <p style={{ fontSize: "12px", color: "var(--text2)", lineHeight: 1.6 }}>
            Submit your details to be registered as an EC Ghana collation officer.
            Your request will be reviewed and approved by the Senior EC Officer.
          </p>
        </div>

        <div className="panel">
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

            <div className="field">
              <label>Full Name</label>
              <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Kwame Asante" />
            </div>

            <div className="field">
              <label>Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={e => set("email", e.target.value)}
                placeholder="e.g. kwame@gmail.com"
              />
              <div style={{ fontSize: "10px", color: "var(--text2)", marginTop: "3px" }}>
                You will receive result notifications at this email
              </div>
            </div>

            <div className="field">
                <label>Phone Number</label>
                <input
                    type="tel"
                    value={form.phone}
                    onChange={e => set("phone", e.target.value)}
                    placeholder="+233 XX XXX XXXX"
                    style={{ fontFamily: "DM Mono,monospace" }}
                />
                <div style={{ fontSize: "10px", color: "var(--text2)", marginTop: "3px" }}>
                    This number will be used for OTP verification when submitting results
                </div>
                </div>

            <div className="field">
              <label>MetaMask Wallet Address</label>
              <input
                value={form.wallet}
                onChange={e => set("wallet", e.target.value)}
                placeholder="0x..."
                style={{ fontFamily: "DM Mono,monospace" }}
              />
              <div style={{ fontSize: "10px", color: "var(--text2)", marginTop: "3px" }}>
                Open MetaMask → copy your wallet address → paste here
              </div>
            </div>

            <div className="field">
              <label>Role Requested</label>
              <select value={form.role} onChange={e => set("role", e.target.value)}>
                <option value="PRESIDING">Presiding Officer — submits polling station results</option>
                <option value="RETURNING">Returning Officer — confirms and locks constituency results</option>
              </select>
            </div>

            <div className="field">
              <label>EC Staff ID </label>
              <input
                value={form.reason}
                onChange={e => set("reason", e.target.value)}
                placeholder="e.g. GH-EC-2024-0042 (required)"
              />
            </div>

            {error && (
              <div style={{ background: "rgba(206,17,38,0.08)", border: "1px solid rgba(206,17,38,0.25)", borderRadius: "var(--r-sm)", padding: "10px 14px", fontSize: "12px", color: "#f87171" }}>
                {error}
              </div>
            )}

            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              style={{ width: "100%", justifyContent: "center", padding: "13px" }}
            >
              Submit Registration Request
            </button>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: "14px", fontSize: "11px", color: "var(--text2)" }}>
          Already registered?{" "}
          <a href="/" style={{ color: "var(--accent2)", textDecoration: "none" }}>
            Connect your wallet
          </a>
        </div>
      </div>
    </div>
  );
}