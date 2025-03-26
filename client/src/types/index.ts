export interface HealthRecord {
  id: number;
  recordType: string;
  title: string;
  ipfsHash: string;
  timestamp: number;
}

export interface Provider {
  address: string;
  name: string;
  hasAccess: boolean;
}

export interface TransactionStatus {
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  errorMessage: string | null;
}

// Window type extension for Ethereum
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (eventName: string, callback: (...args: any[]) => void) => void;
      removeListener: (eventName: string, callback: (...args: any[]) => void) => void;
      selectedAddress?: string;
    };
  }
}
