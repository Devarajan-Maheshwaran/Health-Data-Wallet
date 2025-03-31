import { useCallback } from 'react';
import { create } from 'ipfs-http-client';
import { useToast } from '@/hooks/use-toast';
import { API_ENDPOINTS } from '@/constants';
import { apiRequest } from '@/lib/queryClient';

export const useIpfs = () => {
  const { toast } = useToast();
  
  // Upload data to IPFS through server proxy
  const uploadToIPFS = useCallback(async (data) => {
    try {
      // Prepare the data for API request
      // If data is a File object, use FormData
      if (data instanceof File) {
        const formData = new FormData();
        formData.append('file', data);
        
        // Can't use apiRequest directly with FormData
        const response = await fetch(API_ENDPOINTS.RECORDS.CREATE, {
          method: 'POST',
          body: formData,
          credentials: 'include'
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Upload failed: ${errorText}`);
        }
        
        const result = await response.json();
        return result.record.ipfsHash;
      }
      
      // If data is object/string, send as JSON
      const response = await apiRequest('POST', API_ENDPOINTS.RECORDS.CREATE, {
        data: typeof data === 'string' ? data : JSON.stringify(data),
        title: 'Record ' + new Date().toISOString(),
        recordType: 'general'
      });
      
      const result = await response.json();
      return result.record.ipfsHash;
    } catch (error) {
      console.error('Error uploading to IPFS:', error);
      toast({
        title: 'IPFS Upload Failed',
        description: error.message || 'Failed to upload data to IPFS',
        variant: 'destructive'
      });
      throw error;
    }
  }, [toast]);
  
  // Fetch data from IPFS through server proxy
  const fetchFromIPFS = useCallback(async (ipfsHash, recordId) => {
    try {
      if (!ipfsHash && !recordId) {
        throw new Error('Either IPFS hash or record ID is required');
      }
      
      // If we have a record ID, fetch through the records API
      if (recordId) {
        const response = await apiRequest('GET', API_ENDPOINTS.RECORDS.GET(recordId));
        const result = await response.json();
        return result.record.data;
      }
      
      // Direct fetch not implemented yet in server API
      throw new Error('Direct IPFS fetch not implemented yet');
    } catch (error) {
      console.error('Error fetching from IPFS:', error);
      toast({
        title: 'IPFS Fetch Failed',
        description: error.message || 'Failed to fetch data from IPFS',
        variant: 'destructive'
      });
      throw error;
    }
  }, [toast]);
  
  return {
    uploadToIPFS,
    fetchFromIPFS
  };
};