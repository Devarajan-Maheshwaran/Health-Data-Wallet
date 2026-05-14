// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title PatientRegistry
/// @notice Manages owner identity, registration, and public emergency/trusted profile.
/// @dev Although named "Patient" for the MedVault hackathon demo, this registry is
///      domain-agnostic: any wallet owner can register and designate trusted parties
///      (doctors, attorneys, family members, financial advisors, etc.).
contract PatientRegistry {

    // -------------------------------------------------------------------------
    // Data structures
    // -------------------------------------------------------------------------

    struct PatientProfile {
        bool   isRegistered;
        string name;
        /// @dev emergencyIpfsHash stores the PUBLIC summary card on IPFS (NOT encrypted).
        ///      For medical use: blood type, allergies, current meds.
        ///      For legal use: executor name, attorney contact, key document locations.
        ///      Only put data the owner explicitly wants visible without auth.
        string emergencyIpfsHash;
        /// @dev trustedParties replaces a single-purpose "emergency contact" list.
        ///      Works for doctors, attorneys, family members, or any designate.
        address[] trustedParties;
        uint256 registeredAt;
    }

    // -------------------------------------------------------------------------
    // State
    // -------------------------------------------------------------------------

    mapping(address => PatientProfile) private profiles;
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

    /// @notice Register a new wallet as a patient/owner.
    /// @param name  Display name stored on-chain (not sensitive).
    function register(string calldata name) external {
        require(!profiles[msg.sender].isRegistered, "PatientRegistry: already registered");
        profiles[msg.sender].isRegistered  = true;
        profiles[msg.sender].name          = name;
        profiles[msg.sender].registeredAt  = block.timestamp;
        emit PatientRegistered(msg.sender, name, block.timestamp);
    }

    // -------------------------------------------------------------------------
    // Emergency / Public profile card
    // -------------------------------------------------------------------------

    /// @notice Update the public IPFS card (unencrypted, scannable by anyone).
    /// @param ipfsHash  CID of the JSON card on IPFS / Greenfield public bucket.
    function updateEmergencyCard(string calldata ipfsHash) external onlyRegistered {
        profiles[msg.sender].emergencyIpfsHash = ipfsHash;
        emit EmergencyCardUpdated(msg.sender, ipfsHash);
    }

    // -------------------------------------------------------------------------
    // Trusted parties management
    // -------------------------------------------------------------------------

    /// @notice Add a trusted party (doctor, attorney, family member, etc.).
    function addTrustedParty(address party) external onlyRegistered {
        require(party != address(0), "PatientRegistry: zero address");
        require(party != msg.sender,  "PatientRegistry: cannot add self");
        profiles[msg.sender].trustedParties.push(party);
        emit TrustedPartyAdded(msg.sender, party);
    }

    /// @notice Remove a trusted party by index.
    /// @dev Swap-and-pop to avoid gaps; index must be verified off-chain first.
    function removeTrustedParty(uint256 index) external onlyRegistered {
        address[] storage parties = profiles[msg.sender].trustedParties;
        require(index < parties.length, "PatientRegistry: index out of bounds");
        address removed = parties[index];
        parties[index] = parties[parties.length - 1];
        parties.pop();
        emit TrustedPartyRemoved(msg.sender, removed);
    }

    // -------------------------------------------------------------------------
    // Views
    // -------------------------------------------------------------------------

    function getProfile(address patient)
        external
        view
        returns (
            bool   isRegistered,
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
}
