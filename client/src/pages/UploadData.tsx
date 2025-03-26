import React, { useState, useRef } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useContract } from '@/hooks/useContract';
import { useToast } from '@/hooks/use-toast';
import { encryptData } from '@/lib/utils';
import { RECORD_TYPES, API_ENDPOINTS } from '@/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiRequest } from '@/lib/queryClient';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const UploadData: React.FC = () => {
  const { account, isConnected } = useWallet();
  const { addRecord } = useContract();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [recordType, setRecordType] = useState<string>(RECORD_TYPES[0]);
  const [documentTitle, setDocumentTitle] = useState<string>('');
  const [documentDate, setDocumentDate] = useState<string>('');
  const [documentNotes, setDocumentNotes] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [transactionSuccess, setTransactionSuccess] = useState<boolean>(false);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleClickFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleUpload = async () => {
    // Form validation
    if (!documentTitle) {
      toast({
        title: "Missing Information",
        description: "Please provide a document title",
        variant: "destructive",
      });
      return;
    }

    if (!selectedFile) {
      toast({
        title: "Missing File",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    // Show confirmation modal
    setShowConfirmModal(true);
  };

  const confirmUpload = async () => {
    if (!isConnected || !account || !selectedFile) {
      toast({
        title: "Error",
        description: "Please connect your wallet and select a file",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Encrypt the file data
      const encryptedData = await encryptData(selectedFile, account);

      // 2. Upload the encrypted data to IPFS
      const formData = new FormData();
      const encryptedBlob = new Blob([encryptedData], { type: 'application/octet-stream' });
      formData.append('file', encryptedBlob, selectedFile.name + '.encrypted');

      const response = await fetch(API_ENDPOINTS.UPLOAD_TO_IPFS, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to upload to IPFS');
      }

      // 3. Store the IPFS hash on the blockchain
      const receipt = await addRecord(recordType, documentTitle, data.hash);

      // 4. Hide modal and show success
      setShowConfirmModal(false);
      setIsProcessing(false);
      setTransactionSuccess(true);

      // Reset form after success
      setTimeout(() => {
        setTransactionSuccess(false);
        resetForm();
      }, 5000);

      toast({
        title: "Upload Successful",
        description: "Your health record has been encrypted and stored securely",
        variant: "default",
      });
    } catch (error) {
      console.error('Error uploading record:', error);
      setIsProcessing(false);
      
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setRecordType(RECORD_TYPES[0]);
    setDocumentTitle('');
    setDocumentDate('');
    setDocumentNotes('');
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      {/* Page header */}
      <div className="py-6 px-4 sm:px-6 lg:px-8 bg-white border-b border-neutral-200">
        <h1 className="text-2xl font-semibold text-neutral-900">Upload Health Record</h1>
      </div>

      {/* Upload form */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-neutral-200">
            <h3 className="text-lg leading-6 font-medium text-neutral-900">Upload Health Record</h3>
            <p className="mt-1 max-w-2xl text-sm text-neutral-500">Records are encrypted before being stored on IPFS.</p>
          </div>
          
          <div className="px-4 py-5 sm:p-6">
            <div className="space-y-6">
              <div>
                <label htmlFor="record-type" className="block text-sm font-medium text-neutral-700">Record Type</label>
                <select
                  id="record-type"
                  name="record-type"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-neutral-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                  value={recordType}
                  onChange={(e) => setRecordType(e.target.value)}
                >
                  {RECORD_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="document-title" className="block text-sm font-medium text-neutral-700">Document Title</label>
                <input
                  type="text"
                  name="document-title"
                  id="document-title"
                  className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-neutral-300 rounded-md"
                  placeholder="COVID-19 Vaccination Record"
                  value={documentTitle}
                  onChange={(e) => setDocumentTitle(e.target.value)}
                />
              </div>
              
              <div>
                <label htmlFor="document-date" className="block text-sm font-medium text-neutral-700">Document Date</label>
                <input
                  type="date"
                  name="document-date"
                  id="document-date"
                  className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-neutral-300 rounded-md"
                  value={documentDate}
                  onChange={(e) => setDocumentDate(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700">File Upload</label>
                <div
                  className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-neutral-300 border-dashed rounded-md"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <div className="space-y-1 text-center">
                    <span className="material-icons mx-auto h-12 w-12 text-neutral-400">upload_file</span>
                    <div className="flex text-sm text-neutral-600">
                      <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none">
                        <span onClick={handleClickFileUpload}>Upload a file</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-neutral-500">
                      PDF, JPG, PNG up to 10MB
                    </p>
                    {selectedFile && (
                      <p className="text-sm text-primary-600">
                        Selected: {selectedFile.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <label htmlFor="document-notes" className="block text-sm font-medium text-neutral-700">Additional Notes</label>
                <textarea
                  id="document-notes"
                  name="document-notes"
                  rows={3}
                  className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-neutral-300 rounded-md"
                  value={documentNotes}
                  onChange={(e) => setDocumentNotes(e.target.value)}
                ></textarea>
              </div>
              
              <div className="pt-5">
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="bg-white py-2 px-4 border border-neutral-300 rounded-md shadow-sm text-sm font-medium text-neutral-700 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    onClick={resetForm}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    onClick={handleUpload}
                    disabled={isUploading}
                  >
                    Encrypt & Upload
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Transaction</DialogTitle>
            <DialogDescription>
              You're about to upload your encrypted health record to IPFS and register it on the blockchain. This requires a transaction fee.
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 bg-neutral-50 p-3 rounded-md">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="font-medium text-neutral-500">Document</dt>
                <dd className="text-neutral-900">{documentTitle}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium text-neutral-500">Network</dt>
                <dd className="text-neutral-900">Polygon Mumbai</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium text-neutral-500">Est. Gas Fee</dt>
                <dd className="text-neutral-900">0.0015 MATIC</dd>
              </div>
            </dl>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmModal(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmUpload}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Notification */}
      <div className={`fixed bottom-0 inset-x-0 pb-2 sm:pb-5 ${transactionSuccess ? '' : 'hidden'}`}>
        <div className="max-w-md mx-auto px-2 sm:px-6 lg:px-8">
          <div className="p-2 rounded-lg bg-secondary-600 shadow-lg sm:p-3">
            <div className="flex items-center justify-between flex-wrap">
              <div className="w-0 flex-1 flex items-center">
                <span className="flex p-2 rounded-lg bg-secondary-800">
                  <span className="material-icons text-white">check_circle</span>
                </span>
                <p className="ml-3 font-medium text-white truncate">
                  <span>Transaction complete! Record added to blockchain</span>
                </p>
              </div>
              <div className="order-2 flex-shrink-0 sm:order-3 sm:ml-2">
                <button
                  type="button"
                  className="-mr-1 flex p-2 rounded-md hover:bg-secondary-500 focus:outline-none focus:ring-2 focus:ring-white"
                  onClick={() => setTransactionSuccess(false)}
                >
                  <span className="material-icons text-white">close</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UploadData;
