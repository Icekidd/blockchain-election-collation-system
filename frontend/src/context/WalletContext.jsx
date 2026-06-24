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

export function WalletProvider({ children }) {
  const [account,     setAccount]     = useState(null);
  const [signer,      setSigner]      = useState(null);
  const [contract,    setContract]    = useState(null);
  const [role,        setRole]        = useState(null);
  const [officerName, setOfficerName] = useState(null);
  const [error,       setError]       = useState(null);
  const [loading,     setLoading]     = useState(false);

  const detectRole = useCallback(async (c, addr) => {
    if (await c.hasRole(ROLES.SENIOR,    addr)) return "SENIOR";
    if (await c.hasRole(ROLES.RETURNING, addr)) return "RETURNING";
    if (await c.hasRole(ROLES.PRESIDING, addr)) return "PRESIDING";
    return null;
  }, []);

  const connectWallet = useCallback(async () => {
    setError(null);
    setLoading(true);
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

      const _signer      = await provider.getSigner();
      const _account     = await _signer.getAddress();
      const _contract    = getContract(_signer);
      const _role        = await detectRole(_contract, _account);
      const _officerName = await _contract.getOfficerName(_account);

      setAccount(_account);
      setSigner(_signer);
      setContract(_contract);
      setRole(_role);
      setOfficerName(_officerName || null);

      window.ethereum.on("accountsChanged", () => window.location.reload());
      window.ethereum.on("chainChanged",    () => window.location.reload());

    } catch (err) {
      setError(err.message || "Connection failed");
    } finally {
      setLoading(false);
    }
  }, [detectRole]);

  const disconnect = useCallback(() => {
    setAccount(null); setSigner(null); setContract(null);
    setRole(null); setOfficerName(null);
  }, []);

  useEffect(() => {
    if (window.ethereum?.selectedAddress) connectWallet();
  }, []);

  return (
    <WalletContext.Provider value={{
      account, signer, contract, role, officerName,
      error, loading, connectWallet, disconnect,
      isPresiding: role === "PRESIDING",
      isReturning: role === "RETURNING",
      isSenior:    role === "SENIOR",
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