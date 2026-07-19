import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { ethers } from "ethers";
import { getContract, ROLES, CHAIN_ID } from "../utils/contract.js";

const WalletContext = createContext(null);

const AMOY_CHAIN = {
  chainId:          "0x13882",
  chainName:        "Polygon Amoy",
  nativeCurrency:   { name: "MATIC", symbol: "MATIC", decimals: 18 },
  rpcUrls:          ["https://rpc-amoy.polygon.technology"],
  blockExplorerUrls:["https://amoy.polygonscan.com"],
};

// Retries a flaky RPC call with short backoff. Public RPC endpoints (including
// whatever MetaMask itself is configured with) occasionally return
// "too many errors" / rate-limit responses under load — this keeps a single
// transient hiccup from failing the entire wallet connection.
async function withRetry(fn, { attempts = 4, baseDelay = 600 } = {}) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const isRateLimit =
        err?.code === -32002 ||
        err?.info?.error?.code === -32002 ||
        /too many errors|rate limit/i.test(err?.message || "");
      if (!isRateLimit || i === attempts - 1) throw err;
      await new Promise(r => setTimeout(r, baseDelay * Math.pow(2, i)));
    }
  }
  throw lastErr;
}

export function WalletProvider({ children }) {
  const [account,      setAccount]      = useState(null);
  const [signer,       setSigner]       = useState(null);
  const [contract,     setContract]     = useState(null);
  const [role,         setRole]         = useState(null);
  const [constituency, setConstituency] = useState(null); // RO's bound constituency
  const [station,      setStation]      = useState(null); // PO's bound station id
  const [error,        setError]        = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [retrying,     setRetrying]     = useState(false); // surfaced to UI so a hiccup doesn't look like a dead connect

  const detectRole = useCallback(async (c, addr) => {
    try {
      const r = await withRetry(() => c.getMyRole(addr));
      if (r && r !== "NONE") return r;
    } catch (_) { /* fall through to hasRole checks */ }

    if (await withRetry(() => c.hasRole(ROLES.EC_CHAIR, addr)))  return "EC_CHAIR";
    if (await withRetry(() => c.hasRole(ROLES.RETURNING, addr))) return "RETURNING_OFFICER";
    if (await withRetry(() => c.hasRole(ROLES.PRESIDING, addr))) return "PRESIDING_OFFICER";
    return null;
  }, []);

  const connectWallet = useCallback(async () => {
    setError(null);
    setLoading(true);
    setRetrying(false);
    try {
      if (!window.ethereum) throw new Error("MetaMask not installed. Please install it from metamask.io");

      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      if (!accounts.length) throw new Error("No accounts found");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const network  = await provider.getNetwork();

      if (network.chainId !== BigInt(CHAIN_ID)) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: AMOY_CHAIN.chainId }],
          });
        } catch (switchErr) {
          if (switchErr.code === 4902) {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [AMOY_CHAIN],
            });
          } else throw switchErr;
        }
      }

      const _signer   = await provider.getSigner();
      const _account  = await _signer.getAddress();
      const _contract = getContract(_signer);

      // Role detection and bindings hit the RPC repeatedly right after connect —
      // exactly where a transient public-RPC rate limit tends to bite. Retry each.
      let _role = null;
      try {
        _role = await detectRole(_contract, _account);
      } catch (err) {
        // Surface a specific, actionable message rather than a generic failure.
        const isRateLimit = /too many errors|rate limit/i.test(err?.message || "");
        if (isRateLimit) {
          throw new Error(
            "The network RPC is rate-limited right now. Wait a minute and try again, " +
            "or set MetaMask's Polygon Amoy RPC URL to a dedicated endpoint (e.g. your Alchemy URL) in MetaMask's network settings."
          );
        }
        throw err;
      }

      let _constituency = null;
      let _station      = null;
      try {
        if (_role === "RETURNING_OFFICER") {
          _constituency = await withRetry(() => _contract.officerConstituency(_account));
        } else if (_role === "PRESIDING_OFFICER") {
          _station = await withRetry(() => _contract.officerStation(_account));
          const st = await withRetry(() => _contract.getStation(_station));
          _constituency = st.constituency;
        }
      } catch (_) { /* bindings are optional for display — don't fail connection over them */ }

      setAccount(_account);
      setSigner(_signer);
      setContract(_contract);
      setRole(_role);
      setConstituency(_constituency && _constituency.length ? _constituency : null);
      setStation(_station && _station.length ? _station : null);

      window.ethereum.on("accountsChanged", () => window.location.reload());
      window.ethereum.on("chainChanged",    () => window.location.reload());

    } catch (err) {
      setError(err.message || "Connection failed");
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  }, [detectRole]);

  const disconnect = useCallback(() => {
    setAccount(null); setSigner(null); setContract(null);
    setRole(null); setConstituency(null); setStation(null);
  }, []);

  useEffect(() => {
    if (window.ethereum?.selectedAddress) connectWallet();
  }, []);

  return (
    <WalletContext.Provider value={{
      account, signer, contract, role, constituency, station,
      error, loading, retrying, connectWallet, disconnect,
      isChair:     role === "EC_CHAIR",
      isReturning: role === "RETURNING_OFFICER",
      isPresiding: role === "PRESIDING_OFFICER",
      isOfficer:   role !== null,
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside WalletProvider");
  return ctx;
}