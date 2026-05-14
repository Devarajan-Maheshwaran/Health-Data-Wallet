// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title HealthRecordStore
/// @notice Versioned, typed document storage. Each record is identified by
///         (owner address, recordId) and supports unlimited versions.
/// @dev Domain-agnostic: DocumentType covers medical AND legal/financial/identity
///      documents. The contract only stores CIDs and metadata hashes — actual
///      files live encrypted on BNB Greenfield (or IPFS for fallback).
contract HealthRecordStore {

    // -------------------------------------------------------------------------
    // Enums
    // -------------------------------------------------------------------------

    /// @dev Medical types first (hackathon demo), followed by general vault types.
    ///      Extend OTHER for anything not listed.
    enum DocumentType {
        // --- Medical ---
        LAB_REPORT,        // 0
        PRESCRIPTION,      // 1
        IMAGING,           // 2
        DISCHARGE_SUMMARY, // 3
        VACCINATION,       // 4
        // --- General vault ---
        INSURANCE_POLICY,  // 5
        LEGAL_CONTRACT,    // 6  e.g. NDA, court filing, will
        IDENTITY_DOCUMENT, // 7  e.g. passport, Aadhaar, license
        FINANCIAL_RECORD,  // 8  e.g. tax return, bank statement
        PROPERTY_DOCUMENT, // 9  e.g. deed, lease
        ACADEMIC_CREDENTIAL, // 10 e.g. degree, transcript
        OTHER              // 11
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
        /// @dev CID of the encrypted file on Greenfield or IPFS.
        string  cid;
        /// @dev keccak256 hash of the AI-extracted metadata JSON.
        ///      Full JSON stored off-chain; only the integrity hash lives on-chain.
        string  metadataHash;
        uint256 timestamp;
        /// @dev Who uploaded this version — patient wallet or an authorized provider.
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
    // Write functions
    // -------------------------------------------------------------------------

    /// @notice Add a brand-new record (version 1).
    /// @param docType       Enum value for the document category.
    /// @param title         Human-readable title stored on-chain.
    /// @param cid           Greenfield / IPFS object name of the encrypted file.
    /// @param metadataHash  keccak256 of the AI-extracted metadata JSON.
    function addRecord(
        DocumentType   docType,
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
    }

    /// @notice Add a new version to an existing record.
    /// @dev Can be called by the owner OR an authorized provider
    ///      (caller authorization is enforced in AccessController — frontend
    ///       should check AccessController.checkAccess before calling this).
    function updateRecord(
        uint256 recordId,
        string calldata newCid,
        string calldata newMetadataHash
    ) external {
        require(
            recordHeads[msg.sender][recordId].exists,
            "HealthRecordStore: record does not exist"
        );
        uint256 newVersion = recordHeads[msg.sender][recordId].latestVersion + 1;
        recordHeads[msg.sender][recordId].latestVersion = newVersion;
        versions[msg.sender][recordId][newVersion] = RecordVersion({
            cid:          newCid,
            metadataHash: newMetadataHash,
            timestamp:    block.timestamp,
            uploadedBy:   msg.sender,
            status:       RecordStatus.ACTIVE
        });
        emit RecordUpdated(msg.sender, recordId, newVersion, newCid);
    }

    /// @notice Change the status of a specific version (archive or soft-delete).
    function setVersionStatus(
        uint256    recordId,
        uint256    version,
        RecordStatus newStatus
    ) external {
        require(
            recordHeads[msg.sender][recordId].exists,
            "HealthRecordStore: record does not exist"
        );
        versions[msg.sender][recordId][version].status = newStatus;
        emit RecordStatusChanged(msg.sender, recordId, version, newStatus);
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
}
