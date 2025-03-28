import React, { createContext, useCallback, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { DEFAULT_NETWORK } from '@/constants';

export const Web3Context = createContext({
  provider: null,
  signer: null,
  account: null,
  chainId: null,
  isConnected: false,
  isCorrectNetwork: false,
  connect: async () => {},
  disconnect: () => {},
  switchNetwork: async () => {},
});

export const Web3Provider = ({ children }) => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      throw new Error("MetaMask not installed. Please install MetaMask to use this app.");
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Create ethers provider and signer
      const ethersProvider = new ethers.providers.Web3Provider(window.ethereum);
      const ethersSigner = ethersProvider.getSigner();
      
      // Get current chain ID
      const networkId = await window.ethereum.request({ method: 'eth_chainId' });
      
      setProvider(ethersProvider);
      setSigner(ethersSigner);
      setAccount(accounts[0]);
      setChainId(networkId);
      setIsConnected(true);
      setIsCorrectNetwork(networkId === DEFAULT_NETWORK.chainId);
    } catch (error) {
      console.error('Error connecting to wallet:', error);
      throw error;
    }
  }, []);

  const disconnect = useCallback(() => {
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setChainId(null);
    setIsConnected(false);
    setIsCorrectNetwork(false);
  }, []);

  const switchNetwork = useCallback(async () => {
    if (!window.ethereum) {
      throw new Error("MetaMask not installed.");
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: DEFAULT_NETWORK.chainId }],
      });
    } catch (switchError) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: DEFAULT_NETWORK.chainId,
                chainName: DEFAULT_NETWORK.chainName,
                nativeCurrency: DEFAULT_NETWORK.nativeCurrency,
                rpcUrls: DEFAULT_NETWORK.rpcUrls,
                blockExplorerUrls: DEFAULT_NETWORK.blockExplorerUrls,
              },
            ],
          });
        } catch (addError) {
          console.error('Error adding network to MetaMask:', addError);
          throw addError;
        }
      } else {
        console.error('Error switching network in MetaMask:', switchError);
        throw switchError;
      }
    }
  }, []);

  useEffect(() => {
    // Check if we're already connected
    if (window.ethereum && window.ethereum.selectedAddress) {
      connect().catch(console.error);
    }

    // Setup event listeners
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          // User disconnected their wallet
          disconnect();
        } else {
          // Account changed, update state
          setAccount(accounts[0]);
        }
      };

      const handleChainChanged = (chainId) => {
        // Chain changed, reload page as recommended by MetaMask
        window.location.reload();
      };

      const handleDisconnect = () => {
        disconnect();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('disconnect', handleDisconnect);

      return () => {
        // Cleanup event listeners
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
          window.ethereum.removeListener('disconnect', handleDisconnect);
        }
      };
    }
  }, [connect, disconnect]);

  return (
    <Web3Context.Provider value={{
      provider,
      signer,
      account,
      chainId,
      isConnected,
      isCorrectNetwork,
      connect,
      disconnect,
      switchNetwork,
    }}>
      {children}
    </Web3Context.Provider>
  );
};