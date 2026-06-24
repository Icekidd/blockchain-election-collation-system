const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const network    = hre.network.name;
  const balance    = await hre.ethers.provider.getBalance(deployer.address);

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  EC Ghana — Election Collation Deployer");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  Network  : ${network}`);
  console.log(`  Deployer : ${deployer.address}`);
  console.log(`  Balance  : ${hre.ethers.formatEther(balance)} MATIC`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  if (network === "amoy" && balance < hre.ethers.parseEther("0.05")) {
    throw new Error("Insufficient MATIC balance. Get testnet MATIC from faucet.polygon.technology");
  }

  // ── Election configuration ─────────────────────────────────────────────────
  const ELECTION_NAME = "2024 Ghana Presidential Election";
  const ELECTION_DATE = "2024-12-07";

  const CANDIDATES = [
    { name: "Mahamudu Bawumia",      party: "NPP", color: "#2563eb" },
    { name: "John Dramani Mahama",   party: "NDC", color: "#006B3F" },
    { name: "Ivor Kobina Greenstreet",party: "CPP", color: "#CE1126" },
    { name: "Nana Akosua Frimpomaa", party: "PPP", color: "#7c3aed" },
  ];

  const candidateNames  = CANDIDATES.map(c => c.name);
  const partyNames      = CANDIDATES.map(c => c.party);
  const partyColors     = CANDIDATES.map(c => c.color);

  // ── Deploy ─────────────────────────────────────────────────────────────────
  console.log("Deploying ElectionCollation...");
  const Factory  = await hre.ethers.getContractFactory("ElectionCollation");
  const contract = await Factory.deploy(
    ELECTION_NAME,
    ELECTION_DATE,
    candidateNames,
    partyNames,
    partyColors
  );

  await contract.waitForDeployment();
  const address = await contract.getAddress();
  const receipt = await hre.ethers.provider.getTransactionReceipt(
    contract.deploymentTransaction().hash
  );

  console.log("\n✅ Deployed successfully!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  Contract : ${address}`);
  console.log(`  Tx Hash  : ${contract.deploymentTransaction().hash}`);
  console.log(`  Gas Used : ${receipt.gasUsed.toString()}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  console.log("\n📋 Next steps:");
  console.log(`  1. Add to frontend/.env:`);
  console.log(`     VITE_CONTRACT_ADDRESS=${address}`);
  console.log(`  2. Verify on PolygonScan:`);
  console.log(`     npx hardhat run scripts/verify.js --network amoy`);
  console.log(`  3. Register officers:`);
  console.log(`     npx hardhat run scripts/registerOfficers.js --network amoy\n`);

  // Save address to a local file for other scripts to use
  const fs = require("fs");
  const deployData = {
    network,
    address,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    txHash: contract.deploymentTransaction().hash,
  };
  fs.writeFileSync("deployment.json", JSON.stringify(deployData, null, 2));
  console.log("  deployment.json saved.\n");
}

main().catch(err => { console.error(err); process.exit(1); });