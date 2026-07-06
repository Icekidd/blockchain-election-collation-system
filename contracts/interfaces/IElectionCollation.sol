// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IElectionCollation {

    enum ElectionStatus { SETUP, ACTIVE, COLLATING, CLOSED }
    enum ResultStatus   { PENDING, CONFIRMED, FLAGGED, CORRECTED }

    struct PollingStationResult {
        string       stationId;
        string       stationName;
        string       constituency;
        string       district;
        string       region;
        uint256[]    votes;
        uint256      registeredVoters;
        uint256      accreditedVoters;
        uint256      rejectedBallots;
        string       ipfsHash;
        address      submittedBy;
        uint256      submittedAt;
        ResultStatus status;
    }

    struct Constituency {
        string  name;
        string  district;
        string  region;
        bool    locked;
        address lockedBy;
        uint256 lockedAt;
        uint256 totalStations;
        uint256 reportedStations;
    }

    struct CorrectionRequest {
        string    stationId;
        uint256[] correctedVotes;
        uint256   correctedRejected;
        string    correctedIpfsHash;
        string    reason;
        address   requestedBy;
        uint256   requestedAt;
        bool      roApproved;
        bool      seniorApproved;
        bool      executed;
    }

    struct Candidate {
        string name;
        string party;
        string color;
    }

    event ElectionStatusChanged(ElectionStatus indexed newStatus, uint256 timestamp);
    event ResultSubmitted(string indexed stationId, string indexed constituency, address indexed officer, string ipfsHash, uint256 timestamp);
    event ResultConfirmed(string indexed stationId, address indexed returningOfficer, uint256 timestamp);
    event ResultFlagged(string indexed stationId, address indexed flaggedBy, string reason, uint256 timestamp);
    event ConstituencyLocked(string indexed constituency, address indexed returningOfficer, uint256 totalVotes, uint256 timestamp);
    event CorrectionRequested(string indexed stationId, address indexed requestedBy, uint256 correctionId, uint256 timestamp);
    event CorrectionApproved(uint256 indexed correctionId, address indexed approvedBy, uint256 timestamp);
    event CorrectionExecuted(uint256 indexed correctionId, string indexed stationId, uint256 timestamp);
    event OfficerRegistered(address indexed wallet, bytes32 indexed role, string name, uint256 timestamp);
    event CandidateAdded(string name, string party, uint256 index, uint256 timestamp);
    event CandidateRemoved(uint256 index, uint256 timestamp);

    function submitResult(string calldata stationId, string calldata stationName, string calldata constituency, string calldata district, string calldata region, uint256[] calldata votes, uint256 registeredVoters, uint256 accreditedVoters, uint256 rejectedBallots, string calldata ipfsHash) external;
    function confirmResult(string calldata stationId) external;
    function flagResult(string calldata stationId, string calldata reason) external;
    function lockConstituency(string calldata constituency) external;
    function requestCorrection(string calldata stationId, uint256[] calldata correctedVotes, uint256 correctedRejected, string calldata correctedIpfsHash, string calldata reason) external;
    function approveCorrection(uint256 correctionId) external;
    function getResult(string calldata stationId) external view returns (PollingStationResult memory);
    function getConstituencyTotal(string calldata constituency) external view returns (uint256[] memory totals, uint256 grandTotal);
    function getConstituency(string calldata constituency) external view returns (Constituency memory);
    function getAllStationIds() external view returns (string[] memory);
    function getAllConstituencies() external view returns (string[] memory);
    function getCandidates() external view returns (Candidate[] memory);
    function getElectionStatus() external view returns (ElectionStatus);
    function getCorrection(uint256 id) external view returns (CorrectionRequest memory);
}