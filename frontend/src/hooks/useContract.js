import { useState, useCallback } from "react";

export function useContract() {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [txHash,  setTxHash]  = useState(null);

  const call = useCallback(async (fn) => {
    setLoading(true);
    setError(null);
    setTxHash(null);
    try {
      const tx      = await fn();
      setTxHash(tx.hash);
      const receipt = await tx.wait();
      return receipt;
    } catch (err) {
      const reason =
        err?.reason ||
        err?.error?.message ||
        err?.shortMessage ||
        err?.message ||
        "Transaction failed";
      setError(reason);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { call, loading, error, txHash, clearError };
}