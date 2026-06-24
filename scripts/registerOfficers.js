const hre = require("hardhat");
const fs  = require("fs");

const PRESIDING_OFFICERS = [
  { wallet: "0x7Ef406DAFCFd2BF759896fc4a6722A583058cD12", name: "Alberta Adjololo" },
];

const RETURNING_OFFICERS = [
  { wallet: "0xc89Ff295Ea8f5F6E2D9aF2Ed7DF0ce39f9AcA093", name: "Prince Boakye" },
];

async function main() {
  const deployment = JSON.parse(fs.readFileSync("deployment.json", "utf8"));
  const [deployer] = await hre.ethers.getSigners();

  console.log("Registering officers on:", deployment.address);

  const Factory  = await hre.ethers.getContractFactory("ElectionCollation");
  const contract = Factory.attach(deployment.address).connect(deployer);

  for (const o of PRESIDING_OFFICERS) {
    console.log(`Registering Presiding Officer: ${o.name} (${o.wallet})`);
    const tx = await contract.registerPresidingOfficer(o.wallet, o.name);
    await tx.wait();
    console.log(`✅ ${o.name} registered`);
  }

  for (const o of RETURNING_OFFICERS) {
    console.log(`Registering Returning Officer: ${o.name} (${o.wallet})`);
    const tx = await contract.registerReturningOfficer(o.wallet, o.name);
    await tx.wait();
    console.log(`✅ ${o.name} registered`);
  }

  console.log("\nOfficer registration complete.");
}

main().catch(err => { console.error(err); process.exit(1); });