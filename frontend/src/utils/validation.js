export function validateSubmission({
  stationId, stationName, constituency,
  district, region, votes,
  registeredVoters, accreditedVoters, rejectedBallots, ipfsHash
}) {
  const errors = {};

  if (!stationId?.trim())    errors.stationId    = "Station ID is required";
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