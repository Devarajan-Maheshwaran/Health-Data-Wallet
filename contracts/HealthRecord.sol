// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

//contract for maintaing healthrecords
contract HealthRecord {
    struct Patient {
        bool isRegistered;
        string name;
        uint256 recordCount;
        mapping(uint256 => Record) records;
        mapping(address => bool) authorizedProviders;
    }

    struct Record {
        string recordType;
        string title;
        string ipfsHash;
        uint256 timestamp;
        bool exists;
    }

    // Events
    event PatientRegistered(address patientAddress, string name);
    event RecordAdded(address patientAddress, uint256 recordId, string recordType, string ipfsHash);
    event AccessGranted(address patientAddress, address providerAddress);
    event AccessRevoked(address patientAddress, address providerAddress);

    // State variables
    mapping(address => Patient) private patients;
    mapping(address => bool) private providers;
    
    // Modifiers
    modifier onlyRegistered() {
        require(patients[msg.sender].isRegistered, "Patient not registered");
        _;
    }

    modifier onlyAuthorized(address patientAddress) {
        require(
            patients[patientAddress].isRegistered &&
            (patientAddress == msg.sender || patients[patientAddress].authorizedProviders[msg.sender]),
            "Not authorized to access patient data"
        );
        _;
    }

    modifier onlyOwner(){
        require(msg.sender == owner, "Only owners can use this function");
        _;
    }

   //registering a new patient
    function registerPatient(string memory name) external {
        require(!patients[msg.sender].isRegistered, "Patient already registered");
        
        patients[msg.sender].isRegistered = true;
        patients[msg.sender].name = name;
        
        emit PatientRegistered(msg.sender, name);
    }

    /**
     * @dev Register a new healthcare provider
     */
    function registerProvider() external onlyOwner {
        providers[msg.sender] = true;
    }

    /**
     * @dev Add a new health record for a patient
     * @param recordType Type of medical record
     * @param title Title of the record
     * @param ipfsHash IPFS hash of the encrypted record data
     */
    function addRecord(string memory recordType, string memory title, string memory ipfsHash) external onlyRegistered {
        uint256 recordId = patients[msg.sender].recordCount;
        
        patients[msg.sender].records[recordId] = Record({
            recordType: recordType,
            title: title,
            ipfsHash: ipfsHash,
            timestamp: block.timestamp,
            exists: true
        });
        
        patients[msg.sender].recordCount++;
        
        emit RecordAdded(msg.sender, recordId, recordType, ipfsHash);
    }

    /**
     * @dev Grant access to a healthcare provider
     * @param providerAddress Address of the healthcare provider to authorize
     */
    function grantAccess(address providerAddress) external onlyRegistered {
        require(providers[providerAddress], "Address is not a registered provider");
        patients[msg.sender].authorizedProviders[providerAddress] = true;
        
        emit AccessGranted(msg.sender, providerAddress);
    }

    /**
     * @dev Revoke access from a healthcare provider
     * @param providerAddress Address of the healthcare provider to revoke
     */
    function revokeAccess(address providerAddress) external onlyRegistered {
        require(patients[msg.sender].authorizedProviders[providerAddress], "Provider not authorized");
        patients[msg.sender].authorizedProviders[providerAddress] = false;
        
        emit AccessRevoked(msg.sender, providerAddress);
    }

    /**
     * @dev Check if a provider has access to a patient's records
     * @param patientAddress Address of the patient
     * @param providerAddress Address of the healthcare provider
     * @return bool indicating if provider has access
     */
    function checkAccess(address patientAddress, address providerAddress) external view returns (bool) {
        return patients[patientAddress].authorizedProviders[providerAddress];
    }

    /**
     * @dev Get patient record count
     * @param patientAddress Address of the patient
     * @return recordCount Number of records for the patient
     */
    function getRecordCount(address patientAddress) external view onlyAuthorized(patientAddress) returns (uint256) {
        return patients[patientAddress].recordCount;
    }

    /**
     * @dev Get a specific patient record
     * @param patientAddress Address of the patient
     * @param recordId ID of the record to retrieve
     * @return recordType, title, ipfsHash, timestamp
     */
    function getRecord(address patientAddress, uint256 recordId) 
        external 
        view 
        onlyAuthorized(patientAddress) 
        returns (string memory, string memory, string memory, uint256) 
    {
        require(recordId < patients[patientAddress].recordCount, "Record does not exist");
        Record memory record = patients[patientAddress].records[recordId];
        require(record.exists, "Record does not exist");
        
        return (
            record.recordType,
            record.title,
            record.ipfsHash,
            record.timestamp
        );
    }

    /**
     * @dev Check if a patient is registered
     * @param patientAddress Address of the patient
     * @return bool indicating if patient is registered
     */
    function isPatientRegistered(address patientAddress) external view returns (bool) {
        return patients[patientAddress].isRegistered;
    }

    /**
     * @dev Get patient name
     * @param patientAddress Address of the patient
     * @return name Name of the patient
     */
    function getPatientName(address patientAddress) external view onlyAuthorized(patientAddress) returns (string memory) {
        return patients[patientAddress].name;
    }
}
