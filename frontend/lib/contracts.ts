// Contract ABIs and addresses — populated after deployment
// Run: npx hardhat deploy --network bscTestnet then fill .env.local

export const CONTRACT_ADDRESSES = {
  PatientRegistry:    process.env.NEXT_PUBLIC_PATIENT_REGISTRY_ADDRESS    as `0x${string}`,
  HealthRecordStore:  process.env.NEXT_PUBLIC_HEALTH_RECORD_STORE_ADDRESS  as `0x${string}`,
  AccessController:   process.env.NEXT_PUBLIC_ACCESS_CONTROLLER_ADDRESS    as `0x${string}`,
};

// Minimal ABIs — only the functions the frontend calls directly
export const PATIENT_REGISTRY_ABI = [
  { name: 'register',           type: 'function', inputs: [{ name: 'name', type: 'string' }],                               outputs: [], stateMutability: 'nonpayable' },
  { name: 'updateEmergencyCard',type: 'function', inputs: [{ name: 'ipfsHash', type: 'string' }],                          outputs: [], stateMutability: 'nonpayable' },
  { name: 'addTrustedParty',    type: 'function', inputs: [{ name: 'party', type: 'address' }],                            outputs: [], stateMutability: 'nonpayable' },
  { name: 'removeTrustedParty', type: 'function', inputs: [{ name: 'index', type: 'uint256' }],                            outputs: [], stateMutability: 'nonpayable' },
  { name: 'getProfile',         type: 'function', inputs: [{ name: 'patient', type: 'address' }],                          outputs: [{ name: 'isRegistered', type: 'bool' }, { name: 'name', type: 'string' }, { name: 'emergencyIpfsHash', type: 'string' }, { name: 'registeredAt', type: 'uint256' }], stateMutability: 'view' },
  { name: 'getTrustedParties',  type: 'function', inputs: [{ name: 'patient', type: 'address' }],                          outputs: [{ type: 'address[]' }], stateMutability: 'view' },
  { name: 'isRegistered',       type: 'function', inputs: [{ name: 'patient', type: 'address' }],                          outputs: [{ type: 'bool' }], stateMutability: 'view' },
] as const;

export const HEALTH_RECORD_STORE_ABI = [
  { name: 'addRecord',        type: 'function', inputs: [{ name: 'docType', type: 'uint8' }, { name: 'title', type: 'string' }, { name: 'cid', type: 'string' }, { name: 'metadataHash', type: 'string' }], outputs: [], stateMutability: 'nonpayable' },
  { name: 'updateRecord',     type: 'function', inputs: [{ name: 'recordId', type: 'uint256' }, { name: 'newCid', type: 'string' }, { name: 'newMetadataHash', type: 'string' }], outputs: [], stateMutability: 'nonpayable' },
  { name: 'setVersionStatus', type: 'function', inputs: [{ name: 'recordId', type: 'uint256' }, { name: 'version', type: 'uint256' }, { name: 'newStatus', type: 'uint8' }], outputs: [], stateMutability: 'nonpayable' },
  { name: 'getLatestRecord',  type: 'function', inputs: [{ name: 'owner', type: 'address' }, { name: 'recordId', type: 'uint256' }], outputs: [{ name: 'cid', type: 'string' }, { name: 'metadataHash', type: 'string' }, { name: 'timestamp', type: 'uint256' }, { name: 'uploadedBy', type: 'address' }], stateMutability: 'view' },
  { name: 'getRecordCount',   type: 'function', inputs: [{ name: 'owner', type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { name: 'getRecordHead',    type: 'function', inputs: [{ name: 'owner', type: 'address' }, { name: 'recordId', type: 'uint256' }], outputs: [{ name: 'docType', type: 'uint8' }, { name: 'title', type: 'string' }, { name: 'latestVersion', type: 'uint256' }, { name: 'createdAt', type: 'uint256' }, { name: 'exists', type: 'bool' }], stateMutability: 'view' },
] as const;

export const ACCESS_CONTROLLER_ABI = [
  { name: 'grantAccess',       type: 'function', inputs: [{ name: 'accessor', type: 'address' }, { name: 'tier', type: 'uint8' }, { name: 'durationSeconds', type: 'uint256' }, { name: 'recordIds', type: 'uint256[]' }], outputs: [], stateMutability: 'nonpayable' },
  { name: 'revokeAccess',      type: 'function', inputs: [{ name: 'accessor', type: 'address' }], outputs: [], stateMutability: 'nonpayable' },
  { name: 'checkAccess',       type: 'function', inputs: [{ name: 'patient', type: 'address' }, { name: 'accessor', type: 'address' }, { name: 'recordId', type: 'uint256' }], outputs: [{ name: 'allowed', type: 'bool' }, { name: 'tier', type: 'uint8' }], stateMutability: 'view' },
  { name: 'logAccess',         type: 'function', inputs: [{ name: 'patient', type: 'address' }, { name: 'recordId', type: 'uint256' }, { name: 'version', type: 'uint256' }, { name: 'action', type: 'string' }], outputs: [], stateMutability: 'nonpayable' },
  { name: 'getAccessLogs',     type: 'function', inputs: [{ name: 'patient', type: 'address' }], outputs: [{ name: '', type: 'tuple[]', components: [{ name: 'accessor', type: 'address' }, { name: 'recordId', type: 'uint256' }, { name: 'version', type: 'uint256' }, { name: 'timestamp', type: 'uint256' }, { name: 'action', type: 'string' }] }], stateMutability: 'view' },
  { name: 'getGrant',          type: 'function', inputs: [{ name: 'patient', type: 'address' }, { name: 'accessor', type: 'address' }], outputs: [{ name: 'tier', type: 'uint8' }, { name: 'grantedAt', type: 'uint256' }, { name: 'expiresAt', type: 'uint256' }, { name: 'active', type: 'bool' }], stateMutability: 'view' },
  { name: 'isActiveAccessor',  type: 'function', inputs: [{ name: 'patient', type: 'address' }, { name: 'accessor', type: 'address' }], outputs: [{ type: 'bool' }], stateMutability: 'view' },
] as const;

export const DOC_TYPES = [
  'Lab Report', 'Prescription', 'Imaging', 'Discharge Summary',
  'Vaccination', 'Insurance Policy', 'Legal Contract',
  'Identity Document', 'Financial Record', 'Property Document',
  'Academic Credential', 'Other',
] as const;

export const ACCESS_TIERS = [
  { value: 0, label: 'Emergency Read', description: 'View public emergency card only' },
  { value: 1, label: 'Record Read',    description: 'Read specific encrypted records' },
  { value: 2, label: 'Full Read',      description: 'Read all records + version history' },
  { value: 3, label: 'Provider Write', description: 'Read + add clinical/legal annotations' },
] as const;
