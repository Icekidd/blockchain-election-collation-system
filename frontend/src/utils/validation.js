import { STATION_ID_PREFIXES } from "../data/ghana.js";

export function validateSubmission({
  stationId, stationName, constituency,
  district, region, votes,
  registeredVoters, accreditedVoters, rejectedBallots, ipfsHash
}) {
  const errors = {};

  const stationCheck = validateStationId(stationId);
  if (!stationCheck.valid) errors.stationId = stationCheck.error;
  if (!stationName?.trim())  errors.stationName  = "Station name is required";
  if (!constituency?.trim()) errors.constituency = "Constituency is required";
  if (!district?.trim())     errors.district     = "District is required";
  if (!region?.trim())       errors.region       = "Region is required";
  if (!ipfsHash?.trim())     errors.ipfsHash     = "Upload Pink Sheet before submitting";

  const reg = Number(registeredVoters);
  const acc = Number(accreditedVoters);
  const rej = Number(rejectedBallots || 0);

  if (!reg || reg <= 0) errors.registeredVoters = "Enter registered voters";
  if (!acc || acc <= 0) errors.accreditedVoters = "Enter accredited voters";
  if (acc > reg)        errors.accreditedVoters = "Cannot exceed registered voters";
  if (rej < 0)          errors.rejectedBallots  = "Cannot be negative";

  if (!votes || votes.length === 0) {
    errors.votes = "Vote figures required";
  } else {
    const total = votes.reduce((s, v) => s + Number(v || 0), 0);
    if (total + rej > acc) {
      errors.votes = `Total votes (${total}) + rejected (${rej}) exceed accredited voters (${acc})`;
    }
  }

  return { errors, isValid: Object.keys(errors).length === 0 };
}

export function validateCorrection({
  correctedVotes, correctedRejected,
  correctedIpfsHash, reason, accreditedVoters
}) {
  const errors = {};

  if (!correctedIpfsHash?.trim()) errors.correctedIpfsHash = "Corrected Pink Sheet required";
  if (!reason?.trim())            errors.reason            = "Reason for correction required";

  const acc   = Number(accreditedVoters);
  const rej   = Number(correctedRejected || 0);
  const total = (correctedVotes || []).reduce((s, v) => s + Number(v || 0), 0);

  if (total + rej > acc) {
    errors.correctedVotes = `Total (${total}) + rejected (${rej}) exceed accredited (${acc})`;
  }

  return { errors, isValid: Object.keys(errors).length === 0 };
}

export function validateStationId(stationId, region) {
  if (!stationId || !stationId.trim()) {
    return { valid: false, error: "Polling station ID is required" };
  }

  const id = stationId.trim().toUpperCase();

  // EC Ghana official format: [Letter][6 digits] e.g. A010101
  // Optional suffix A or B for split stations e.g. A010801A
  const ecFormat = /^[A-Z]\d{6}[A-Z]?$/;

  if (!ecFormat.test(id)) {
    return {
      valid: false,
      error: "Invalid format. EC Ghana station IDs look like: A010101 or C2501SPS"
    };
  }

  // Region prefix check
  if (region) {
    const expectedPrefix = STATION_ID_PREFIXES[region];
    if (expectedPrefix && !id.startsWith(expectedPrefix)) {
      return {
        valid: false,
        error: `${region} station IDs must start with "${expectedPrefix}" — e.g. ${expectedPrefix}010101`
      };
    }
  }

  return { valid: true, error: null };
}