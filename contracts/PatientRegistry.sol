// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title PatientRegistry
/// @notice Manages owner identity, registration, and public emergency/trusted profile.
contract PatientRegistry {

    // -------------------------------------------------------------------------
    // Data structures
    // -------------------------------------------------------------------------

    struct PatientProfile {
        bool   isRegistered;
        string name;
        /// @dev emergencyIpfsHash: PUBLIC summary card on IPFS (NOT encrypted).
        ///      Blood type, allergies, current meds, or attorney/executor contact.
        string emergencyIpfsHash;
        address[] trustedParties;
        uint256 registeredAt;
    }

    // -------------------------------------------------------------------------
    // State
    // -------------------------------------------------------------------------

    mapping(address => PatientProfile) private profiles;
    /// @dev Quick lookup to prevent duplicate trusted parties without looping.
    mapping(address => mapping(address => bool)) private isTrustedParty;
    address public admin;

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    event PatientRegistered(address indexed patient, string name, uint256 timestamp);
    event EmergencyCardUpdated(address indexed patient, string ipfsHash);
    event TrustedPartyAdded(address indexed patient, address indexed party);
    event TrustedPartyRemoved(address indexed patient, address indexed party);

    // -------------------------------------------------------------------------
    // Modifiers
    // -------------------------------------------------------------------------

    modifier onlyAdmin() {
        require(msg.sender == admin, "PatientRegistry: not admin");
        _;
    }

    modifier onlyRegistered() {
        require(profiles[msg.sender].isRegistered, "PatientRegistry: not registered");
        _;
    }

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor() {
        admin = msg.sender;
    }

    // -------------------------------------------------------------------------
    // Registration
    // -------------------------------------------------------------------------

    function register(string calldata name) external {
        require(!profiles[msg.sender].isRegistered, "PatientRegistry: already registered");
        profiles[msg.sender].isRegistered = true;
        profiles[msg.sender].name         = name;
        profiles[msg.sender].registeredAt = block.timestamp;
        emit PatientRegistered(msg.sender, name, block.timestamp);
    }

    // -------------------------------------------------------------------------
    // Emergency / Public profile card
    // -------------------------------------------------------------------------

    function updateEmergencyCard(string calldata ipfsHash) external onlyRegistered {
        profiles[msg.sender].emergencyIpfsHash = ipfsHash;
        emit EmergencyCardUpdated(msg.sender, ipfsHash);
    }

    // -------------------------------------------------------------------------
    // Trusted parties management
    // -------------------------------------------------------------------------

    /// @notice Add a trusted party. Reverts if already added (no duplicates).
    function addTrustedParty(address party) external onlyRegistered {
        require(party != address(0), "PatientRegistry: zero address");
        require(party != msg.sender,  "PatientRegistry: cannot add self");
        require(
            !isTrustedParty[msg.sender][party],
            "PatientRegistry: already a trusted party"
        );
        profiles[msg.sender].trustedParties.push(party);
        isTrustedParty[msg.sender][party] = true;
        emit TrustedPartyAdded(msg.sender, party);
    }

    /// @notice Remove a trusted party by index (swap-and-pop).
    function removeTrustedParty(uint256 index) external onlyRegistered {
        address[] storage parties = profiles[msg.sender].trustedParties;
        require(index < parties.length, "PatientRegistry: index out of bounds");
        address removed = parties[index];
        parties[index] = parties[parties.length - 1];
        parties.pop();
        isTrustedParty[msg.sender][removed] = false;
        emit TrustedPartyRemoved(msg.sender, removed);
    }

    // -------------------------------------------------------------------------
    // Views
    // -------------------------------------------------------------------------

    /// @notice Returns profile details for a patient.
    /// @dev Return variable renamed to `registered` to avoid shadowing isRegistered().
    function getProfile(address patient)
        external
        view
        returns (
            bool   registered,
            string memory name,
            string memory emergencyIpfsHash,
            uint256 registeredAt
        )
    {
        PatientProfile storage p = profiles[patient];
        return (p.isRegistered, p.name, p.emergencyIpfsHash, p.registeredAt);
    }

    function getTrustedParties(address patient)
        external
        view
        returns (address[] memory)
    {
        return profiles[patient].trustedParties;
    }

    function isRegistered(address patient) external view returns (bool) {
        return profiles[patient].isRegistered;
    }

    /// @notice Check if a specific address is a trusted party of a patient.
    function isTrusted(address patient, address party) external view returns (bool) {
        return isTrustedParty[patient][party];
    }
}
