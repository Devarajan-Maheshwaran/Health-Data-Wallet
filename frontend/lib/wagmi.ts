import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { bsc, bscTestnet, hardhat } from 'wagmi/chains';

// opBNB chain definition (not yet in wagmi's built-in chains)
export const opBNB = {
  id: 204,
  name: 'opBNB',
  nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://opbnb-mainnet-rpc.bnbchain.org'] },
    public: { http: ['https://opbnb-mainnet-rpc.bnbchain.org'] },
  },
  blockExplorers: {
    default: { name: 'opBNBScan', url: 'https://opbnb.bscscan.com' },
  },
} as const;

export const opBNBTestnet = {
  id: 5611,
  name: 'opBNB Testnet',
  nativeCurrency: { name: 'tBNB', symbol: 'tBNB', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://opbnb-testnet-rpc.bnbchain.org'] },
    public: { http: ['https://opbnb-testnet-rpc.bnbchain.org'] },
  },
  blockExplorers: {
    default: { name: 'opBNBScan Testnet', url: 'https://opbnb-testnet.bscscan.com' },
  },
} as const;

export const wagmiConfig = getDefaultConfig({
  appName: 'MedVault',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'medvault-dev',
  chains: [bscTestnet, opBNBTestnet, bsc, opBNB, hardhat],
  ssr: true,
});
