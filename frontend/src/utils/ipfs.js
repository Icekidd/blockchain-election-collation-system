import axios from "axios";

const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;

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

export function ipfsUrl(hash) {
  return `https://gateway.pinata.cloud/ipfs/${hash}`;
}