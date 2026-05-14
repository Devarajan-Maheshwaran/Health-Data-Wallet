import { expect } from "chai";
import { ethers } from "hardhat";
import { PatientRegistry } from "../typechain-types";

describe("PatientRegistry", () => {
  let registry: PatientRegistry;
  let owner: any, alice: any, bob: any;

  beforeEach(async () => {
    [owner, alice, bob] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("PatientRegistry");
    registry = await Factory.deploy();
  });

  // ---------------------------------------------------------------------------
  // Registration
  // ---------------------------------------------------------------------------
  describe("register", () => {
    it("registers a new patient and emits event", async () => {
      await expect(registry.connect(alice).register("Alice Smith"))
        .to.emit(registry, "PatientRegistered")
        .withArgs(alice.address, "Alice Smith", await latestTimestamp());

      expect(await registry.isRegistered(alice.address)).to.be.true;
    });

    it("reverts if already registered", async () => {
      await registry.connect(alice).register("Alice Smith");
      await expect(registry.connect(alice).register("Alice Smith"))
        .to.be.revertedWith("PatientRegistry: already registered");
    });
  });

  // ---------------------------------------------------------------------------
  // Emergency card
  // ---------------------------------------------------------------------------
  describe("updateEmergencyCard", () => {
    it("updates the IPFS hash and emits event", async () => {
      await registry.connect(alice).register("Alice");
      const hash = "QmTestHash123";

      await expect(registry.connect(alice).updateEmergencyCard(hash))
        .to.emit(registry, "EmergencyCardUpdated")
        .withArgs(alice.address, hash);

      const [, , ipfsHash] = await registry.getProfile(alice.address);
      expect(ipfsHash).to.equal(hash);
    });

    it("reverts if caller is not registered", async () => {
      await expect(registry.connect(alice).updateEmergencyCard("hash"))
        .to.be.revertedWith("PatientRegistry: not registered");
    });
  });

  // ---------------------------------------------------------------------------
  // Trusted parties
  // ---------------------------------------------------------------------------
  describe("trusted parties", () => {
    beforeEach(async () => {
      await registry.connect(alice).register("Alice");
    });

    it("adds a trusted party", async () => {
      await expect(registry.connect(alice).addTrustedParty(bob.address))
        .to.emit(registry, "TrustedPartyAdded")
        .withArgs(alice.address, bob.address);

      const parties = await registry.getTrustedParties(alice.address);
      expect(parties).to.include(bob.address);
    });

    it("reverts when adding self", async () => {
      await expect(registry.connect(alice).addTrustedParty(alice.address))
        .to.be.revertedWith("PatientRegistry: cannot add self");
    });

    it("removes a trusted party by index", async () => {
      await registry.connect(alice).addTrustedParty(bob.address);
      await expect(registry.connect(alice).removeTrustedParty(0))
        .to.emit(registry, "TrustedPartyRemoved")
        .withArgs(alice.address, bob.address);

      const parties = await registry.getTrustedParties(alice.address);
      expect(parties.length).to.equal(0);
    });

    it("reverts on out-of-bounds index", async () => {
      await expect(registry.connect(alice).removeTrustedParty(5))
        .to.be.revertedWith("PatientRegistry: index out of bounds");
    });
  });

  // ---------------------------------------------------------------------------
  // Helper
  // ---------------------------------------------------------------------------
  async function latestTimestamp(): Promise<number> {
    const block = await ethers.provider.getBlock("latest");
    return block!.timestamp;
  }
});
