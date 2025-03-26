import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { API_ENDPOINTS } from '@/constants';

export const useIpfs = () => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const uploadToIpfs = useCallback(async (file: File | Blob): Promise<string | null> => {
    setIsUploading(true);
    setUploadError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(API_ENDPOINTS.UPLOAD_TO_IPFS, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to upload to IPFS');
      }

      return data.hash;
    } catch (error) {
      console.error('Error uploading to IPFS:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setUploadError(errorMessage);
      toast({
        title: "IPFS Upload Failed",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [toast]);

  const getFromIpfs = useCallback(async (ipfsHash: string): Promise<Blob | null> => {
    try {
      const response = await fetch(`${API_ENDPOINTS.GET_FROM_IPFS}/${ipfsHash}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch from IPFS: ${response.statusText}`);
      }
      
      return await response.blob();
    } catch (error) {
      console.error('Error getting file from IPFS:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "IPFS Retrieval Failed",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    }
  }, [toast]);

  return {
    uploadToIpfs,
    getFromIpfs,
    isUploading,
    uploadError
  };
};
