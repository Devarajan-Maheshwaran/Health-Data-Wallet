import { expect } from "chai";
import { ethers } from "hardhat";
import { HealthRecordStore, AccessController } from "../typechain-types";

describe("HealthRecordStore", () => {
  let store: HealthRecordStore;
  let ac: AccessController;
  let alice: any, bob: any, provider: any;

  const DocumentType = {
    LAB_REPORT: 0,
    PRESCRIPTION: 1,
    IMAGING: 2,
    DISCHARGE_SUMMARY: 3,
    VACCINATION: 4,
    INSURANCE_POLICY: 5,
    LEGAL_CONTRACT: 6,
    IDENTITY_DOCUMENT: 7,
    FINANCIAL_RECORD: 8,
    PROPERTY_DOCUMENT: 9,
    ACADEMIC_CREDENTIAL: 10,
    OTHER: 11,
  };

  const AccessTier = { EMERGENCY_READ: 0, RECORD_READ: 1, FULL_READ: 2, PROVIDER_WRITE: 3 };
  const RecordStatus = { ACTIVE: 0, ARCHIVED: 1, DELETED: 2 };

  beforeEach(async () => {
    [, alice, bob, provider] = await ethers.getSigners();

    // Deploy AccessController first
    const ACFactory = await ethers.getContractFactory("AccessController");
    ac = await ACFactory.deploy();

    // Deploy HealthRecordStore wired to the AccessController
    const StoreFactory = await ethers.getContractFactory("HealthRecordStore");
    store = await StoreFactory.deploy(await ac.getAddress());
  });

  // ---------------------------------------------------------------------------
  // addRecord
  // ---------------------------------------------------------------------------
  describe("addRecord", () => {
    it("adds a lab report and emits RecordAdded", async () => {
      await expect(
        store.connect(alice).addRecord(
          DocumentType.LAB_REPORT,
          "HbA1c Report Jan 2026",
          "QmCIDhash001",
          "QmMetaHash001"
        )
      )
        .to.emit(store, "RecordAdded")
        .withArgs(alice.address, 0, DocumentType.LAB_REPORT, "QmCIDhash001");

      expect(await store.getRecordCount(alice.address)).to.equal(1);
    });

    it("increments recordId for each new record", async () => {
      await store.connect(alice).addRecord(DocumentType.LAB_REPORT, "Lab 1", "cid1", "meta1");
      await store.connect(alice).addRecord(DocumentType.PRESCRIPTION, "Rx 1", "cid2", "meta2");
      await store.connect(alice).addRecord(DocumentType.LEGAL_CONTRACT, "NDA", "cid3", "meta3");
      expect(await store.getRecordCount(alice.address)).to.equal(3);
    });

    it("supports all document types", async () => {
      for (const [name, typeId] of Object.entries(DocumentType)) {
        await store.connect(alice).addRecord(typeId as number, name, `cid-${typeId}`, `meta-${typeId}`);
      }
      expect(await store.getRecordCount(alice.address)).to.equal(
        Object.keys(DocumentType).length
      );
    });
  });

  // ---------------------------------------------------------------------------
  // updateRecord — owner
  // ---------------------------------------------------------------------------
  describe("updateRecord (owner)", () => {
    beforeEach(async () => {
      await store.connect(alice).addRecord(DocumentType.LAB_REPORT, "Lab 1", "cid-v1", "meta-v1");
    });

    it("owner creates version 2 and emits RecordUpdated", async () => {
      await expect(store.connect(alice).updateRecord(alice.address, 0, "cid-v2", "meta-v2"))
        .to.emit(store, "RecordUpdated")
        .withArgs(alice.address, 0, 2, "cid-v2");

      const [cid] = await store.getLatestRecord(alice.address, 0);
      expect(cid).to.equal("cid-v2");
    });

    it("preserves previous versions", async () => {
      await store.connect(alice).updateRecord(alice.address, 0, "cid-v2", "meta-v2");
      const [cid] = await store.getVersion(alice.address, 0, 1);
      expect(cid).to.equal("cid-v1");
    });

    it("reverts on non-existent record", async () => {
      await expect(store.connect(alice).updateRecord(alice.address, 99, "cid", "meta"))
        .to.be.revertedWith("HealthRecordStore: record does not exist");
    });
  });

  // ---------------------------------------------------------------------------
  // updateRecord — provider with PROVIDER_WRITE
  // ---------------------------------------------------------------------------
  describe("updateRecord (provider access)", () => {
    beforeEach(async () => {
      // Alice adds a record
      await store.connect(alice).addRecord(DocumentType.LAB_REPORT, "Lab 1", "cid-v1", "meta-v1");
      // Alice grants PROVIDER_WRITE to provider for all records (recordIds = [])
      await ac.connect(alice).grantAccess(provider.address, AccessTier.PROVIDER_WRITE, 0, []);
    });

    it("authorised provider can update patient record", async () => {
      await expect(
        store.connect(provider).updateRecord(alice.address, 0, "cid-provider-v2", "meta-v2")
      )
        .to.emit(store, "RecordUpdated")
        .withArgs(alice.address, 0, 2, "cid-provider-v2");
    });

    it("unauthorised address cannot update patient record", async () => {
      await expect(
        store.connect(bob).updateRecord(alice.address, 0, "cid-hack", "meta-hack")
      ).to.be.revertedWith("HealthRecordStore: caller lacks PROVIDER_WRITE access");
    });

    it("READ-only grant is insufficient for updateRecord", async () => {
      await ac.connect(alice).grantAccess(bob.address, AccessTier.RECORD_READ, 0, []);
      await expect(
        store.connect(bob).updateRecord(alice.address, 0, "cid-hack", "meta-hack")
      ).to.be.revertedWith("HealthRecordStore: caller lacks PROVIDER_WRITE access");
    });
  });

  // ---------------------------------------------------------------------------
  // setVersionStatus
  // ---------------------------------------------------------------------------
  describe("setVersionStatus", () => {
    beforeEach(async () => {
      await store.connect(alice).addRecord(DocumentType.LAB_REPORT, "Lab 1", "cid-v1", "meta-v1");
    });

    it("owner archives a version", async () => {
      await expect(store.connect(alice).setVersionStatus(alice.address, 0, 1, RecordStatus.ARCHIVED))
        .to.emit(store, "RecordStatusChanged")
        .withArgs(alice.address, 0, 1, RecordStatus.ARCHIVED);

      const [, , , , status] = await store.getVersion(alice.address, 0, 1);
      expect(status).to.equal(RecordStatus.ARCHIVED);
    });

    it("owner soft-deletes a version", async () => {
      await store.connect(alice).setVersionStatus(alice.address, 0, 1, RecordStatus.DELETED);
      const [, , , , status] = await store.getVersion(alice.address, 0, 1);
      expect(status).to.equal(RecordStatus.DELETED);
    });

    it("unauthorised address cannot set version status", async () => {
      await expect(
        store.connect(bob).setVersionStatus(alice.address, 0, 1, RecordStatus.ARCHIVED)
      ).to.be.revertedWith("HealthRecordStore: caller lacks PROVIDER_WRITE access");
    });
  });

  // ---------------------------------------------------------------------------
  // Audit log wiring
  // ---------------------------------------------------------------------------
  describe("automatic audit log", () => {
    it("addRecord creates an on-chain access log entry", async () => {
      await store.connect(alice).addRecord(DocumentType.LAB_REPORT, "Lab 1", "cid1", "meta1");
      const logs = await ac.getAccessLogs(alice.address);
      expect(logs.length).to.be.greaterThan(0);
      expect(logs[0].action).to.equal("ADD_RECORD");
    });

    it("updateRecord creates an on-chain access log entry", async () => {
      await store.connect(alice).addRecord(DocumentType.LAB_REPORT, "Lab 1", "cid1", "meta1");
      await store.connect(alice).updateRecord(alice.address, 0, "cid2", "meta2");
      const logs = await ac.getAccessLogs(alice.address);
      const actions = logs.map((l: any) => l.action);
      expect(actions).to.include("UPDATE_RECORD");
    });
  });
});
