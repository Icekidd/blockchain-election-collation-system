const { ethers } = require("hardhat");

const CONTRACT = "0x94e6E38cf797651519eff81d4507c6CA1d7A047B";

async function main() {
  const [senior] = await ethers.getSigners();
  console.log("Using wallet:", senior.address);

  const contract = await ethers.getContractAt("ElectionCollation", CONTRACT, senior);
  const role = await contract.RETURNING_OFFICER_ROLE();

  console.log("hasRole before:", await contract.hasRole(role, senior.address));
  const tx = await contract.revokeRole(role, senior.address);
  console.log("Tx sent:", tx.hash);
  await tx.wait();
  console.log("hasRole after:", await contract.hasRole(role, senior.address));

  const seniorRole = await contract.SENIOR_EC_OFFICER_ROLE();
  console.log("Still senior:", await contract.hasRole(seniorRole, senior.address));
}

main().catch((e) => { console.error(e); process.exit(1); });