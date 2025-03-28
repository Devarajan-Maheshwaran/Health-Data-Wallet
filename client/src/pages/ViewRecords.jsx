import React, { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useContract } from '@/hooks/useContract';
import { useToast } from '@/hooks/use-toast';
import { formatDate, shortenAddress } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';

const ViewRecords = () => {
  const { account, isConnected } = useWallet();
  const { getRecordCount, getRecord } = useContract();
  const { toast } = useToast();
  
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [showRecordDialog, setShowRecordDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  
  // Load records from both backend and blockchain
  useEffect(() => {
    const fetchRecords = async () => {
      setIsLoading(true);
      
      try {
        // For a real implementation, we would use authentication to get the current user's ID
        // For this prototype, we'll use a static user ID of 1
        const userId = 1;
        
        // Fetch records from our backend database
        const response = await fetch(`/api/health-records/user/${userId}`);
        const data = await response.json();
        
        if (data.success) {
          const formattedRecords = data.records.map((record) => ({
            id: record.id,
            recordType: record.recordType,
            title: record.title,
            ipfsHash: record.ipfsHash,
            timestamp: new Date(record.uploadedAt).getTime() / 1000,
            blockchainTxHash: record.blockchainTxHash
          }));
          
          setRecords(formattedRecords);
        }
        
        // If we're connected to blockchain, also fetch records from there
        if (isConnected && account) {
          try {
            // Get total record count
            const count = await getRecordCount(account);
            
            // Fetch all records
            const recordPromises = [];
            for (let i = 0; i < count; i++) {
              recordPromises.push(getRecord(account, i));
            }
            
            const recordResults = await Promise.all(recordPromises);
            
            // Format records
            const blockchainRecords = recordResults.map((record, index) => ({
              id: 1000 + index, // Using a large offset to avoid ID conflicts with DB records
              recordType: record.recordType,
              title: record.title,
              ipfsHash: record.ipfsHash,
              timestamp: record.timestamp
            }));
            
            // Merge records from both sources, avoiding duplicates by IPFS hash
            const existingHashes = new Set(records.map((r) => r.ipfsHash));
            const uniqueBlockchainRecords = blockchainRecords.filter(
              record => !existingHashes.has(record.ipfsHash)
            );
            
            if (uniqueBlockchainRecords.length > 0) {
              setRecords(prevRecords => [...prevRecords, ...uniqueBlockchainRecords]);
            }
          } catch (error) {
            console.error('Error fetching blockchain records:', error);
            // Continue with database records even if blockchain fetch fails
          }
        }
      } catch (error) {
        console.error('Error fetching records:', error);
        toast({
          title: "Failed to Load Records",
          description: error instanceof Error ? error.message : "Unknown error occurred",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRecords();
  }, [isConnected, account, getRecordCount, getRecord, toast]);
  
  const handleViewRecord = (record) => {
    setSelectedRecord(record);
    setShowRecordDialog(true);
  };
  
  const handleDownload = async () => {
    if (!selectedRecord) return;
    
    try {
      window.open(`/api/ipfs/get/${selectedRecord.ipfsHash}`, '_blank');
    } catch (error) {
      console.error('Error downloading record:', error);
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Failed to download the record",
        variant: "destructive",
      });
    }
  };
  
  const filteredRecords = activeTab === 'all' 
    ? records 
    : records.filter(record => record.recordType === activeTab);
  
  const uniqueRecordTypes = Array.from(new Set(records.map(record => record.recordType)));
  
  return (
    <>
      {/* Page header */}
      <div className="py-6 px-4 sm:px-6 lg:px-8 bg-white border-b border-neutral-200">
        <h1 className="text-2xl font-semibold text-neutral-900">Health Records</h1>
      </div>
      
      {/* Records content */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <Tabs defaultValue="all" onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Records</TabsTrigger>
            {uniqueRecordTypes.map(type => (
              <TabsTrigger key={type} value={type}>{type}</TabsTrigger>
            ))}
          </TabsList>
          
          <TabsContent value={activeTab} className="mt-2">
            {isLoading ? (
              <div className="text-center py-10">
                <span className="material-icons animate-spin text-primary-500 text-4xl">refresh</span>
                <p className="mt-2 text-neutral-600">Loading health records...</p>
              </div>
            ) : filteredRecords.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredRecords.map((record) => (
                  <Card key={record.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="material-icons text-primary-500">description</span>
                            <h3 className="text-lg font-medium text-neutral-900 truncate">{record.title}</h3>
                          </div>
                          <p className="mt-1 text-sm text-neutral-500">{record.recordType}</p>
                        </div>
                      </div>
                      
                      <div className="mt-4 text-sm">
                        <div className="flex items-center gap-1 text-neutral-600">
                          <span className="material-icons text-neutral-400 text-sm">calendar_today</span>
                          <span>{formatDate(record.timestamp * 1000)}</span>
                        </div>
                        
                        <div className="flex items-center gap-1 text-neutral-600 mt-1">
                          <span className="material-icons text-neutral-400 text-sm">vpn_key</span>
                          <span className="font-mono text-xs">{shortenAddress(record.ipfsHash)}</span>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex justify-end">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewRecord(record)}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-white rounded-lg shadow-sm">
                <span className="material-icons text-neutral-400 text-4xl">source</span>
                <h3 className="mt-2 text-lg font-medium text-neutral-900">No health records found</h3>
                <p className="mt-1 text-neutral-500">You haven't uploaded any health records yet.</p>
                <div className="mt-6">
                  <Button onClick={() => window.location.href = '/upload'}>
                    Upload Health Record
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Record Detail Dialog */}
      <Dialog open={showRecordDialog} onOpenChange={setShowRecordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedRecord?.title}</DialogTitle>
          </DialogHeader>
          
          {selectedRecord && (
            <div className="py-4">
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-neutral-500">Record Type</dt>
                  <dd className="mt-1 text-sm text-neutral-900">{selectedRecord.recordType}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-neutral-500">Date Added</dt>
                  <dd className="mt-1 text-sm text-neutral-900">{formatDate(selectedRecord.timestamp * 1000)}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-neutral-500">IPFS Hash</dt>
                  <dd className="mt-1 text-sm font-mono text-neutral-900 break-all">{selectedRecord.ipfsHash}</dd>
                </div>
                
                <div className="pt-4">
                  <p className="text-sm text-neutral-500">
                    This record is encrypted and stored on IPFS. You can download the encrypted file and decrypt it locally.
                  </p>
                </div>
              </dl>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRecordDialog(false)}>
              Close
            </Button>
            <Button onClick={handleDownload}>
              Download Encrypted File
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ViewRecords;