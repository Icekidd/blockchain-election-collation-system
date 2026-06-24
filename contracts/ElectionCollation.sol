// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IElectionCollation.sol";

contract ElectionCollation is IElectionCollation, AccessControl, Pausable, ReentrancyGuard {

    bytes32 public constant PRESIDING_OFFICER_ROLE = keccak256("PRESIDING_OFFICER_ROLE");
    bytes32 public constant RETURNING_OFFICER_ROLE  = keccak256("RETURNING_OFFICER_ROLE");
    bytes32 public constant SENIOR_EC_OFFICER_ROLE  = keccak256("SENIOR_EC_OFFICER_ROLE");

    string         public electionName;
    string         public electionDate;
    ElectionStatus public electionStatus;

    Candidate[] private _candidates;

    mapping(string => PollingStationResult) private _results;
    mapping(string => Constituency)         private _constituencies;
    mapping(uint256 => CorrectionRequest)   private _corrections;
    mapping(address => string)              private _officerNames;
    mapping(string => bool)                 private _constituencySeen;

    uint256   private _correctionCount;
    string[]  private _stationIds;
    string[]  private _constituencyNames;

    constructor(
        string   memory _electionName,
        string   memory _electionDate,
        string[] memory candidateNames,
        string[] memory partyNames,
        string[] memory partyColors
    ) {
        require(candidateNames.length > 0,                   "No candidates");
        require(candidateNames.length == partyNames.length,  "Name/party mismatch");
        require(candidateNames.length == partyColors.length, "Name/color mismatch");
        require(bytes(_electionName).length > 0,             "Empty election name");
        require(bytes(_electionDate).length > 0,             "Empty election date");

        electionName   = _electionName;
        electionDate   = _electionDate;
        electionStatus = ElectionStatus.SETUP;

        for (uint256 i = 0; i < candidateNames.length; i++) {
            _candidates.push(Candidate({ name: candidateNames[i], party: partyNames[i], color: partyColors[i] }));
        }

        _grantRole(DEFAULT_ADMIN_ROLE,     msg.sender);
        _grantRole(SENIOR_EC_OFFICER_ROLE, msg.sender);
        _grantRole(RETURNING_OFFICER_ROLE, msg.sender);
    }

    modifier onlyDuringCollation() {
        require(electionStatus == ElectionStatus.ACTIVE || electionStatus == ElectionStatus.COLLATING, "Collation not open");
        _;
    }

    modifier stationMustExist(string calldata stationId) {
        require(_results[stationId].submittedAt > 0, "Station not found");
        _;
    }

    modifier stationNotYetSubmitted(string calldata stationId) {
        require(_results[stationId].submittedAt == 0, "Already submitted");
        _;
    }

    modifier constituencyNotLocked(string calldata constituency) {
        require(!_constituencies[constituency].locked, "Constituency locked");
        _;
    }

    function setElectionStatus(ElectionStatus newStatus) external onlyRole(SENIOR_EC_OFFICER_ROLE) {
        electionStatus = newStatus;
        emit ElectionStatusChanged(newStatus, block.timestamp);
    }

    function pause()   external onlyRole(SENIOR_EC_OFFICER_ROLE) { _pause(); }
    function unpause() external onlyRole(SENIOR_EC_OFFICER_ROLE) { _unpause(); }

    function registerPresidingOfficer(address wallet, string calldata name) external onlyRole(SENIOR_EC_OFFICER_ROLE) {
        require(wallet != address(0), "Zero address");
        require(bytes(name).length > 0, "Empty name");
        _grantRole(PRESIDING_OFFICER_ROLE, wallet);
        _officerNames[wallet] = name;
        emit OfficerRegistered(wallet, PRESIDING_OFFICER_ROLE, name, block.timestamp);
    }

    function registerReturningOfficer(address wallet, string calldata name) external onlyRole(SENIOR_EC_OFFICER_ROLE) {
        require(wallet != address(0), "Zero address");
        require(bytes(name).length > 0, "Empty name");
        _grantRole(RETURNING_OFFICER_ROLE, wallet);
        _officerNames[wallet] = name;
        emit OfficerRegistered(wallet, RETURNING_OFFICER_ROLE, name, block.timestamp);
    }

    function revokePresidingOfficer(address wallet) external onlyRole(SENIOR_EC_OFFICER_ROLE) {
        _revokeRole(PRESIDING_OFFICER_ROLE, wallet);
    }

    function getOfficerName(address wallet) external view returns (string memory) {
        return _officerNames[wallet];
    }

    function submitResult(
        string   calldata stationId,
        string   calldata stationName,
        string   calldata constituency,
        string   calldata district,
        string   calldata region,
        uint256[] calldata votes,
        uint256  registeredVoters,
        uint256  accreditedVoters,
        uint256  rejectedBallots,
        string   calldata ipfsHash
    )
        external override whenNotPaused nonReentrant
        onlyRole(PRESIDING_OFFICER_ROLE)
        onlyDuringCollation
        stationNotYetSubmitted(stationId)
        constituencyNotLocked(constituency)
    {
        require(bytes(stationId).length > 0,       "Empty station ID");
        require(bytes(ipfsHash).length > 0,         "IPFS hash required");
        require(votes.length == _candidates.length, "Wrong candidate count");
        require(accreditedVoters <= registeredVoters, "Accredited > registered");

        uint256 totalVotes;
        for (uint256 i = 0; i < votes.length; i++) totalVotes += votes[i];
        require(totalVotes + rejectedBallots <= accreditedVoters, "Votes + rejected exceed accredited");

        _results[stationId] = PollingStationResult({
            stationId:        stationId,
            stationName:      stationName,
            constituency:     constituency,
            district:         district,
            region:           region,
            votes:            votes,
            registeredVoters: registeredVoters,
            accreditedVoters: accreditedVoters,
            rejectedBallots:  rejectedBallots,
            ipfsHash:         ipfsHash,
            submittedBy:      msg.sender,
            submittedAt:      block.timestamp,
            status:           ResultStatus.PENDING
        });

        _stationIds.push(stationId);

        if (!_constituencySeen[constituency]) {
            _constituencySeen[constituency] = true;
            _constituencyNames.push(constituency);
            _constituencies[constituency].name      = constituency;
            _constituencies[constituency].district  = district;
            _constituencies[constituency].region    = region;
        }
        _constituencies[constituency].reportedStations++;

        emit ResultSubmitted(stationId, constituency, msg.sender, ipfsHash, block.timestamp);
    }

    function confirmResult(string calldata stationId)
        external override whenNotPaused onlyRole(RETURNING_OFFICER_ROLE) stationMustExist(stationId)
    {
        require(_results[stationId].status == ResultStatus.PENDING, "Not in pending status");
        _results[stationId].status = ResultStatus.CONFIRMED;
        emit ResultConfirmed(stationId, msg.sender, block.timestamp);
    }

    function flagResult(string calldata stationId, string calldata reason)
        external override whenNotPaused onlyRole(RETURNING_OFFICER_ROLE) stationMustExist(stationId)
    {
        require(_results[stationId].status != ResultStatus.FLAGGED, "Already flagged");
        require(!_constituencies[_results[stationId].constituency].locked, "Constituency locked");
        require(bytes(reason).length > 0, "Reason required");
        _results[stationId].status = ResultStatus.FLAGGED;
        emit ResultFlagged(stationId, msg.sender, reason, block.timestamp);
    }

    function lockConstituency(string calldata constituency)
        external override whenNotPaused onlyRole(RETURNING_OFFICER_ROLE) constituencyNotLocked(constituency)
    {
        for (uint256 i = 0; i < _stationIds.length; i++) {
            PollingStationResult storage r = _results[_stationIds[i]];
            if (keccak256(bytes(r.constituency)) == keccak256(bytes(constituency)) && r.status == ResultStatus.FLAGGED) {
                revert("Resolve all flagged results first");
            }
        }
        (, uint256 grandTotal) = getConstituencyTotal(constituency);
        _constituencies[constituency].locked   = true;
        _constituencies[constituency].lockedBy = msg.sender;
        _constituencies[constituency].lockedAt = block.timestamp;
        emit ConstituencyLocked(constituency, msg.sender, grandTotal, block.timestamp);
    }

    function requestCorrection(
        string   calldata stationId,
        uint256[] calldata correctedVotes,
        uint256  correctedRejected,
        string   calldata correctedIpfsHash,
        string   calldata reason
    )
        external override whenNotPaused onlyRole(PRESIDING_OFFICER_ROLE) stationMustExist(stationId)
    {
        require(_results[stationId].status == ResultStatus.FLAGGED, "Not flagged");
        require(correctedVotes.length == _candidates.length,         "Wrong count");
        require(bytes(correctedIpfsHash).length > 0,                 "IPFS required");
        require(bytes(reason).length > 0,                            "Reason required");

        uint256 total;
        for (uint256 i = 0; i < correctedVotes.length; i++) total += correctedVotes[i];
        require(total + correctedRejected <= _results[stationId].accreditedVoters, "Corrected votes exceed accredited");

        uint256 id = _correctionCount++;
        _corrections[id] = CorrectionRequest({
            stationId:         stationId,
            correctedVotes:    correctedVotes,
            correctedRejected: correctedRejected,
            correctedIpfsHash: correctedIpfsHash,
            reason:            reason,
            requestedBy:       msg.sender,
            requestedAt:       block.timestamp,
            roApproved:        false,
            seniorApproved:    false,
            executed:          false
        });
        emit CorrectionRequested(stationId, msg.sender, id, block.timestamp);
    }

    function approveCorrection(uint256 correctionId) external override whenNotPaused {
        CorrectionRequest storage req = _corrections[correctionId];
        require(!req.executed,      "Already executed");
        require(req.requestedAt > 0,"Correction not found");

        if (hasRole(RETURNING_OFFICER_ROLE, msg.sender)) {
            require(!req.roApproved, "RO already approved");
            req.roApproved = true;
            emit CorrectionApproved(correctionId, msg.sender, block.timestamp);
        } else if (hasRole(SENIOR_EC_OFFICER_ROLE, msg.sender)) {
            require(!req.seniorApproved, "Senior already approved");
            req.seniorApproved = true;
            emit CorrectionApproved(correctionId, msg.sender, block.timestamp);
        } else {
            revert("Not authorised to approve");
        }

        if (req.roApproved && req.seniorApproved) {
            PollingStationResult storage r = _results[req.stationId];
            r.votes           = req.correctedVotes;
            r.rejectedBallots = req.correctedRejected;
            r.ipfsHash        = req.correctedIpfsHash;
            r.status          = ResultStatus.CORRECTED;
            req.executed      = true;
            emit CorrectionExecuted(correctionId, req.stationId, block.timestamp);
        }
    }

    function getResult(string calldata stationId) external view override returns (PollingStationResult memory) {
        return _results[stationId];
    }

    function getConstituencyTotal(string calldata constituency) public view override returns (uint256[] memory totals, uint256 grandTotal) {
        totals = new uint256[](_candidates.length);
        for (uint256 i = 0; i < _stationIds.length; i++) {
            PollingStationResult storage r = _results[_stationIds[i]];
            if (keccak256(bytes(r.constituency)) == keccak256(bytes(constituency)) &&
                (r.status == ResultStatus.CONFIRMED || r.status == ResultStatus.CORRECTED)) {
                for (uint256 j = 0; j < _candidates.length; j++) {
                    totals[j]  += r.votes[j];
                    grandTotal += r.votes[j];
                }
            }
        }
    }

    function getConstituency(string calldata c) external view override returns (Constituency memory) { return _constituencies[c]; }
    function getAllStationIds() external view override returns (string[] memory) { return _stationIds; }
    function getAllConstituencies() external view override returns (string[] memory) { return _constituencyNames; }
    function getCandidates() external view override returns (Candidate[] memory) { return _candidates; }
    function getElectionStatus() external view override returns (ElectionStatus) { return electionStatus; }
    function getCorrection(uint256 id) external view override returns (CorrectionRequest memory) { return _corrections[id]; }
    function candidateCount() external view returns (uint256) { return _candidates.length; }
    function totalStationsReported() external view returns (uint256) { return _stationIds.length; }
}