import React, { createContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useToast } from '@/hooks/use-toast';
import { DEFAULT_NETWORK, SUPPORTED_NETWORKS } from '@/constants';

// Create the Web3 context with default values
export const Web3Context = createContext({
  provider: null,
  signer: null,
  account: null,
  chainId: null,
  isConnected: false,
  isCorrectNetwork: false,
  connect: async () => {},
  disconnect: () => {},
  switchNetwork: async () => {}
});

// Web3Provider component wraps children with the Web3Context
export const Web3Provider = ({ children }) => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const { toast } = useToast();

  // Check if MetaMask or other Ethereum provider is available
  const checkIfWalletIsConnected = async () => {
    try {
      if (!window.ethereum) {
        console.log('Make sure you have MetaMask installed!');
        return false;
      }

      // Create a Web3Provider instance
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(web3Provider);

      const accounts = await web3Provider.listAccounts();
      if (accounts.length !== 0) {
        // User already connected, get the first account
        const account = accounts[0];
        const signer = web3Provider.getSigner();
        
        setAccount(account);
        setSigner(signer);
        setIsConnected(true);
        
        // Get chain ID
        const network = await web3Provider.getNetwork();
        setChainId('0x' + network.chainId.toString(16));
        setIsCorrectNetwork(network.chainId.toString(16) === DEFAULT_NETWORK.chainId.slice(2));
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking wallet connection:', error);
      return false;
    }
  };

  // Connect wallet
  const connect = async () => {
    try {
      if (!window.ethereum) {
        toast({
          title: 'No Wallet Found',
          description: 'Please install MetaMask or other Ethereum wallet extension.',
          variant: 'destructive'
        });
        return;
      }

      // Create a Web3Provider instance
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(web3Provider);

      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const account = accounts[0];
      const signer = web3Provider.getSigner();
      
      setAccount(account);
      setSigner(signer);
      setIsConnected(true);
      
      // Get chain ID
      const network = await web3Provider.getNetwork();
      const hexChainId = '0x' + network.chainId.toString(16);
      setChainId(hexChainId);
      
      // Check if user is on the correct network
      setIsCorrectNetwork(hexChainId === DEFAULT_NETWORK.chainId);
      
      if (hexChainId !== DEFAULT_NETWORK.chainId) {
        toast({
          title: 'Wrong Network',
          description: `Please switch to ${DEFAULT_NETWORK.chainName}`,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      let errorMessage = 'Failed to connect wallet';
      
      if (error.code === 4001) {
        errorMessage = 'You rejected the connection request';
      }
      
      toast({
        title: 'Connection Error',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  };

  // Disconnect wallet
  const disconnect = () => {
    setAccount(null);
    setSigner(null);
    setIsConnected(false);
    setChainId(null);
    setIsCorrectNetwork(false);
  };

  // Switch to the correct network
  const switchNetwork = async () => {
    try {
      if (!window.ethereum) return;
      
      // Try to switch to the required network
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: DEFAULT_NETWORK.chainId }]
        });
      } catch (switchError) {
        // If the chain is not added to MetaMask, add it
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [DEFAULT_NETWORK]
          });
        } else {
          throw switchError;
        }
      }
      
      // Update chain ID and connection status
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      const network = await web3Provider.getNetwork();
      setChainId('0x' + network.chainId.toString(16));
      setIsCorrectNetwork(network.chainId.toString(16) === DEFAULT_NETWORK.chainId.slice(2));
      
      // Update signer
      const signer = web3Provider.getSigner();
      setSigner(signer);
    } catch (error) {
      console.error('Error switching network:', error);
      toast({
        title: 'Network Switch Failed',
        description: error.message || 'Failed to switch network',
        variant: 'destructive'
      });
      throw error;
    }
  };

  // Handle account change
  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      // User disconnected their wallet
      disconnect();
      toast({
        title: 'Wallet Disconnected',
        description: 'Your wallet has been disconnected',
      });
    } else {
      // Account changed, update state
      setAccount(accounts[0]);
      
      if (provider) {
        setSigner(provider.getSigner());
      }
      
      toast({
        title: 'Account Changed',
        description: 'Your wallet account has changed',
      });
    }
  };

  // Handle chain change
  const handleChainChanged = async (chainIdHex) => {
    setChainId(chainIdHex);
    
    // Reload provider with new chain
    if (window.ethereum) {
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(web3Provider);
      setSigner(web3Provider.getSigner());
      
      // Check if the new chain is the correct one
      setIsCorrectNetwork(chainIdHex === DEFAULT_NETWORK.chainId);
      
      toast({
        title: 'Network Changed',
        description: `Switched to ${chainIdHex === DEFAULT_NETWORK.chainId ? DEFAULT_NETWORK.chainName : 'a different network'}`,
      });
    }
  };

  // Set up event listeners for wallet changes
  useEffect(() => {
    // Check if wallet is already connected on component mount
    checkIfWalletIsConnected();
    
    if (window.ethereum) {
      // Set up event listeners
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      
      // Clean up event listeners on unmount
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  // The value to be provided by the context
  const contextValue = {
    provider,
    signer,
    account,
    chainId,
    isConnected,
    isCorrectNetwork,
    connect,
    disconnect,
    switchNetwork
  };

  return (
    <Web3Context.Provider value={contextValue}>
      {children}
    </Web3Context.Provider>
  );
};

export default Web3Provider;