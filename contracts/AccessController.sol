// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title AccessController
/// @notice Fine-grained, time-limited, per-record access control with immutable audit log.
/// @dev This is the most critical contract in the system.
///      Key design decisions:
///      - Access is granted BY the owner TO any address (doctor, attorney, auditor, family).
///      - Grants can be scoped to specific record IDs (empty array = all records).
///      - Grants carry a tier (read-only vs write) and an optional expiry.
///      - Every access event is logged immutably on-chain.
///      - The admin can register "verified providers" (doctors, law firms) but
///        the owner decides who gets access — admin cannot override this.
contract AccessController {

    // -------------------------------------------------------------------------
    // Enums
    // -------------------------------------------------------------------------

    /// @dev Tiers are ordered by privilege level (lower index = less access).
    enum AccessTier {
        EMERGENCY_READ,  // 0 — view public emergency card only (no encrypted records)
        RECORD_READ,     // 1 — read specific or all encrypted records
        FULL_READ,       // 2 — read all records + version history + metadata
        PROVIDER_WRITE   // 3 — read + add new versions / clinical/legal annotations
    }

    // -------------------------------------------------------------------------
    // Data structures
    // -------------------------------------------------------------------------

    struct AccessGrant {
        AccessTier tier;
        uint256    grantedAt;
        /// @dev expiresAt == 0 means the grant is permanent until explicitly revoked.
        uint256    expiresAt;
        /// @dev allowedRecordIds: empty array means access to ALL records.
        ///      Populated array restricts to only those specific record IDs.
        uint256[]  allowedRecordIds;
        bool       active;
    }

    struct AccessLog {
        address accessor;
        uint256 recordId;
        uint256 version;
        uint256 timestamp;
        /// @dev Free-form action string: "READ", "DOWNLOAD", "ADD_NOTE", "SHARE", etc.
        string  action;
    }

    // -------------------------------------------------------------------------
    // State
    // -------------------------------------------------------------------------

    /// patient/owner → accessor → grant
    mapping(address => mapping(address => AccessGrant)) private grants;
    /// patient/owner → immutable access log array
    mapping(address => AccessLog[]) private accessLogs;
    /// verified providers registered by admin (optional — owner can grant to any address)
    mapping(address => bool) public registeredProviders;
    address public admin;

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    event AccessGranted(
        address indexed patient,
        address indexed accessor,
        AccessTier      tier,
        uint256         expiresAt
    );
    event AccessRevoked(
        address indexed patient,
        address indexed accessor
    );
    event AccessLogged(
        address indexed patient,
        address indexed accessor,
        uint256         recordId,
        string          action
    );
    event ProviderRegistered(address indexed provider);

    // -------------------------------------------------------------------------
    // Modifiers
    // -------------------------------------------------------------------------

    modifier onlyAdmin() {
        require(msg.sender == admin, "AccessController: not admin");
        _;
    }

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor() {
        admin = msg.sender;
    }

    // -------------------------------------------------------------------------
    // Admin functions
    // -------------------------------------------------------------------------

    /// @notice Register a healthcare provider / law firm / verified accessor.
    /// @dev Registration does NOT grant them access to any patient — it only
    ///      marks them as a verified entity that patients can discover and choose.
    function registerProvider(address provider) external onlyAdmin {
        require(provider != address(0), "AccessController: zero address");
        registeredProviders[provider] = true;
        emit ProviderRegistered(provider);
    }

    // -------------------------------------------------------------------------
    // Grant / Revoke (called by the data owner)
    // -------------------------------------------------------------------------

    /// @notice Grant access to any address for a configurable tier and duration.
    /// @param accessor        The address receiving access (doctor, attorney, auditor).
    /// @param tier            Privilege level (see AccessTier enum).
    /// @param durationSeconds How long the grant is valid. 0 = permanent.
    /// @param recordIds       Specific record IDs to allow. Empty = all records.
    function grantAccess(
        address          accessor,
        AccessTier       tier,
        uint256          durationSeconds,
        uint256[] calldata recordIds
    ) external {
        require(accessor != address(0), "AccessController: zero address");
        require(accessor != msg.sender,  "AccessController: cannot grant to self");
        uint256 expiry = durationSeconds == 0
            ? 0
            : block.timestamp + durationSeconds;
        grants[msg.sender][accessor] = AccessGrant({
            tier:             tier,
            grantedAt:        block.timestamp,
            expiresAt:        expiry,
            allowedRecordIds: recordIds,
            active:           true
        });
        emit AccessGranted(msg.sender, accessor, tier, expiry);
    }

    /// @notice Revoke an existing grant immediately.
    function revokeAccess(address accessor) external {
        require(
            grants[msg.sender][accessor].active,
            "AccessController: no active grant to revoke"
        );
        grants[msg.sender][accessor].active = false;
        emit AccessRevoked(msg.sender, accessor);
    }

    // -------------------------------------------------------------------------
    // Access check (read-only, called by frontend before fetching files)
    // -------------------------------------------------------------------------

    /// @notice Check whether `accessor` is currently allowed to access `recordId`
    ///         belonging to `patient`.
    /// @return allowed  True if access is currently valid.
    /// @return tier     The access tier granted (only meaningful when allowed == true).
    function checkAccess(
        address patient,
        address accessor,
        uint256 recordId
    ) external view returns (bool allowed, AccessTier tier) {
        AccessGrant storage g = grants[patient][accessor];

        // Check grant is active
        if (!g.active) return (false, AccessTier.EMERGENCY_READ);

        // Check expiry
        if (g.expiresAt != 0 && block.timestamp > g.expiresAt)
            return (false, AccessTier.EMERGENCY_READ);

        // Check record-level restriction
        if (g.allowedRecordIds.length > 0) {
            bool found = false;
            for (uint256 i = 0; i < g.allowedRecordIds.length; i++) {
                if (g.allowedRecordIds[i] == recordId) {
                    found = true;
                    break;
                }
            }
            if (!found) return (false, AccessTier.EMERGENCY_READ);
        }

        return (true, g.tier);
    }

    // -------------------------------------------------------------------------
    // Audit log (called by frontend / provider after accessing a record)
    // -------------------------------------------------------------------------

    /// @notice Append an access event to the patient's immutable audit log.
    /// @param patient   The owner whose record was accessed.
    /// @param recordId  Which record was accessed.
    /// @param version   Which version was accessed.
    /// @param action    String descriptor: "READ", "DOWNLOAD", "ADD_NOTE", etc.
    function logAccess(
        address patient,
        uint256 recordId,
        uint256 version,
        string calldata action
    ) external {
        // Allow patient to log their own actions too (e.g., self-download)
        require(
            msg.sender == patient || grants[patient][msg.sender].active,
            "AccessController: not authorized to log for this patient"
        );
        accessLogs[patient].push(AccessLog({
            accessor:  msg.sender,
            recordId:  recordId,
            version:   version,
            timestamp: block.timestamp,
            action:    action
        }));
        emit AccessLogged(patient, msg.sender, recordId, action);
    }

    // -------------------------------------------------------------------------
    // Views
    // -------------------------------------------------------------------------

    function getAccessLogs(address patient)
        external
        view
        returns (AccessLog[] memory)
    {
        return accessLogs[patient];
    }

    function getGrant(
        address patient,
        address accessor
    )
        external
        view
        returns (
            AccessTier tier,
            uint256    grantedAt,
            uint256    expiresAt,
            bool       active
        )
    {
        AccessGrant storage g = grants[patient][accessor];
        return (g.tier, g.grantedAt, g.expiresAt, g.active);
    }

    /// @notice Returns true if a grant exists and has not yet expired.
    ///         Does NOT check record-level restrictions.
    function isActiveAccessor(address patient, address accessor)
        external
        view
        returns (bool)
    {
        AccessGrant storage g = grants[patient][accessor];
        if (!g.active) return false;
        if (g.expiresAt != 0 && block.timestamp > g.expiresAt) return false;
        return true;
    }
}
