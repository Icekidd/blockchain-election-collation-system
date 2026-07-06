import { useState, useEffect } from "react";
import { useWallet } from "../context/WalletContext.jsx";
import { getReadOnlyContract } from "../utils/contract.js";

export function useCandidates() {
  const { contract } = useWallet();
  const [candidates, setCandidates] = useState([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const c = contract || getReadOnlyContract();
        const cands = await c.getCandidates();
        setCandidates(cands.map(x => ({
          name:  x.name,
          party: x.party,
          color: x.color,
        })));
      } catch (err) {
        console.error("Failed to load candidates:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [contract]);

  return { candidates, loading };
}