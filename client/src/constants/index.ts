// Network configurations
export const SUPPORTED_NETWORKS = {
  POLYGON_MUMBAI: {
    chainId: '0x13881',
    chainName: 'Polygon Mumbai Testnet',
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
    chainName: 'Sepolia Testnet',
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrls: ['https://sepolia.infura.io/v3/'],
    blockExplorerUrls: ['https://sepolia.etherscan.io']
  }
};

// Default network - we're using Polygon Mumbai for lower gas fees
export const DEFAULT_NETWORK = SUPPORTED_NETWORKS.POLYGON_MUMBAI;

// Contract addresses
export const CONTRACT_ADDRESSES = {
  HEALTH_RECORD: import.meta.env.VITE_HEALTH_RECORD_CONTRACT_ADDRESS || '0x123456789abcdef123456789abcdef123456789a' // This will be replaced with the deployed contract address
};

// Navigation items
export const NAV_ITEMS = [
  { 
    name: 'Dashboard', 
    path: '/', 
    icon: 'dashboard' 
  },
  { 
    name: 'My Health Records', 
    path: '/records', 
    icon: 'medical_information' 
  },
  { 
    name: 'Manage Access', 
    path: '/access', 
    icon: 'share' 
  },
  { 
    name: 'Upload Data', 
    path: '/upload', 
    icon: 'upload_file' 
  },
  { 
    name: 'Settings', 
    path: '/settings', 
    icon: 'settings' 
  }
];

// Record types
export const RECORD_TYPES = [
  'Vaccination Record',
  'Lab Test',
  'Doctor\'s Note',
  'Prescription',
  'Medical Imaging'
];

// Access status types
export const ACCESS_STATUS = {
  ACTIVE: 'Active',
  REVOKED: 'Revoked',
  PENDING: 'Pending'
};

// Activity types
export const ACTIVITY_TYPES = {
  UPLOAD: 'UPLOAD',
  GRANT_ACCESS: 'GRANT_ACCESS',
  REVOKE_ACCESS: 'REVOKE_ACCESS',
  VIEW_RECORD: 'VIEW_RECORD'
};

// API endpoints
export const API_ENDPOINTS = {
  UPLOAD_TO_IPFS: '/api/ipfs/upload',
  GET_FROM_IPFS: '/api/ipfs/get'
};
