// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

//Contract for maintaing healthrecords
contract HealthRecord {

    address public admin;
    constructor() {
        admin = msg.sender;
    }

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
    }

    // Events
    event PatientRegistered(address patientAddress, string name);
    event RecordAdded(address patientAddress, uint256 recordId, string recordType, string ipfsHash);
    event AccessGranted(address patientAddress, address providerAddress);
    event AccessRevoked(address patientAddress, address providerAddress);

    //Mappings
    mapping(address => Patient) private patients;
    mapping(address => bool) private providers;
    
    // Modifiers
    modifier onlyAdmin(){
        require(msg.sender == admin, "only System Admins are allowed");
    }

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

    modifier onlyAdmin(){
        require(msg.sender == admin, "Only admins can use this function");
        _;
    }

   //Registering a new patient
    function registerPatient(string memory name) external {
        require(!patients[msg.sender].isRegistered, "Patient already registered");
        
        patients[msg.sender].isRegistered = true;
        patients[msg.sender].name = name;
        
        emit PatientRegistered(msg.sender, name);
    }

    //Registering a new healthcare provider
    function registerProvider() external onlyAdmin {
        providers[msg.sender] = true;
    }

    //adding new record for a patient
    function addRecord(string memory recordType, string memory title, string memory ipfsHash) external onlyRegistered {
        uint256 recordId = patients[msg.sender].recordCount;
        
        patients[msg.sender].records[recordId] = Record({
            recordType: recordType,
            title: title,
            ipfsHash: ipfsHash,
            timestamp: block.timestamp,
        });
        
        patients[msg.sender].recordCount++;
        
        emit RecordAdded(msg.sender, recordId, recordType, ipfsHash);
    }

    //updation of records for patients
    function updateRecord(
            uint256 recordId,
            string memory newRecordType,
            string memory newTitle,
            string memory newIpfsHash
    ) external onlyRegistered {
            require(recordId < patients[msg.sender].recordCount, "Record does not exist");

            Record storage record = patients[msg.sender].records[recordId];
            record.recordType = newRecordType;
            record.title = newTitle;
            record.ipfsHash = newIpfsHash;
            record.timestamp = block.timestamp;
    }


    //grant access to a healthprovider
    function grantAccess(address providerAddress) external onlyRegistered {
        require(providers[providerAddress], "Address is not a registered provider");
        patients[msg.sender].authorizedProviders[providerAddress] = true;
        
        emit AccessGranted(msg.sender, providerAddress);
    }

    //revoke access from healthprovider
    function revokeAccess(address providerAddress) external onlyRegistered {
        require(patients[msg.sender].authorizedProviders[providerAddress], "Provider not authorized");
        patients[msg.sender].authorizedProviders[providerAddress] = false;
        
        emit AccessRevoked(msg.sender, providerAddress);
    }

    //check if a provider has access to a patient's record
    function checkAccess(address patientAddress, address providerAddress) external view returns (bool) {
        return patients[patientAddress].authorizedProviders[providerAddress];
    }

    //get patients record count
    function getRecordCount(address patientAddress) external view onlyAuthorized(patientAddress) returns (uint256) {
        return patients[patientAddress].recordCount;
    }

    //get a specific record for a patient
    function getRecord(address patientAddress, uint256 recordId) 
        external 
        view 
        onlyAuthorized(patientAddress) 
        returns (string memory, string memory, string memory, uint256) 
    {
        require(recordId < patients[patientAddress].recordCount, "Record does not exist");
        Record memory record = patients[patientAddress].records[recordId];
        
        return (
            record.recordType,
            record.title,
            record.ipfsHash,
            record.timestamp
        );
    }

    //check if a patient is registered
    function isPatientRegistered(address patientAddress) external view returns (bool) {
        return patients[patientAddress].isRegistered;
    }

    //get name of the patient
    function getPatientName(address patientAddress) external view onlyAuthorized(patientAddress) returns (string memory) {
        return patients[patientAddress].name;
    }
}
