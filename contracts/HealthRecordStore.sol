// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./AccessController.sol";

/// @title HealthRecordStore
/// @notice Versioned, typed document storage. Each record is identified by
///         (owner address, recordId) and supports unlimited versions.
/// @dev Integrated with AccessController for on-chain permission enforcement.
///      Owners add records themselves; authorised providers can update records
///      (add new versions) on behalf of a patient if granted PROVIDER_WRITE.
///      All writes automatically emit an immutable audit log entry via
///      AccessController.logAccess — no manual frontend call needed.
contract HealthRecordStore {

    // -------------------------------------------------------------------------
    // Enums
    // -------------------------------------------------------------------------

    enum DocumentType {
        // --- Medical ---
        LAB_REPORT,          // 0
        PRESCRIPTION,        // 1
        IMAGING,             // 2
        DISCHARGE_SUMMARY,   // 3
        VACCINATION,         // 4
        // --- General vault ---
        INSURANCE_POLICY,    // 5
        LEGAL_CONTRACT,      // 6
        IDENTITY_DOCUMENT,   // 7
        FINANCIAL_RECORD,    // 8
        PROPERTY_DOCUMENT,   // 9
        ACADEMIC_CREDENTIAL, // 10
        OTHER                // 11
    }

    enum RecordStatus {
        ACTIVE,
        ARCHIVED,
        DELETED
    }

    // -------------------------------------------------------------------------
    // Data structures
    // -------------------------------------------------------------------------

    struct RecordVersion {
        string  cid;
        string  metadataHash;
        uint256 timestamp;
        address uploadedBy;
        RecordStatus status;
    }

    struct RecordHead {
        DocumentType docType;
        string   title;
        uint256  latestVersion;
        uint256  createdAt;
        bool     exists;
    }

    // -------------------------------------------------------------------------
    // State
    // -------------------------------------------------------------------------

    AccessController private immutable accessController;

    /// owner → recordId → RecordHead
    mapping(address => mapping(uint256 => RecordHead)) private recordHeads;
    /// owner → recordId → version → RecordVersion
    mapping(address => mapping(uint256 => mapping(uint256 => RecordVersion))) private versions;
    /// owner → total record count (also used as next recordId)
    mapping(address => uint256) private recordCounts;

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    event RecordAdded(
        address indexed owner,
        uint256 indexed recordId,
        DocumentType docType,
        string cid
    );
    event RecordUpdated(
        address indexed owner,
        uint256 indexed recordId,
        uint256 newVersion,
        string cid
    );
    event RecordStatusChanged(
        address indexed owner,
        uint256 indexed recordId,
        uint256 version,
        RecordStatus newStatus
    );

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    /// @param _accessController Address of the deployed AccessController contract.
    constructor(address _accessController) {
        require(_accessController != address(0), "HealthRecordStore: zero address");
        accessController = AccessController(_accessController);
    }

    // -------------------------------------------------------------------------
    // Internal helpers
    // -------------------------------------------------------------------------

    /// @dev Revert if msg.sender is neither the patient nor holds PROVIDER_WRITE.
    function _requireWriteAccess(address patient, uint256 recordId) internal view {
        if (msg.sender == patient) return; // owner always allowed
        (bool allowed, AccessController.AccessTier tier) =
            accessController.checkAccess(patient, msg.sender, recordId);
        require(
            allowed && tier == AccessController.AccessTier.PROVIDER_WRITE,
            "HealthRecordStore: caller lacks PROVIDER_WRITE access"
        );
    }

    /// @dev Log an access event immutably via AccessController.
    function _log(address patient, uint256 recordId, uint256 version, string memory action) internal {
        // Use try/catch so a logging failure never blocks the main operation.
        try accessController.logAccess(patient, recordId, version, action) {}
        catch {}
    }

    // -------------------------------------------------------------------------
    // Write functions
    // -------------------------------------------------------------------------

    /// @notice Add a brand-new record (version 1). Only the owner can call this.
    function addRecord(
        DocumentType    docType,
        string calldata title,
        string calldata cid,
        string calldata metadataHash
    ) external {
        uint256 id = recordCounts[msg.sender];
        recordHeads[msg.sender][id] = RecordHead({
            docType:       docType,
            title:         title,
            latestVersion: 1,
            createdAt:     block.timestamp,
            exists:        true
        });
        versions[msg.sender][id][1] = RecordVersion({
            cid:          cid,
            metadataHash: metadataHash,
            timestamp:    block.timestamp,
            uploadedBy:   msg.sender,
            status:       RecordStatus.ACTIVE
        });
        recordCounts[msg.sender]++;
        emit RecordAdded(msg.sender, id, docType, cid);
        _log(msg.sender, id, 1, "ADD_RECORD");
    }

    /// @notice Add a new version to an existing record.
    /// @param patient   The owner of the record.
    /// @param recordId  The record to update.
    /// @dev Caller must be the patient OR hold PROVIDER_WRITE in AccessController.
    ///      An immutable audit log entry is created automatically on-chain.
    function updateRecord(
        address patient,
        uint256 recordId,
        string calldata newCid,
        string calldata newMetadataHash
    ) external {
        require(
            recordHeads[patient][recordId].exists,
            "HealthRecordStore: record does not exist"
        );
        _requireWriteAccess(patient, recordId);

        uint256 newVersion = recordHeads[patient][recordId].latestVersion + 1;
        recordHeads[patient][recordId].latestVersion = newVersion;
        versions[patient][recordId][newVersion] = RecordVersion({
            cid:          newCid,
            metadataHash: newMetadataHash,
            timestamp:    block.timestamp,
            uploadedBy:   msg.sender,
            status:       RecordStatus.ACTIVE
        });
        emit RecordUpdated(patient, recordId, newVersion, newCid);
        _log(patient, recordId, newVersion, "UPDATE_RECORD");
    }

    /// @notice Change the status of a specific version (archive or soft-delete).
    /// @param patient  The owner of the record.
    /// @dev Caller must be the patient OR hold PROVIDER_WRITE.
    function setVersionStatus(
        address      patient,
        uint256      recordId,
        uint256      version,
        RecordStatus newStatus
    ) external {
        require(
            recordHeads[patient][recordId].exists,
            "HealthRecordStore: record does not exist"
        );
        _requireWriteAccess(patient, recordId);
        versions[patient][recordId][version].status = newStatus;
        emit RecordStatusChanged(patient, recordId, version, newStatus);
        _log(patient, recordId, version, "SET_STATUS");
    }

    // -------------------------------------------------------------------------
    // View functions
    // -------------------------------------------------------------------------

    function getLatestRecord(address owner, uint256 recordId)
        external
        view
        returns (
            string memory cid,
            string memory metadataHash,
            uint256       timestamp,
            address       uploadedBy
        )
    {
        uint256 v = recordHeads[owner][recordId].latestVersion;
        RecordVersion storage rv = versions[owner][recordId][v];
        return (rv.cid, rv.metadataHash, rv.timestamp, rv.uploadedBy);
    }

    function getVersion(
        address owner,
        uint256 recordId,
        uint256 version
    )
        external
        view
        returns (
            string memory   cid,
            string memory   metadataHash,
            uint256         timestamp,
            address         uploadedBy,
            RecordStatus    status
        )
    {
        RecordVersion storage rv = versions[owner][recordId][version];
        return (rv.cid, rv.metadataHash, rv.timestamp, rv.uploadedBy, rv.status);
    }

    function getRecordHead(address owner, uint256 recordId)
        external
        view
        returns (
            DocumentType docType,
            string memory title,
            uint256 latestVersion,
            uint256 createdAt,
            bool    exists
        )
    {
        RecordHead storage h = recordHeads[owner][recordId];
        return (h.docType, h.title, h.latestVersion, h.createdAt, h.exists);
    }

    function getRecordCount(address owner) external view returns (uint256) {
        return recordCounts[owner];
    }

    /// @notice Returns the address of the wired AccessController.
    function getAccessController() external view returns (address) {
        return address(accessController);
    }
}
