import React, { useState } from "react";
import Tesseract from "tesseract.js";

/**
 * OCRTest — a throwaway diagnostic page for Step 5a.
 * Upload a Pink Sheet image; see exactly what Tesseract extracts,
 * with per-line confidence. This tells us how much parsing is worth
 * attempting before we build the real editable review form.
 *
 * Route it temporarily at e.g. /ocr-test to experiment.
 */
export default function OCRTest() {
  const [imgUrl, setImgUrl]     = useState(null);
  const [running, setRunning]   = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage]       = useState("");
  const [rawText, setRawText]   = useState("");
  const [lines, setLines]       = useState([]);      // [{ text, confidence }]
  const [numbersOnly, setNumbersOnly] = useState(false);
  const [error, setError]       = useState(null);

  async function runOCR(file, digitsMode) {
  setRunning(true);
  setError(null);
  setRawText("");
  setLines([]);
  setProgress(0);
  setStage("loading engine");
  let worker;
  try {
  // v5/v6 API: createWorker with a logger fires progress reliably,
  // unlike the older recognize({logger}) form which can silently hang.
  worker = await Tesseract.createWorker("eng", 1, {
      logger: (m) => {
      if (m.status) setStage(m.status);
      if (typeof m.progress === "number") setProgress(Math.round(m.progress * 100));
      },
  });

  if (digitsMode) {
      await worker.setParameters({ tessedit_char_whitelist: "0123456789" });
  }

  const { data } = await worker.recognize(file);

  setRawText(data.text || "");
  const ls = (data.lines || []).map((l) => ({
      text: l.text.trim(),
      confidence: Math.round(l.confidence),
  })).filter(l => l.text.length > 0);
  setLines(ls);
  } catch (err) {
  console.error("OCR error:", err);
  setError(err.message || "OCR failed");
  } finally {
  if (worker) { try { await worker.terminate(); } catch (_) {} }
  setRunning(false);
  setStage("done");
  }
  }

  function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgUrl(URL.createObjectURL(file));
    runOCR(file, numbersOnly);
    e.target.value = "";
  }

  const panel = {
    background: "var(--surface)", border: "1px solid var(--border)",
    borderRadius: "var(--r-md)", padding: "16px", marginBottom: "16px",
  };

  return (
    <div className="page-wrap" style={{ paddingTop: "80px" }}>
      <div className="page-header">
        <span className="eyebrow">Diagnostic — Step 5a</span>
        <h1 className="page-title">OCR Raw Output Test</h1>
        <div className="page-sub">
          Upload a Pink Sheet image to see exactly what Tesseract.js extracts, before we build parsing.
        </div>
      </div>

      <div style={panel}>
        <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--text2)", marginBottom: "12px", cursor: "pointer" }}>
          <input type="checkbox" checked={numbersOnly} onChange={e => setNumbersOnly(e.target.checked)} />
          Digits-only mode (whitelist 0-9 — try both, compare)
        </label>
        <label className="btn btn-primary" style={{ padding: "8px 18px", fontSize: "12px", cursor: "pointer", display: "inline-block" }}>
          Upload Pink Sheet Image
          <input type="file" accept="image/*" onChange={onFile} style={{ display: "none" }} />
        </label>
      </div>

      {imgUrl && (
        <div style={panel}>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text2)", marginBottom: "8px" }}>Uploaded Image</div>
          <img src={imgUrl} alt="uploaded" style={{ maxWidth: "100%", borderRadius: "var(--r-sm)", border: "1px solid var(--border)" }} />
        </div>
      )}

      {running && (
        <div style={panel}>
          <div style={{ fontSize: "12px", color: "var(--bright)", marginBottom: "8px" }}>
            {stage}… {progress}%
          </div>
          <div style={{ height: "6px", background: "var(--bg2)", borderRadius: "3px", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progress}%`, background: "var(--gold)", transition: "width 0.2s" }} />
          </div>
        </div>
      )}

      {error && (
        <div style={{ ...panel, border: "1px solid var(--flag,#c0392b)" }}>
          <div style={{ color: "var(--flag,#e74c3c)", fontSize: "12px" }}>Error: {error}</div>
        </div>
      )}

      {lines.length > 0 && (
        <div style={panel}>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text2)", marginBottom: "10px" }}>
            Detected Lines (with confidence)
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead><tr><th>#</th><th>Text</th><th>Confidence</th></tr></thead>
              <tbody>
                {lines.map((l, i) => (
                  <tr key={i}>
                    <td style={{ color: "var(--text2)" }}>{i + 1}</td>
                    <td style={{ color: "var(--bright)", fontFamily: "DM Mono,monospace", fontSize: "11px" }}>{l.text}</td>
                    <td>
                      <span className={`pill ${l.confidence >= 70 ? "ok" : l.confidence >= 40 ? "pend" : "flag"}`}>
                        {l.confidence}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {rawText && (
        <div style={panel}>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text2)", marginBottom: "8px" }}>Raw Text Dump</div>
          <pre style={{
            whiteSpace: "pre-wrap", fontFamily: "DM Mono,monospace", fontSize: "11px",
            color: "var(--bright)", background: "var(--bg2)", padding: "12px",
            borderRadius: "var(--r-sm)", border: "1px solid var(--border)", margin: 0,
          }}>
            {rawText}
          </pre>
        </div>
      )}
    </div>
  );
}