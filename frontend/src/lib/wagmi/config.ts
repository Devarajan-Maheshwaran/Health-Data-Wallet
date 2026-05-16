import { createConfig, http } from 'wagmi'
import { bscTestnet } from 'wagmi/chains'
import { connectorsForWallets } from '@rainbow-me/rainbowkit'
import {
  metaMaskWallet,
  coinbaseWallet,
  trustWallet,
} from '@rainbow-me/rainbowkit/wallets'

const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? 'medvault-dev'

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [metaMaskWallet, trustWallet, coinbaseWallet],
    },
  ],
  { appName: 'MedVault', projectId }
)

export const wagmiConfig = createConfig({
  chains: [bscTestnet],
  connectors,
  transports: {
    [bscTestnet.id]: http(
      'https://data-seed-prebsc-1-s1.bnbchain.org:8545'
    ),
  },
  // ssr: true removed — causes server+client double-bundle (10min compile)
})
