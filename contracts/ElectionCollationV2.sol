[
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "AccessControlBadConfirmation",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      },
      {
        "internalType": "bytes32",
        "name": "neededRole",
        "type": "bytes32"
      }
    ],
    "name": "AccessControlUnauthorizedAccount",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ReentrancyGuardReentrantCall",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "index",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "party",
        "type": "string"
      }
    ],
    "name": "CandidateAdded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "applicant",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "constituency",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "stationId",
        "type": "string"
      }
    ],
    "name": "OfficerApplied",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "officer",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "stationId",
        "type": "string"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "approvedBy",
        "type": "address"
      }
    ],
    "name": "OfficerApproved",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "officer",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "rejectedBy",
        "type": "address"
      }
    ],
    "name": "OfficerRejected",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "officer",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "stationId",
        "type": "string"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "removedBy",
        "type": "address"
      }
    ],
    "name": "PresidingOfficerRemoved",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "string",
        "name": "stationId",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "registeredVoters",
        "type": "uint256"
      }
    ],
    "name": "RegisteredVotersUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "string",
        "name": "stationId",
        "type": "string"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "officer",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "recordHash",
        "type": "string"
      }
    ],
    "name": "ResultSubmitted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "ro",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "constituency",
        "type": "string"
      }
    ],
    "name": "ReturningOfficerAssigned",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "ro",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "constituency",
        "type": "string"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "removedBy",
        "type": "address"
      }
    ],
    "name": "ReturningOfficerRemoved",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "previousAdminRole",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "newAdminRole",
        "type": "bytes32"
      }
    ],
    "name": "RoleAdminChanged",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "account",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "sender",
        "type": "address"
      }
    ],
    "name": "RoleGranted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "account",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "sender",
        "type": "address"
      }
    ],
    "name": "RoleRevoked",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "string",
        "name": "stationId",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "constituency",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "registeredVoters",
        "type": "uint256"
      }
    ],
    "name": "StationRegistered",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "enum ElectionCollationV2.ElectionStatus",
        "name": "newStatus",
        "type": "uint8"
      }
    ],
    "name": "StatusChanged",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "DEFAULT_ADMIN_ROLE",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "EC_CHAIR_ROLE",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "PRESIDING_OFFICER_ROLE",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "RETURNING_OFFICER_ROLE",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "party",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "color",
        "type": "string"
      }
    ],
    "name": "addCandidate",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "applications",
    "outputs": [
      {
        "internalType": "address",
        "name": "applicant",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "region",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "constituency",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "district",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "stationId",
        "type": "string"
      },
      {
        "internalType": "enum ElectionCollationV2.ApplicationStatus",
        "name": "status",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "appliedAt",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "region",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "constituency",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "district",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "stationId",
        "type": "string"
      }
    ],
    "name": "applyAsOfficer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "officer",
        "type": "address"
      }
    ],
    "name": "approveOfficer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address[]",
        "name": "officers",
        "type": "address[]"
      },
      {
        "internalType": "string[]",
        "name": "stationIdList",
        "type": "string[]"
      }
    ],
    "name": "assignPresidingOfficersBatch",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "ro",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "constituency",
        "type": "string"
      }
    ],
    "name": "assignReturningOfficer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address[]",
        "name": "ros",
        "type": "address[]"
      },
      {
        "internalType": "string[]",
        "name": "constituencies",
        "type": "string[]"
      }
    ],
    "name": "assignReturningOfficersBatch",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "candidates",
    "outputs": [
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "party",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "color",
        "type": "string"
      },
      {
        "internalType": "bool",
        "name": "exists",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllStationIds",
    "outputs": [
      {
        "internalType": "string[]",
        "name": "",
        "type": "string[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getCandidateCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "who",
        "type": "address"
      }
    ],
    "name": "getMyRole",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getNationalTotals",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "totals",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getPendingApplicants",
    "outputs": [
      {
        "internalType": "address[]",
        "name": "",
        "type": "address[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "stationId",
        "type": "string"
      }
    ],
    "name": "getResult",
    "outputs": [
      {
        "components": [
          {
            "internalType": "string",
            "name": "stationId",
            "type": "string"
          },
          {
            "internalType": "uint256[]",
            "name": "votes",
            "type": "uint256[]"
          },
          {
            "internalType": "uint256",
            "name": "accreditedVoters",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "rejectedBallots",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "recordHash",
            "type": "string"
          },
          {
            "internalType": "address",
            "name": "submittedBy",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "submittedAt",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "exists",
            "type": "bool"
          }
        ],
        "internalType": "struct ElectionCollationV2.Result",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      }
    ],
    "name": "getRoleAdmin",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "stationId",
        "type": "string"
      }
    ],
    "name": "getStation",
    "outputs": [
      {
        "components": [
          {
            "internalType": "string",
            "name": "stationId",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "name",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "constituency",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "registeredVoters",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "registered",
            "type": "bool"
          },
          {
            "internalType": "bool",
            "name": "submitted",
            "type": "bool"
          }
        ],
        "internalType": "struct ElectionCollationV2.Station",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getStationCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getSubmittedCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getSubmittedStationIds",
    "outputs": [
      {
        "internalType": "string[]",
        "name": "",
        "type": "string[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      },
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "grantRole",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      },
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "hasRole",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "officerConstituency",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "officerStation",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "stationId",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "registeredVoters",
        "type": "uint256"
      }
    ],
    "name": "registerStation",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string[]",
        "name": "ids",
        "type": "string[]"
      },
      {
        "internalType": "string[]",
        "name": "names",
        "type": "string[]"
      },
      {
        "internalType": "uint256[]",
        "name": "registeredVoters",
        "type": "uint256[]"
      }
    ],
    "name": "registerStationsBatch",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "officer",
        "type": "address"
      }
    ],
    "name": "rejectOfficer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "officer",
        "type": "address"
      }
    ],
    "name": "removePresidingOfficer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "ro",
        "type": "address"
      }
    ],
    "name": "removeReturningOfficer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      },
      {
        "internalType": "address",
        "name": "callerConfirmation",
        "type": "address"
      }
    ],
    "name": "renounceRole",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      },
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "revokeRole",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "enum ElectionCollationV2.ElectionStatus",
        "name": "newStatus",
        "type": "uint8"
      }
    ],
    "name": "setStatus",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "status",
    "outputs": [
      {
        "internalType": "enum ElectionCollationV2.ElectionStatus",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256[]",
        "name": "votes",
        "type": "uint256[]"
      },
      {
        "internalType": "uint256",
        "name": "accreditedVoters",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "rejectedBallots",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "recordHash",
        "type": "string"
      }
    ],
    "name": "submitResult",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes4",
        "name": "interfaceId",
        "type": "bytes4"
      }
    ],
    "name": "supportsInterface",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "stationId",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "registeredVoters",
        "type": "uint256"
      }
    ],
    "name": "updateRegisteredVoters",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]