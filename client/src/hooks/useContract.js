import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWeb3Context } from '@/context/Web3Context';
import { CONTRACT_ADDRESSES, DEFAULT_NETWORK } from '@/constants';
import { useToast } from '@/hooks/use-toast';
import HealthRecordContract from '@/contracts/HealthRecordContract.json';

/**
 * Hook for interacting with the HealthRecord smart contract
 */
export function useContract() {
  const { toast } = useToast();
  const { provider, signer, account, chainId, isConnected } = useWeb3Context();
  const [contract, setContract] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  /**
   * Initialize the contract instance
   */
  useEffect(() => {
    const initContract = async () => {
      if (!provider || !signer || !account) return;
      
      try {
        // Get the correct contract address based on the current network
        const address = CONTRACT_ADDRESSES[chainId] || CONTRACT_ADDRESSES[DEFAULT_NETWORK];
        
        if (!address) {
          console.error('No contract address found for the current network');
          return;
        }
        
        // Create contract instance
        const contractInstance = new ethers.Contract(
          address,
          HealthRecordContract.abi,
          signer
        );
        
        setContract(contractInstance);
      } catch (error) {
        console.error('Error initializing contract:', error);
        toast({
          title: 'Contract Error',
          description: 'Failed to initialize contract. Please try again.',
          variant: 'destructive',
        });
      }
    };
    
    initContract();
  }, [provider, signer, account, chainId, toast]);
  
  /**
   * Add a new health record to the blockchain
   * @param {string} ipfsHash - IPFS hash of the record
   * @param {string} recordType - Type of the record
   * @param {string} encryptionKey - Optional encryption key for the record
   * @returns {Promise<string>} Transaction hash
   */
  const addRecord = useCallback(async (ipfsHash, recordType, encryptionKey = '') => {
    if (!contract || !account) {
      throw new Error('Contract not initialized or wallet not connected');
    }
    
    setIsLoading(true);
    
    try {
      // Call the addRecord function on the smart contract
      const tx = await contract.addRecord(ipfsHash, recordType, encryptionKey);
      
      // Wait for the transaction to be mined
      const receipt = await tx.wait();
      
      setIsLoading(false);
      return receipt.transactionHash;
    } catch (error) {
      setIsLoading(false);
      console.error('Error adding record to blockchain:', error);
      throw error;
    }
  }, [contract, account]);
  
  /**
   * Get all records for the current user
   * @returns {Promise<Array>} Array of records
   */
  const getUserRecords = useCallback(async () => {
    if (!contract || !account) {
      throw new Error('Contract not initialized or wallet not connected');
    }
    
    setIsLoading(true);
    
    try {
      // Call the getUserRecords function on the smart contract
      const records = await contract.getUserRecords();
      
      setIsLoading(false);
      
      // Format the records
      return records.map(record => ({
        id: record.id.toString(),
        ipfsHash: record.ipfsHash,
        recordType: record.recordType,
        timestamp: new Date(record.timestamp.toNumber() * 1000),
        owner: record.owner,
        encryptionKey: record.encryptionKey
      }));
    } catch (error) {
      setIsLoading(false);
      console.error('Error getting user records:', error);
      throw error;
    }
  }, [contract, account]);
  
  /**
   * Grant access to a record
   * @param {string} recordId - ID of the record
   * @param {string} providerAddress - Address of the healthcare provider
   * @returns {Promise<string>} Transaction hash
   */
  const grantAccess = useCallback(async (recordId, providerAddress) => {
    if (!contract || !account) {
      throw new Error('Contract not initialized or wallet not connected');
    }
    
    setIsLoading(true);
    
    try {
      // Call the grantAccess function on the smart contract
      const tx = await contract.grantAccess(recordId, providerAddress);
      
      // Wait for the transaction to be mined
      const receipt = await tx.wait();
      
      setIsLoading(false);
      return receipt.transactionHash;
    } catch (error) {
      setIsLoading(false);
      console.error('Error granting access:', error);
      throw error;
    }
  }, [contract, account]);
  
  /**
   * Revoke access to a record
   * @param {string} recordId - ID of the record
   * @param {string} providerAddress - Address of the healthcare provider
   * @returns {Promise<string>} Transaction hash
   */
  const revokeAccess = useCallback(async (recordId, providerAddress) => {
    if (!contract || !account) {
      throw new Error('Contract not initialized or wallet not connected');
    }
    
    setIsLoading(true);
    
    try {
      // Call the revokeAccess function on the smart contract
      const tx = await contract.revokeAccess(recordId, providerAddress);
      
      // Wait for the transaction to be mined
      const receipt = await tx.wait();
      
      setIsLoading(false);
      return receipt.transactionHash;
    } catch (error) {
      setIsLoading(false);
      console.error('Error revoking access:', error);
      throw error;
    }
  }, [contract, account]);
  
  /**
   * Submit a zero-knowledge proof to the blockchain
   * @param {string} proofData - Serialized proof data
   * @returns {Promise<string>} Transaction hash
   */
  const submitProofToBlockchain = useCallback(async (proofData) => {
    if (!contract || !account) {
      throw new Error('Contract not initialized or wallet not connected');
    }
    
    setIsLoading(true);
    
    try {
      // This is a mock implementation
      // In a real application, you would call a specific function on your contract
      console.log('Submitting proof to blockchain:', proofData);
      
      // For demo purposes, simulate a transaction delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIsLoading(false);
      
      // Return a mock transaction hash
      return '0x' + Math.random().toString(16).substring(2);
    } catch (error) {
      setIsLoading(false);
      console.error('Error submitting proof to blockchain:', error);
      throw error;
    }
  }, [contract, account]);
  
  return {
    contract,
    isLoading,
    addRecord,
    getUserRecords,
    grantAccess,
    revokeAccess,
    submitProofToBlockchain
  };
}