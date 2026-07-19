import { ethers } from "ethers";

export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
export const AMOY_RPC         = import.meta.env.VITE_AMOY_RPC || "https://rpc-amoy.polygon.technology";
export const CHAIN_ID         = 80002;

// ── V2 ABI ────────────────────────────────────────────────────────────────
// Redesigned trust model: EC Chair → assigns ROs (per constituency) →
// ROs approve POs (per station). Submission is FINAL and immutable —
// no confirm / flag / lock / correction.
export const ABI = [
  // ── Roles / status ──
  "function EC_CHAIR_ROLE() view returns (bytes32)",
  "function RETURNING_OFFICER_ROLE() view returns (bytes32)",
  "function PRESIDING_OFFICER_ROLE() view returns (bytes32)",
  "function hasRole(bytes32 role, address account) view returns (bool)",
  "function getMyRole(address who) view returns (string)",
  "function status() view returns (uint8)",
  "function setStatus(uint8 newStatus) external",

  // ── Candidates ──
  "function addCandidate(string name, string party, string color) external",
  "function candidates(uint256) view returns (string name, string party, string color, bool exists)",
  "function getCandidateCount() view returns (uint256)",

  // ── EC Chair: assign returning officers ──
  "function assignReturningOfficer(address ro, string constituency) external",
  "function assignReturningOfficersBatch(address[] ros, string[] constituencies) external",
  "function officerConstituency(address) view returns (string)",

  // ── RO: station registry ──
  "function registerStation(string stationId, string name, uint256 registeredVoters) external",
  "function registerStationsBatch(string[] ids, string[] names, uint256[] registeredVoters) external",
  "function updateRegisteredVoters(string stationId, uint256 registeredVoters) external",
  "function getStation(string stationId) view returns (tuple(string stationId, string name, string constituency, uint256 registeredVoters, bool registered, bool submitted))",
  "function getAllStationIds() view returns (string[])",
  "function getStationCount() view returns (uint256)",

  // ── PO applications & RO approval ──
  "function applyAsOfficer(string name, string region, string constituency, string district, string stationId) external",
  "function approveOfficer(address officer) external",
  "function rejectOfficer(address officer) external",
  "function assignPresidingOfficersBatch(address[] officers, string[] stationIds) external",
  "function removePresidingOfficer(address officer) external",
  "function removeReturningOfficer(address ro) external",
  "function applications(address) view returns (address applicant, string name, string region, string constituency, string district, string stationId, uint8 status, uint256 appliedAt)",
  "function getPendingApplicants() view returns (address[])",
  "function officerStation(address) view returns (string)",

  // ── Submission (immutable) ──
  "function submitResult(uint256[] votes, uint256 accreditedVoters, uint256 rejectedBallots, string recordHash) external",
  "function getResult(string stationId) view returns (tuple(string stationId, uint256[] votes, uint256 accreditedVoters, uint256 rejectedBallots, string recordHash, address submittedBy, uint256 submittedAt, bool exists))",
  "function getSubmittedStationIds() view returns (string[])",
  "function getSubmittedCount() view returns (uint256)",
  "function getNationalTotals() view returns (uint256[])",

  // ── Events ──
  "event ReturningOfficerAssigned(address indexed ro, string constituency)",
  "event StationRegistered(string indexed stationId, string constituency, uint256 registeredVoters)",
  "event RegisteredVotersUpdated(string indexed stationId, uint256 registeredVoters)",
  "event OfficerApplied(address indexed applicant, string constituency, string stationId)",
  "event OfficerApproved(address indexed officer, string stationId, address indexed approvedBy)",
  "event OfficerRejected(address indexed officer, address indexed rejectedBy)",
  "event PresidingOfficerRemoved(address indexed officer, string stationId, address indexed removedBy)",
  "event ReturningOfficerRemoved(address indexed ro, string constituency, address indexed removedBy)",
  "event ResultSubmitted(string indexed stationId, address indexed officer, string recordHash)",
  "event CandidateAdded(uint256 indexed index, string name, string party)",
  "event StatusChanged(uint8 newStatus)",
];

export const ROLES = {
  EC_CHAIR:  ethers.keccak256(ethers.toUtf8Bytes("EC_CHAIR_ROLE")),
  RETURNING: ethers.keccak256(ethers.toUtf8Bytes("RETURNING_OFFICER_ROLE")),
  PRESIDING: ethers.keccak256(ethers.toUtf8Bytes("PRESIDING_OFFICER_ROLE")),
};

// Election lifecycle — three states in V2 (no separate Collating phase).
export const ELECTION_STATUS = {
  0: "Setup",
  1: "Active",
  2: "Closed",
};

// Application status enum (matches contract ApplicationStatus).
export const APPLICATION_STATUS = {
  0: { label: "None",     style: "pend" },
  1: { label: "Pending",  style: "pend" },
  2: { label: "Approved", style: "ok"   },
  3: { label: "Rejected", style: "flag" },
};

export function getContract(signerOrProvider) {
  if (!CONTRACT_ADDRESS) throw new Error("VITE_CONTRACT_ADDRESS not set in .env");
  return new ethers.Contract(CONTRACT_ADDRESS, ABI, signerOrProvider);
}

export function getReadOnlyContract() {
  const provider = new ethers.JsonRpcProvider(AMOY_RPC);
  return getContract(provider);
}