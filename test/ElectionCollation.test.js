const { expect } = require("chai");
const { ethers }  = require("hardhat");

describe("ElectionCollation", function () {
  let contract;
  let owner, presiding, returning, senior, stranger;

  const PRESIDING_ROLE = ethers.keccak256(ethers.toUtf8Bytes("PRESIDING_OFFICER_ROLE"));
  const RETURNING_ROLE = ethers.keccak256(ethers.toUtf8Bytes("RETURNING_OFFICER_ROLE"));
  const SENIOR_ROLE    = ethers.keccak256(ethers.toUtf8Bytes("SENIOR_EC_OFFICER_ROLE"));

  const CANDIDATES = {
    names:   ["Mahamudu Bawumia", "John Mahama", "Ivor Greenstreet", "Nana Frimpomaa"],
    parties: ["NPP", "NDC", "CPP", "PPP"],
    colors:  ["#2563eb", "#006B3F", "#CE1126", "#7c3aed"],
  };

  const STATION = {
    id:           "PS-GA-0221",
    name:         "Ablekuma Primary School",
    constituency: "Ablekuma Central",
    district:     "Accra Metropolitan",
    region:       "Greater Accra",
    votes:        [421, 389, 62, 20],
    registered:   1240,
    accredited:   900,
    rejected:     8,
    ipfs:         "QmTestHash1111111111111111111111111111111111",
  };

  async function submitStation(signer, overrides = {}) {
    const s = { ...STATION, ...overrides };
    return contract.connect(signer).submitResult(
      s.id, s.name, s.constituency, s.district, s.region,
      s.votes, s.registered, s.accredited, s.rejected, s.ipfs
    );
  }

  beforeEach(async () => {
    [owner, presiding, returning, senior, stranger] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("ElectionCollation");
    contract = await Factory.deploy(
      "2024 Ghana Presidential Election",
      "2024-12-07",
      CANDIDATES.names,
      CANDIDATES.parties,
      CANDIDATES.colors
    );
    await contract.waitForDeployment();

    await contract.grantRole(PRESIDING_ROLE, presiding.address);
    await contract.grantRole(RETURNING_ROLE, returning.address);
    await contract.grantRole(SENIOR_ROLE,    senior.address);

    await contract.registerPresidingOfficer(presiding.address, "Kwame Asante");
    await contract.registerReturningOfficer(returning.address, "Kofi Boateng");

    // Set election to ACTIVE
    await contract.setElectionStatus(1);
  });

  describe("Deployment", () => {
    it("stores election name and date", async () => {
      expect(await contract.electionName()).to.equal("2024 Ghana Presidential Election");
      expect(await contract.electionDate()).to.equal("2024-12-07");
    });

    it("stores 4 candidates", async () => {
      expect(await contract.candidateCount()).to.equal(4);
    });

    it("grants deployer admin role", async () => {
      const ADMIN = await contract.DEFAULT_ADMIN_ROLE();
      expect(await contract.hasRole(ADMIN, owner.address)).to.be.true;
    });
  });

  describe("submitResult", () => {
    it("presiding officer can submit a result", async () => {
      await expect(submitStation(presiding))
        .to.emit(contract, "ResultSubmitted");
    });

    it("stranger cannot submit", async () => {
      await expect(submitStation(stranger)).to.be.reverted;
    });

    it("prevents double submission", async () => {
      await submitStation(presiding);
      await expect(submitStation(presiding))
        .to.be.revertedWith("Already submitted");
    });

    it("rejects if votes exceed accredited voters", async () => {
      await expect(submitStation(presiding, { votes: [400, 400, 100, 100] }))
        .to.be.revertedWith("Votes + rejected exceed accredited");
    });

    it("rejects empty IPFS hash", async () => {
      await expect(submitStation(presiding, { ipfs: "" }))
        .to.be.revertedWith("IPFS hash required");
    });
  });

  describe("confirmResult", () => {
    beforeEach(async () => { await submitStation(presiding); });

    it("returning officer confirms a result", async () => {
      await expect(contract.connect(returning).confirmResult(STATION.id))
        .to.emit(contract, "ResultConfirmed");
    });

    it("stranger cannot confirm", async () => {
      await expect(contract.connect(stranger).confirmResult(STATION.id))
        .to.be.reverted;
    });
  });

  describe("flagResult", () => {
    beforeEach(async () => { await submitStation(presiding); });

    it("returning officer flags with reason", async () => {
      await expect(contract.connect(returning).flagResult(STATION.id, "Suspicious totals"))
        .to.emit(contract, "ResultFlagged");
    });

    it("rejects empty reason", async () => {
      await expect(contract.connect(returning).flagResult(STATION.id, ""))
        .to.be.revertedWith("Reason required");
    });
  });

  describe("lockConstituency", () => {
    beforeEach(async () => {
      await submitStation(presiding);
      await contract.connect(returning).confirmResult(STATION.id);
    });

    it("returning officer locks constituency", async () => {
      await expect(contract.connect(returning).lockConstituency(STATION.constituency))
        .to.emit(contract, "ConstituencyLocked");
    });

    it("blocks submissions to locked constituency", async () => {
      await contract.connect(returning).lockConstituency(STATION.constituency);
      await expect(submitStation(presiding, { id: "PS-GA-0222" }))
        .to.be.revertedWith("Constituency locked");
    });
  });

  describe("Correction (2-of-2 multi-sig)", () => {
    beforeEach(async () => {
      await submitStation(presiding);
      await contract.connect(returning).flagResult(STATION.id, "Suspicious totals");
    });

    it("presiding officer requests correction", async () => {
      await expect(
        contract.connect(presiding).requestCorrection(
          STATION.id, [400, 380, 60, 18], 8, "QmCorrectedHash", "Data entry error"
        )
      ).to.emit(contract, "CorrectionRequested");
    });

    it("executes only after both approvals", async () => {
      await contract.connect(presiding).requestCorrection(
        STATION.id, [400, 380, 60, 18], 8, "QmCorrectedHash", "Data entry error"
      );
      await contract.connect(returning).approveCorrection(0);
      let r = await contract.getResult(STATION.id);
      expect(Number(r.status)).to.equal(2); // still FLAGGED

      await contract.connect(senior).approveCorrection(0);
      r = await contract.getResult(STATION.id);
      expect(Number(r.status)).to.equal(3); // CORRECTED
    });
  });
});