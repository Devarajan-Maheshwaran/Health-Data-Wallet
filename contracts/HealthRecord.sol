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
        mapping(uint256 => mapping(uint256 => Record)) recordHistory;
        mapping(uint256 => uint256) latestVersion;
        mapping(address => bool) authorizedProviders;
        AccessLog[] accessLogs;
    }

    struct Record {
        string recordType;
        string title;
        string ipfsHash;
        uint256 timestamp;
        bool isArchived;
    }

    struct AccessLog{
        uint256 timestamp,
        address accessor,
        uint256 recordId,
        uint256 version
    }

    // Events
    event PatientRegistered(address patientAddress, string name);
    event RecordAdded(address patientAddress, uint256 recordId, string recordType, string ipfsHash);
    event AccessGranted(address patientAddress, address providerAddress);
    event AccessRevoked(address patientAddress, address providerAddress);
    event RecordUpdated(address indexed patientAddress, uint256 indexed recordId, string newIpfsHash);
    event RecordArchived(address indexed patient, uint256 indexed recordId, uint256 version);

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
            isArchived: false
        });

        patients[msg.sender].latestVersion[recordId] = 1;
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

            uint256 newVersion = patients[msg.sender].latestVersion[recordId] + 1;
            
            patients[msg.sender].recordHistory[recordId][newVersion] = Record({
            record.recordType = newRecordType,
            record.title = newTitle,
            record.ipfsHash = newIpfsHash,
            record.timestamp = block.timestamp,
            isArchived: false,

            emit RecordUpdated(msg.sender, recordId, newIpfsHash);
    });

    //get an older version of a record
    function getrecordVersion(
        address patientAddress,
        uint recordId,
        uint256 version
    ) external view onlyAuthorized(patientAddress) returns( atring memory, string memory, string memory, uint256)
    {
        require(recordId < patients[patientAddress].recordCount, "Record ID is invalid");
        require(version > 0 && version <= patients[patientAddress].recordHistory[record][version]);

        Record memory record = patients[patientAddress].recordHistory[recordId][version];

        return(
            record.recordType,
            record.title,
            record.ipfsHash,
            record.timestamp
        );

    //Archiving records
    function archiveRecordVersion(uint256 recordId, uint256 version) external onlyRegistered {
        require(recordId < patients[msg.sender].recordCount, "Invalid Record ID");
        require(version > 0 && version <= patients[msg.sender].latestVersion[recordId], "Invalid Version");
        Record storage record = patients[msg.sender].recordHistory[recordId][version];
        require(!record.isArchived, "Already archived");
        
        record.isArchived = true;
        
        emit RecordArchived(msg.sender, recordId, version);
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
