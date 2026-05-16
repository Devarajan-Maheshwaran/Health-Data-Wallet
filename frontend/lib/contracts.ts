/**
 * contracts.ts
 * ABI definitions + addresses + helper maps for all three MedVault contracts.
 */

export const PATIENT_REGISTRY_ADDRESS =
  (process.env.NEXT_PUBLIC_PATIENT_REGISTRY_ADDRESS ?? '0x0000000000000000000000000000000000000000') as `0x${string}`;

export const HEALTH_RECORD_STORE_ADDRESS =
  (process.env.NEXT_PUBLIC_HEALTH_RECORD_STORE_ADDRESS ?? '0x0000000000000000000000000000000000000000') as `0x${string}`;

export const ACCESS_CONTROLLER_ADDRESS =
  (process.env.NEXT_PUBLIC_ACCESS_CONTROLLER_ADDRESS ?? '0x0000000000000000000000000000000000000000') as `0x${string}`;

// Both PascalCase and camelCase for compatibility
export const CONTRACT_ADDRESSES = {
  patientRegistry:   PATIENT_REGISTRY_ADDRESS,
  healthRecordStore: HEALTH_RECORD_STORE_ADDRESS,
  accessController:  ACCESS_CONTROLLER_ADDRESS,
  PatientRegistry:   PATIENT_REGISTRY_ADDRESS,
  HealthRecordStore: HEALTH_RECORD_STORE_ADDRESS,
  AccessController:  ACCESS_CONTROLLER_ADDRESS,
} as const;

// Array form for use in .map()
export const ACCESS_TIERS = [
  { value: 1, label: 'Read Only' },
  { value: 2, label: 'Full Access' },
  { value: 3, label: 'Emergency Access' },
];

// Numeric constants
export const ACCESS_TIER = {
  NONE:      0,
  READ:      1,
  FULL:      2,
  EMERGENCY: 3,
} as const;

export const DOC_TYPES: Record<number, string> = {
   0: 'Lab Report',
   1: 'Prescription',
   2: 'Medical Imaging',
   3: 'Vaccination Record',
   4: 'Discharge Summary',
   5: 'Insurance Document',
   6: 'Dental Record',
   7: 'Vision Record',
   8: 'Mental Health Note',
   9: 'Surgical Note',
  10: 'Pathology Report',
  11: 'Other',
};

export const PATIENT_REGISTRY_ABI = [
  {
    name: 'register',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'encryptionPubKey', type: 'bytes' },
      { name: 'greenfieldBucket', type: 'string' },
    ],
    outputs: [],
  },
  {
    name: 'isRegistered',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'patient', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'getProfile',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'patient', type: 'address' }],
    outputs: [
      { name: 'encryptionPubKey', type: 'bytes' },
      { name: 'greenfieldBucket', type: 'string' },
      { name: 'registeredAt',     type: 'uint256' },
    ],
  },
  {
    name: 'updateEmergencyCard',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'ipfsHash', type: 'string' }],
    outputs: [],
  },
  {
    name: 'PatientRegistered',
    type: 'event',
    inputs: [
      { name: 'patient',          type: 'address', indexed: true },
      { name: 'greenfieldBucket', type: 'string',  indexed: false },
    ],
  },
] as const;

export const HEALTH_RECORD_STORE_ABI = [
  {
    name: 'addRecord',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'docType',      type: 'uint8'   },
      { name: 'title',        type: 'string'  },
      { name: 'cid',          type: 'string'  },
      { name: 'metadataHash', type: 'bytes32' },
    ],
    outputs: [{ name: 'recordId', type: 'uint256' }],
  },
  {
    name: 'getRecord',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'patient',  type: 'address' },
      { name: 'recordId', type: 'uint256' },
    ],
    outputs: [
      { name: 'docType',      type: 'uint8'   },
      { name: 'title',        type: 'string'  },
      { name: 'cid',          type: 'string'  },
      { name: 'metadataHash', type: 'bytes32' },
      { name: 'timestamp',    type: 'uint256' },
      { name: 'version',      type: 'uint256' },
    ],
  },
  {
    name: 'getRecordCount',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'patient', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'RecordAdded',
    type: 'event',
    inputs: [
      { name: 'patient',   type: 'address', indexed: true  },
      { name: 'recordId',  type: 'uint256', indexed: true  },
      { name: 'docType',   type: 'uint8',   indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
] as const;

export const ACCESS_CONTROLLER_ABI = [
  {
    name: 'grantAccess',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'grantee',          type: 'address'   },
      { name: 'tier',             type: 'uint8'     },
      { name: 'durationSeconds',  type: 'uint256'   },
      { name: 'recordIds',        type: 'uint256[]' },
    ],
    outputs: [],
  },
  {
    name: 'revokeAccess',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'grantee', type: 'address' }],
    outputs: [],
  },
  {
    name: 'hasAccess',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'patient', type: 'address' },
      { name: 'grantee', type: 'address' },
      { name: 'tier',    type: 'uint8'   },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'AccessGranted',
    type: 'event',
    inputs: [
      { name: 'patient', type: 'address', indexed: true },
      { name: 'grantee', type: 'address', indexed: true },
      { name: 'tier',    type: 'uint8',   indexed: false },
    ],
  },
  {
    name: 'AccessRevoked',
    type: 'event',
    inputs: [
      { name: 'patient', type: 'address', indexed: true },
      { name: 'grantee', type: 'address', indexed: true },
    ],
  },
] as const;
