const hre = require("hardhat");
const fs  = require("fs");

async function main() {
  const deployment = JSON.parse(fs.readFileSync("deployment.json", "utf8"));
  const [deployer] = await hre.ethers.getSigners();

  console.log("Contract:", deployment.address);
  console.log("Signer:  ", deployer.address);

  const Factory  = await hre.ethers.getContractFactory("ElectionCollation");
  const contract = Factory.attach(deployment.address).connect(deployer);

  // Check current status
  const status = await contract.getElectionStatus();
  console.log("Current status:", status.toString());

  if (status.toString() === "1") {
    console.log("Election already ACTIVE — nothing to do.");
    return;
  }

  // Set to ACTIVE (1)
  console.log("Setting to ACTIVE...");
  const tx = await contract.setElectionStatus(1);
  console.log("Tx sent:", tx.hash);
  await tx.wait();
  console.log("Done — election is now ACTIVE");
}

main().catch(err => { console.error(err); process.exit(1); });