import React, { useRef } from "react";
import { ipfsUrl } from "../utils/ipfs.js";
import { shortHash } from "../utils/format.js";

export default function PinkSheetUpload({ onUpload, ipfsHash, uploading, progress, error, fileName }) {
  const ref = useRef();

  function handleDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) onUpload(file);
  }

  function handleChange(e) {
    const file = e.target.files[0];
    if (file) onUpload(file);
  }

  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={function(e) { e.preventDefault(); }}
        onClick={function() { if (!ipfsHash) ref.current.click(); }}
        style={{
          border: ipfsHash ? "1.5px dashed var(--accent)" : "1.5px dashed var(--border2)",
          borderRadius: "var(--r-md)",
          padding: "24px 20px",
          textAlign: "center",
          cursor: ipfsHash ? "default" : "pointer",
          background: ipfsHash ? "rgba(0,107,63,0.05)" : "var(--bg2)",
          transition: "all 0.15s",
        }}
      >
        {ipfsHash && (
          <div>
            <div style={{ fontSize: "22px", marginBottom: "6px" }}>OK</div>
            <div style={{ fontSize: "12px", color: "var(--accent2)", fontWeight: 600, marginBottom: "3px" }}>
              Pink Sheet uploaded
            </div>
            <div style={{ fontSize: "10px", color: "var(--text2)", fontFamily: "DM Mono,monospace" }}>
              {fileName}
            </div>
            <div style={{ fontSize: "10px", color: "var(--accent2)", fontFamily: "DM Mono,monospace" }}>
              {shortHash(ipfsHash)} - View on IPFS
            </div>
          </div>
        )}
        {!ipfsHash && uploading && (
          <div>
            <div className="spinner" style={{ margin: "0 auto 10px" }} />
            <div style={{ fontSize: "12px", color: "var(--text2)" }}>
              Uploading to IPFS... {progress}%
            </div>
            <div style={{ height: "3px", background: "var(--border)", borderRadius: "2px", marginTop: "10px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: progress + "%", background: "var(--accent2)", borderRadius: "2px" }} />
            </div>
          </div>
        )}
        {!ipfsHash && !uploading && (
          <div>
            <div style={{ fontSize: "26px", marginBottom: "8px" }}>[ EC8A ]</div>
            <div style={{ fontSize: "13px", color: "var(--bright)", fontWeight: 500, marginBottom: "3px" }}>
              Drop Pink Sheet here or click to browse
            </div>
            <div style={{ fontSize: "10px", color: "var(--text2)" }}>
              PDF or image stored on
              <span style={{ color: "var(--gold)" }}> IPFS via Pinata </span>
              then hash recorded on-chain
            </div>
          </div>
        )}
      </div>
      <input
        ref={ref}
        type="file"
        accept=".pdf,image/*"
        style={{ display: "none" }}
        onChange={handleChange}
      />
      {error && (
        <div className="field-error" style={{ marginTop: "6px" }}>{error}</div>
      )}
    </div>
  );
}