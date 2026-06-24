export function shortAddress(addr) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function formatTimestamp(ts) {
  if (!ts) return "—";
  return new Date(Number(ts) * 1000).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function timeAgo(ts) {
  if (!ts) return "—";
  const seconds = Math.floor(Date.now() / 1000) - Number(ts);
  if (seconds < 60)    return `${seconds}s ago`;
  if (seconds < 3600)  return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function formatNumber(n) {
  if (n === undefined || n === null) return "0";
  return Number(n).toLocaleString("en-GH");
}

export function percentage(part, total) {
  if (!total || total === 0n) return "0.0";
  return ((Number(part) / Number(total)) * 100).toFixed(1);
}

export function ipfsGateway(hash) {
  if (!hash) return "#";
  return `https://gateway.pinata.cloud/ipfs/${hash}`;
}

export function shortHash(hash) {
  if (!hash) return "—";
  return `${hash.slice(0, 8)}…${hash.slice(-4)}`;
}

export function explorerTx(hash) {
  return `https://amoy.polygonscan.com/tx/${hash}`;
}

export function explorerAddress(addr) {
  return `https://amoy.polygonscan.com/address/${addr}`;
}