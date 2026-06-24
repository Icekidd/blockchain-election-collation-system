const hre = require("hardhat");
const fs  = require("fs");

async function main() {
  const deployment = JSON.parse(fs.readFileSync("deployment.json", "utf8"));

  console.log("Verifying contract on PolygonScan Amoy...");
  console.log("Contract:", deployment.address);

  await hre.run("verify:verify", {
    address: deployment.address,
    constructorArguments: [
      "2024 Ghana Presidential Election",
      "2024-12-07",
      ["Mahamudu Bawumia", "John Dramani Mahama", "Ivor Kobina Greenstreet", "Nana Akosua Frimpomaa"],
      ["NPP", "NDC", "CPP", "PPP"],
      ["#2563eb", "#006B3F", "#CE1126", "#7c3aed"]
    ],
  });

  console.log("✅ Verified on https://amoy.polygonscan.com/address/" + deployment.address);
}

main().catch(err => { console.error(err); process.exit(1); });