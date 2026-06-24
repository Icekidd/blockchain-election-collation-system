import { ethers } from "ethers";

export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
export const AMOY_RPC         = import.meta.env.VITE_AMOY_RPC || "https://rpc-amoy.polygon.technology";
export const CHAIN_ID         = 80002;

export const ABI = [
  "function electionName() view returns (string)",
  "function electionDate() view returns (string)",
  "function candidateCount() view returns (uint256)",
  "function totalStationsReported() view returns (uint256)",
  "function getElectionStatus() view returns (uint8)",
  "function getCandidates() view returns (tuple(string name, string party, string color)[])",
  "function hasRole(bytes32 role, address account) view returns (bool)",
  "function registerPresidingOfficer(address wallet, string name) external",
  "function registerReturningOfficer(address wallet, string name) external",
  "function revokePresidingOfficer(address wallet) external",
  "function getOfficerName(address wallet) view returns (string)",
  "function setElectionStatus(uint8 status) external",
  "function pause() external",
  "function unpause() external",
  "function submitResult(string stationId, string stationName, string constituency, string district, string region, uint256[] votes, uint256 registeredVoters, uint256 accreditedVoters, uint256 rejectedBallots, string ipfsHash) external",
  "function confirmResult(string stationId) external",
  "function flagResult(string stationId, string reason) external",
  "function lockConstituency(string constituency) external",
  "function requestCorrection(string stationId, uint256[] correctedVotes, uint256 correctedRejected, string correctedIpfsHash, string reason) external",
  "function approveCorrection(uint256 correctionId) external",
  "function getResult(string stationId) view returns (tuple(string stationId, string stationName, string constituency, string district, string region, uint256[] votes, uint256 registeredVoters, uint256 accreditedVoters, uint256 rejectedBallots, string ipfsHash, address submittedBy, uint256 submittedAt, uint8 status))",
  "function getConstituencyTotal(string constituency) view returns (uint256[] totals, uint256 grandTotal)",
  "function getConstituency(string constituency) view returns (tuple(string name, string district, string region, bool locked, address lockedBy, uint256 lockedAt, uint256 totalStations, uint256 reportedStations))",
  "function getAllStationIds() view returns (string[])",
  "function getAllConstituencies() view returns (string[])",
  "function getCorrection(uint256 id) view returns (tuple(string stationId, uint256[] correctedVotes, uint256 correctedRejected, string correctedIpfsHash, string reason, address requestedBy, uint256 requestedAt, bool roApproved, bool seniorApproved, bool executed))",
  "event ResultSubmitted(string indexed stationId, string indexed constituency, address indexed officer, string ipfsHash, uint256 timestamp)",
  "event ResultConfirmed(string indexed stationId, address indexed returningOfficer, uint256 timestamp)",
  "event ResultFlagged(string indexed stationId, address indexed flaggedBy, string reason, uint256 timestamp)",
  "event ConstituencyLocked(string indexed constituency, address indexed returningOfficer, uint256 totalVotes, uint256 timestamp)",
  "event CorrectionRequested(string indexed stationId, address indexed requestedBy, uint256 correctionId, uint256 timestamp)",
  "event CorrectionApproved(uint256 indexed correctionId, address indexed approvedBy, uint256 timestamp)",
  "event CorrectionExecuted(uint256 indexed correctionId, string indexed stationId, uint256 timestamp)",
  "event ElectionStatusChanged(uint8 indexed newStatus, uint256 timestamp)",
  "event OfficerRegistered(address indexed wallet, bytes32 indexed role, string name, uint256 timestamp)",
];

export const ROLES = {
  PRESIDING: ethers.keccak256(ethers.toUtf8Bytes("PRESIDING_OFFICER_ROLE")),
  RETURNING: ethers.keccak256(ethers.toUtf8Bytes("RETURNING_OFFICER_ROLE")),
  SENIOR:    ethers.keccak256(ethers.toUtf8Bytes("SENIOR_EC_OFFICER_ROLE")),
};

export const RESULT_STATUS = {
  0: { label: "Pending",   style: "pend" },
  1: { label: "Confirmed", style: "ok"   },
  2: { label: "Flagged",   style: "flag" },
  3: { label: "Corrected", style: "corr" },
};

export const ELECTION_STATUS = {
  0: "Setup",
  1: "Active",
  2: "Collating",
  3: "Closed",
};

export function getContract(signerOrProvider) {
  if (!CONTRACT_ADDRESS) throw new Error("VITE_CONTRACT_ADDRESS not set in .env");
  return new ethers.Contract(CONTRACT_ADDRESS, ABI, signerOrProvider);
}

export function getReadOnlyContract() {
  const provider = new ethers.JsonRpcProvider(AMOY_RPC);
  return getContract(provider);
}