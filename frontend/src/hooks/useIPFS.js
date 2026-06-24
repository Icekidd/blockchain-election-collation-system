import { useState, useCallback } from "react";
import { uploadToIPFS } from "../utils/ipfs.js";

export function useIPFS() {
  const [ipfsHash,  setIpfsHash]  = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [error,     setError]     = useState(null);
  const [fileName,  setFileName]  = useState(null);

  const upload = useCallback(async (file, stationId) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setProgress(0);
    setFileName(file.name);
    try {
      setProgress(30);
      const hash = await uploadToIPFS(file, stationId || "unknown");
      setProgress(100);
      setIpfsHash(hash);
      return hash;
    } catch (err) {
      setError(err.message || "Upload failed");
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setIpfsHash(null); setUploading(false);
    setProgress(0); setError(null); setFileName(null);
  }, []);

  return { upload, ipfsHash, uploading, progress, error, fileName, reset };
}