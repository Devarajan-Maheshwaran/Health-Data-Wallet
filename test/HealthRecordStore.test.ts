import { expect } from "chai";
import { ethers } from "hardhat";
import { HealthRecordStore } from "../typechain-types";

describe("HealthRecordStore", () => {
  let store: HealthRecordStore;
  let alice: any, bob: any;

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

  const RecordStatus = { ACTIVE: 0, ARCHIVED: 1, DELETED: 2 };

  beforeEach(async () => {
    [, alice, bob] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("HealthRecordStore");
    store = await Factory.deploy();
  });

  // ---------------------------------------------------------------------------
  // addRecord
  // ---------------------------------------------------------------------------
  describe("addRecord", () => {
    it("adds a lab report and emits event", async () => {
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

    it("supports all document types including general vault types", async () => {
      for (const [name, typeId] of Object.entries(DocumentType)) {
        await store.connect(alice).addRecord(typeId as number, name, `cid-${typeId}`, `meta-${typeId}`);
      }
      expect(await store.getRecordCount(alice.address)).to.equal(
        Object.keys(DocumentType).length
      );
    });
  });

  // ---------------------------------------------------------------------------
  // updateRecord / versioning
  // ---------------------------------------------------------------------------
  describe("updateRecord", () => {
    beforeEach(async () => {
      await store.connect(alice).addRecord(DocumentType.LAB_REPORT, "Lab 1", "cid-v1", "meta-v1");
    });

    it("creates version 2 and emits event", async () => {
      await expect(store.connect(alice).updateRecord(0, "cid-v2", "meta-v2"))
        .to.emit(store, "RecordUpdated")
        .withArgs(alice.address, 0, 2, "cid-v2");

      const [cid, , ,] = await store.getLatestRecord(alice.address, 0);
      expect(cid).to.equal("cid-v2");
    });

    it("preserves previous versions", async () => {
      await store.connect(alice).updateRecord(0, "cid-v2", "meta-v2");
      const [cid] = await store.getVersion(alice.address, 0, 1);
      expect(cid).to.equal("cid-v1");
    });

    it("reverts on non-existent record", async () => {
      await expect(store.connect(alice).updateRecord(99, "cid", "meta"))
        .to.be.revertedWith("HealthRecordStore: record does not exist");
    });
  });

  // ---------------------------------------------------------------------------
  // setVersionStatus
  // ---------------------------------------------------------------------------
  describe("setVersionStatus", () => {
    beforeEach(async () => {
      await store.connect(alice).addRecord(DocumentType.LAB_REPORT, "Lab 1", "cid-v1", "meta-v1");
    });

    it("archives a version", async () => {
      await expect(store.connect(alice).setVersionStatus(0, 1, RecordStatus.ARCHIVED))
        .to.emit(store, "RecordStatusChanged")
        .withArgs(alice.address, 0, 1, RecordStatus.ARCHIVED);

      const [, , , , status] = await store.getVersion(alice.address, 0, 1);
      expect(status).to.equal(RecordStatus.ARCHIVED);
    });

    it("soft-deletes a version", async () => {
      await store.connect(alice).setVersionStatus(0, 1, RecordStatus.DELETED);
      const [, , , , status] = await store.getVersion(alice.address, 0, 1);
      expect(status).to.equal(RecordStatus.DELETED);
    });
  });
});
