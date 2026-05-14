import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { AccessController } from "../typechain-types";

describe("AccessController", () => {
  let controller: AccessController;
  let admin: any, alice: any, doctor: any, attorney: any;

  const AccessTier = {
    EMERGENCY_READ: 0,
    RECORD_READ: 1,
    FULL_READ: 2,
    PROVIDER_WRITE: 3,
  };

  const ONE_HOUR = 3600;
  const THREE_DAYS = 3 * 24 * 3600;

  beforeEach(async () => {
    [admin, alice, doctor, attorney] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("AccessController");
    controller = await Factory.deploy();
  });

  // ---------------------------------------------------------------------------
  // Provider registration
  // ---------------------------------------------------------------------------
  describe("registerProvider", () => {
    it("admin can register a provider", async () => {
      await controller.connect(admin).registerProvider(doctor.address);
      expect(await controller.registeredProviders(doctor.address)).to.be.true;
    });

    it("non-admin cannot register a provider", async () => {
      await expect(
        controller.connect(alice).registerProvider(doctor.address)
      ).to.be.revertedWith("AccessController: not admin");
    });
  });

  // ---------------------------------------------------------------------------
  // grantAccess
  // ---------------------------------------------------------------------------
  describe("grantAccess", () => {
    it("grants time-limited read access to a doctor", async () => {
      await expect(
        controller.connect(alice).grantAccess(
          doctor.address,
          AccessTier.RECORD_READ,
          THREE_DAYS,
          []
        )
      ).to.emit(controller, "AccessGranted");

      expect(await controller.isActiveAccessor(alice.address, doctor.address)).to.be.true;
    });

    it("grants permanent access when durationSeconds == 0", async () => {
      await controller.connect(alice).grantAccess(attorney.address, AccessTier.FULL_READ, 0, []);
      const [, , expiresAt] = await controller.getGrant(alice.address, attorney.address);
      expect(expiresAt).to.equal(0);
    });

    it("reverts granting to self", async () => {
      await expect(
        controller.connect(alice).grantAccess(alice.address, AccessTier.RECORD_READ, ONE_HOUR, [])
      ).to.be.revertedWith("AccessController: cannot grant to self");
    });
  });

  // ---------------------------------------------------------------------------
  // revokeAccess
  // ---------------------------------------------------------------------------
  describe("revokeAccess", () => {
    beforeEach(async () => {
      await controller.connect(alice).grantAccess(doctor.address, AccessTier.RECORD_READ, THREE_DAYS, []);
    });

    it("revokes an active grant", async () => {
      await expect(controller.connect(alice).revokeAccess(doctor.address))
        .to.emit(controller, "AccessRevoked")
        .withArgs(alice.address, doctor.address);

      expect(await controller.isActiveAccessor(alice.address, doctor.address)).to.be.false;
    });

    it("reverts when no active grant exists", async () => {
      await controller.connect(alice).revokeAccess(doctor.address);
      await expect(controller.connect(alice).revokeAccess(doctor.address))
        .to.be.revertedWith("AccessController: no active grant to revoke");
    });
  });

  // ---------------------------------------------------------------------------
  // checkAccess — expiry
  // ---------------------------------------------------------------------------
  describe("checkAccess — expiry", () => {
    it("returns false after grant expires", async () => {
      await controller.connect(alice).grantAccess(doctor.address, AccessTier.RECORD_READ, ONE_HOUR, []);

      // Fast-forward 2 hours
      await time.increase(2 * ONE_HOUR);

      const [allowed] = await controller.checkAccess(alice.address, doctor.address, 0);
      expect(allowed).to.be.false;
    });

    it("returns true before expiry", async () => {
      await controller.connect(alice).grantAccess(doctor.address, AccessTier.RECORD_READ, THREE_DAYS, []);
      const [allowed, tier] = await controller.checkAccess(alice.address, doctor.address, 0);
      expect(allowed).to.be.true;
      expect(tier).to.equal(AccessTier.RECORD_READ);
    });
  });

  // ---------------------------------------------------------------------------
  // checkAccess — record-level restriction
  // ---------------------------------------------------------------------------
  describe("checkAccess — per-record restriction", () => {
    beforeEach(async () => {
      // Grant access only to record IDs 0 and 2 (cardiac records only)
      await controller.connect(alice).grantAccess(
        doctor.address,
        AccessTier.RECORD_READ,
        THREE_DAYS,
        [0, 2]
      );
    });

    it("allows access to permitted record IDs", async () => {
      const [allowed0] = await controller.checkAccess(alice.address, doctor.address, 0);
      const [allowed2] = await controller.checkAccess(alice.address, doctor.address, 2);
      expect(allowed0).to.be.true;
      expect(allowed2).to.be.true;
    });

    it("denies access to non-permitted record IDs", async () => {
      const [allowed1] = await controller.checkAccess(alice.address, doctor.address, 1);
      const [allowed5] = await controller.checkAccess(alice.address, doctor.address, 5);
      expect(allowed1).to.be.false;
      expect(allowed5).to.be.false;
    });
  });

  // ---------------------------------------------------------------------------
  // Audit log
  // ---------------------------------------------------------------------------
  describe("logAccess", () => {
    beforeEach(async () => {
      await controller.connect(alice).grantAccess(doctor.address, AccessTier.RECORD_READ, THREE_DAYS, []);
    });

    it("appends an access log entry", async () => {
      await controller.connect(doctor).logAccess(alice.address, 0, 1, "READ");
      const logs = await controller.getAccessLogs(alice.address);
      expect(logs.length).to.equal(1);
      expect(logs[0].accessor).to.equal(doctor.address);
      expect(logs[0].action).to.equal("READ");
    });

    it("owner can log their own access", async () => {
      await controller.connect(alice).logAccess(alice.address, 0, 1, "SELF_DOWNLOAD");
      const logs = await controller.getAccessLogs(alice.address);
      expect(logs[0].action).to.equal("SELF_DOWNLOAD");
    });

    it("reverts for unauthorized logger", async () => {
      await expect(
        controller.connect(attorney).logAccess(alice.address, 0, 1, "READ")
      ).to.be.revertedWith("AccessController: not authorized to log for this patient");
    });

    it("stores multiple log entries in order", async () => {
      await controller.connect(doctor).logAccess(alice.address, 0, 1, "READ");
      await controller.connect(doctor).logAccess(alice.address, 1, 1, "DOWNLOAD");
      await controller.connect(doctor).logAccess(alice.address, 2, 2, "ADD_NOTE");

      const logs = await controller.getAccessLogs(alice.address);
      expect(logs.length).to.equal(3);
      expect(logs[1].action).to.equal("DOWNLOAD");
      expect(logs[2].recordId).to.equal(2);
    });
  });
});
