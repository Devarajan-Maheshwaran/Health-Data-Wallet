import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-deploy";
import * as dotenv from "dotenv";

dotenv.config();

const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || "0x" + "0".repeat(64);
const BSC_SCAN_API_KEY = process.env.BSCSCAN_API_KEY || "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },

  namedAccounts: {
    deployer: { default: 0 },
  },

  networks: {
    // Local development
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },

    // BSC Testnet — free BNB faucet at faucet.bnbchain.org
    bscTestnet: {
      url: "https://data-seed-prebsc-1-s1.bnbchain.org:8545",
      chainId: 97,
      gasPrice: 10_000_000_000, // 10 gwei
      accounts: [PRIVATE_KEY],
    },

    // opBNB Testnet — L2, ~0.001 cent per tx in production
    opBNBTestnet: {
      url: "https://opbnb-testnet-rpc.bnbchain.org",
      chainId: 5611,
      gasPrice: 1_000_000, // 0.001 gwei on L2
      accounts: [PRIVATE_KEY],
    },

    // opBNB Mainnet — production target
    opBNB: {
      url: "https://opbnb-mainnet-rpc.bnbchain.org",
      chainId: 204,
      accounts: [PRIVATE_KEY],
    },
  },

  etherscan: {
    apiKey: {
      bscTestnet: BSC_SCAN_API_KEY,
      // opBNB uses the same BscScan key
      opBNBTestnet: BSC_SCAN_API_KEY,
    },
    customChains: [
      {
        network: "opBNBTestnet",
        chainId: 5611,
        urls: {
          apiURL: "https://api-opbnb-testnet.bscscan.com/api",
          browserURL: "https://opbnb-testnet.bscscan.com",
        },
      },
      {
        network: "opBNB",
        chainId: 204,
        urls: {
          apiURL: "https://api-opbnb.bscscan.com/api",
          browserURL: "https://opbnb.bscscan.com",
        },
      },
    ],
  },

  paths: {
    sources:   "./contracts",
    tests:     "./test",
    cache:     "./cache",
    artifacts: "./artifacts",
  },
};

export default config;
