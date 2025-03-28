import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWallet } from './useWallet';
import { CONTRACT_ADDRESSES } from '@/constants';
import HealthRecordContractArtifact from '@/contracts/HealthRecordContract.json';

export const useContract = () => {
  const { signer, isConnected, isCorrectNetwork } = useWallet();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize contract
  useEffect(() => {
    if (signer && isConnected && isCorrectNetwork) {
      try {
        const healthRecordContract = new ethers.Contract(
          CONTRACT_ADDRESSES.HEALTH_RECORD,
          HealthRecordContractArtifact.abi,
          signer
        );
        setContract(healthRecordContract);
        setError(null);
      } catch (err) {
        console.error('Error initializing contract:', err);
        setError('Failed to initialize contract');
        setContract(null);
      }
    } else {
      setContract(null);
    }
  }, [signer, isConnected, isCorrectNetwork]);

  // Register patient
  const registerPatient = useCallback(async (name) => {
    if (!contract) {
      throw new Error('Contract not initialized');
    }
    
    setLoading(true);
    try {
      const tx = await contract.registerPatient(name);
      const receipt = await tx.wait();
      setLoading(false);
      return receipt;
    } catch (err) {
      setLoading(false);
      console.error('Error registering patient:', err);
      throw err;
    }
  }, [contract]);

  // Add health record
  const addRecord = useCallback(async (recordType, title, ipfsHash) => {
    if (!contract) {
      throw new Error('Contract not initialized');
    }
    
    setLoading(true);
    try {
      const tx = await contract.addRecord(recordType, title, ipfsHash);
      const receipt = await tx.wait();
      setLoading(false);
      return receipt;
    } catch (err) {
      setLoading(false);
      console.error('Error adding record:', err);
      throw err;
    }
  }, [contract]);

  // Grant access to provider
  const grantAccess = useCallback(async (providerAddress) => {
    if (!contract) {
      throw new Error('Contract not initialized');
    }
    
    setLoading(true);
    try {
      const tx = await contract.grantAccess(providerAddress);
      const receipt = await tx.wait();
      setLoading(false);
      return receipt;
    } catch (err) {
      setLoading(false);
      console.error('Error granting access:', err);
      throw err;
    }
  }, [contract]);

  // Revoke access from provider
  const revokeAccess = useCallback(async (providerAddress) => {
    if (!contract) {
      throw new Error('Contract not initialized');
    }
    
    setLoading(true);
    try {
      const tx = await contract.revokeAccess(providerAddress);
      const receipt = await tx.wait();
      setLoading(false);
      return receipt;
    } catch (err) {
      setLoading(false);
      console.error('Error revoking access:', err);
      throw err;
    }
  }, [contract]);

  // Get record count
  const getRecordCount = useCallback(async (patientAddress) => {
    if (!contract) {
      throw new Error('Contract not initialized');
    }
    
    try {
      const count = await contract.getRecordCount(patientAddress);
      return count.toNumber();
    } catch (err) {
      console.error('Error getting record count:', err);
      throw err;
    }
  }, [contract]);

  // Get record details
  const getRecord = useCallback(async (patientAddress, recordId) => {
    if (!contract) {
      throw new Error('Contract not initialized');
    }
    
    try {
      const [recordType, title, ipfsHash, timestamp] = await contract.getRecord(patientAddress, recordId);
      return {
        recordType,
        title,
        ipfsHash,
        timestamp: timestamp.toNumber()
      };
    } catch (err) {
      console.error('Error getting record:', err);
      throw err;
    }
  }, [contract]);

  // Check if patient is registered
  const isPatientRegistered = useCallback(async (patientAddress) => {
    if (!contract) {
      throw new Error('Contract not initialized');
    }
    
    try {
      return await contract.isPatientRegistered(patientAddress);
    } catch (err) {
      console.error('Error checking if patient is registered:', err);
      throw err;
    }
  }, [contract]);

  return {
    contract,
    loading,
    error,
    registerPatient,
    addRecord,
    grantAccess,
    revokeAccess,
    getRecordCount,
    getRecord,
    isPatientRegistered
  };
};