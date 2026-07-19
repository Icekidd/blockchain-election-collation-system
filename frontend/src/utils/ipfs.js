import axios from "axios";

const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;

// Pin a file (e.g. the Pink Sheet image) to IPFS via Pinata.
export async function uploadToIPFS(file, stationId) {
  if (!PINATA_JWT) throw new Error("VITE_PINATA_JWT not set in .env");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("pinataMetadata", JSON.stringify({
    name: `PinkSheet-${stationId}-${Date.now()}`,
    keyvalues: { stationId, uploadedAt: new Date().toISOString() }
  }));
  formData.append("pinataOptions", JSON.stringify({ cidVersion: 1 }));

  const res = await axios.post(
    "https://api.pinata.cloud/pinning/pinFileToIPFS",
    formData,
    { headers: { Authorization: `Bearer ${PINATA_JWT}` } }
  );

  return res.data.IpfsHash;
}

// Pin a JSON object (e.g. the full verification record) to IPFS via Pinata.
// Returns the CID, which is what gets stored on-chain in submitResult.
export async function uploadJSONToIPFS(jsonObject, stationId) {
  if (!PINATA_JWT) throw new Error("VITE_PINATA_JWT not set in .env");

  const res = await axios.post(
    "https://api.pinata.cloud/pinning/pinJSONToIPFS",
    {
      pinataContent: jsonObject,
      pinataMetadata: {
        name: `Record-${stationId}-${Date.now()}`,
        keyvalues: { stationId, type: "result-record", createdAt: new Date().toISOString() },
      },
      pinataOptions: { cidVersion: 1 },
    },
    { headers: { Authorization: `Bearer ${PINATA_JWT}`, "Content-Type": "application/json" } }
  );

  return res.data.IpfsHash;
}

export function ipfsUrl(hash) {
  return `https://gateway.pinata.cloud/ipfs/${hash}`;
}