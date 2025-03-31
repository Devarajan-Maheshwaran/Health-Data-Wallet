import { useContext } from 'react';
import { Web3Context } from '@/context/Web3Context';

/**
 * Hook for accessing Web3 wallet functionality
 * @returns {Object} Web3 context
 */
export function useWallet() {
  const context = useContext(Web3Context);
  
  if (context === undefined) {
    throw new Error('useWallet must be used within a Web3Provider');
  }
  
  return context;
}