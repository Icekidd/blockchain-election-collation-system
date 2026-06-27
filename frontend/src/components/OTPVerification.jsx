import React, { useState, useEffect } from "react";

// In production use a real SMS service like Twilio or Africa's Talking
// For now we simulate OTP sending and use EmailJS to send the code

export default function OTPVerification({ onVerified, officerName }) {
  const [phone,     setPhone]     = useState("");
  const [otp,       setOtp]       = useState("");
  const [sentOtp,   setSentOtp]   = useState(null);
  const [step,      setStep]      = useState("phone"); // "phone" | "otp" | "verified"
  const [countdown, setCountdown] = useState(0);
  const [error,     setError]     = useState("");

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async function sendOTP() {
    if (!phone || phone.length < 10) {
      setError("Enter a valid phone number");
      return;
    }
    setError("");

    const code = generateOTP();
    setSentOtp(code);
    setStep("otp");
    setCountdown(60);

    // In production: call Twilio/Africa's Talking API here
    // For demo: show the code in console (remove in production)
    console.log(`OTP for ${phone}: ${code}`);

    // For demo purposes show it as an alert
    alert(`Demo OTP: ${code}\n\nIn production this would be sent to ${phone} via SMS`);
  }

  function verifyOTP() {
    if (otp === sentOtp) {
      setStep("verified");
      onVerified();
    } else {
      setError("Invalid OTP — please try again");
      setOtp("");
    }
  }

  if (step === "verified") return null;

  return (
    <div style={{
      background: "rgba(0,107,63,0.06)",
      border: "1px solid rgba(0,107,63,0.25)",
      borderRadius: "var(--r-md)",
      padding: "16px",
      marginBottom: "20px",
    }}>
      <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--accent2)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>
        Identity Verification Required
      </div>

      {step === "phone" && (
        <div>
          <p style={{ fontSize: "12px", color: "var(--text2)", marginBottom: "10px" }}>
            Verify your identity before submitting results. Enter your registered phone number to receive a one-time code.
          </p>
          <div style={{ display: "flex", gap: "8px" }}>
            <div className="field" style={{ flex: 1 }}>
              <label>Phone Number</label>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+233 XX XXX XXXX"
                style={{ fontFamily: "DM Mono,monospace" }}
              />
            </div>
            <button className="btn btn-primary" onClick={sendOTP} style={{ alignSelf: "flex-end", padding: "9px 16px", fontSize: "12px" }}>
              Send OTP
            </button>
          </div>
          {error && <div className="field-error" style={{ marginTop: "6px" }}>{error}</div>}
        </div>
      )}

      {step === "otp" && (
        <div>
          <p style={{ fontSize: "12px", color: "var(--text2)", marginBottom: "10px" }}>
            Enter the 6-digit code sent to <strong style={{ color: "var(--bright)" }}>{phone}</strong>
          </p>
          <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
            <div className="field" style={{ flex: 1 }}>
              <label>OTP Code</label>
              <input
                value={otp}
                onChange={e => setOtp(e.target.value)}
                placeholder="000000"
                maxLength={6}
                style={{ fontFamily: "DM Mono,monospace", fontSize: "20px", letterSpacing: "0.3em", textAlign: "center" }}
              />
            </div>
            <button className="btn btn-primary" onClick={verifyOTP} style={{ padding: "9px 16px", fontSize: "12px" }}>
              Verify
            </button>
          </div>
          {error && <div className="field-error" style={{ marginTop: "6px" }}>{error}</div>}
          <div style={{ marginTop: "8px", fontSize: "11px", color: "var(--text2)" }}>
            {countdown > 0 ? (
              `Resend in ${countdown}s`
            ) : (
              <button onClick={sendOTP} style={{ background: "none", border: "none", color: "var(--accent2)", cursor: "pointer", fontSize: "11px", padding: 0 }}>
                Resend OTP
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}