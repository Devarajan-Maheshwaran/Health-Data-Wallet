// Blockchain networks configuration
export const SUPPORTED_NETWORKS = {
  POLYGON_MUMBAI: {
    chainId: '0x13881',
    chainName: 'Polygon Mumbai',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18
    },
    rpcUrls: ['https://rpc-mumbai.maticvigil.com'],
    blockExplorerUrls: ['https://mumbai.polygonscan.com']
  },
  SEPOLIA: {
    chainId: '0xaa36a7',
    chainName: 'Sepolia',
    nativeCurrency: {
      name: 'Sepolia ETH',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrls: ['https://sepolia.infura.io/v3/'],
    blockExplorerUrls: ['https://sepolia.etherscan.io']
  }
};

// Default network for the application
export const DEFAULT_NETWORK = SUPPORTED_NETWORKS.POLYGON_MUMBAI;

// Contract addresses by network
export const CONTRACT_ADDRESSES = {
  HEALTH_RECORD: '0x123456789abcdef123456789abcdef123456789a' // Replace with actual deployed contract address
};

// Navigation items for the sidebar
export const NAV_ITEMS = [
  {
    title: 'Dashboard',
    href: '/',
    icon: 'dashboard'
  },
  {
    title: 'Health Records',
    href: '/records',
    icon: 'folder_shared'
  },
  {
    title: 'Upload Data',
    href: '/upload',
    icon: 'cloud_upload'
  },
  {
    title: 'Manage Access',
    href: '/access',
    icon: 'security'
  },
  {
    title: 'Doctor Dashboard',
    href: '/doctor',
    icon: 'medical_services',
    roleRequired: 'doctor'
  }
];

// Health record types
export const RECORD_TYPES = [
  { 
    value: 'medical_history', 
    label: 'Medical History',
    icon: 'history' 
  },
  { 
    value: 'lab_results', 
    label: 'Laboratory Results',
    icon: 'science' 
  },
  { 
    value: 'prescriptions', 
    label: 'Prescriptions',
    icon: 'receipt' 
  },
  { 
    value: 'imaging', 
    label: 'Imaging (X-rays, MRIs, etc.)',
    icon: 'image' 
  },
  { 
    value: 'allergies', 
    label: 'Allergies',
    icon: 'warning' 
  },
  { 
    value: 'immunizations', 
    label: 'Immunizations',
    icon: 'vaccines' 
  },
  { 
    value: 'vital_signs', 
    label: 'Vital Signs',
    icon: 'monitor_heart' 
  },
  { 
    value: 'emergency', 
    label: 'Emergency Information',
    icon: 'emergency' 
  }
];

// Access status definitions
export const ACCESS_STATUS = {
  ACTIVE: 'Active',
  REVOKED: 'Revoked',
  PENDING: 'Pending'
};

// Activity types for tracking
export const ACTIVITY_TYPES = {
  UPLOAD: 'UPLOAD',
  ACCESS_GRANTED: 'ACCESS_GRANTED',
  ACCESS_REVOKED: 'ACCESS_REVOKED',
  RECORD_ACCESSED: 'RECORD_ACCESSED',
  EMERGENCY_ACCESS: 'EMERGENCY_ACCESS'
};

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    USER: '/api/auth/user'
  },
  RECORDS: {
    LIST: '/api/records',
    CREATE: '/api/records',
    GET: (id) => `/api/records/${id}`,
    DELETE: (id) => `/api/records/${id}`,
    TYPES: '/api/records/types'
  },
  ACCESS: {
    LIST: '/api/access',
    GRANT: '/api/access/grant',
    REVOKE: (id) => `/api/access/${id}/revoke`,
    PROVIDERS: '/api/access/providers'
  },
  EMERGENCY: {
    GENERATE: '/api/emergency/generate',
    VERIFY: '/api/emergency/verify',
    DATA: (token) => `/api/emergency/data/${token}`
  },
  IPFS: {
    UPLOAD: '/api/ipfs/upload',
    GET: (hash) => `/api/ipfs/${hash}`
  }
};