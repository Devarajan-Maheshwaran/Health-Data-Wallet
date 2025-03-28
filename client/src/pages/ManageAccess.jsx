import React, { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useContract } from '@/hooks/useContract';
import { useToast } from '@/hooks/use-toast';
import { shortenAddress } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ethers } from 'ethers';

const ManageAccess = () => {
  const { account, isConnected } = useWallet();
  const { grantAccess, revokeAccess } = useContract();
  const { toast } = useToast();
  
  const [providers, setProviders] = useState([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [newProviderAddress, setNewProviderAddress] = useState('');
  const [newProviderName, setNewProviderName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Load mock providers data
  useEffect(() => {
    // In a real app, this would come from the blockchain or database
    setProviders([
      {
        id: '1',
        name: 'Dr. Sarah Johnson',
        address: '0x5F3c123456789abcdef123456789abcdef123456',
        status: 'Active',
        grantedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        id: '2',
        name: 'Memorial Hospital',
        address: '0xA123456789abcdef123456789abcdef123456789',
        status: 'Active',
        grantedDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      },
    ]);
  }, []);
  
  const handleGrantAccess = async () => {
    if (!isConnected) {
      toast({
        title: "Not Connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }
    
    if (!newProviderAddress || !ethers.utils.isAddress(newProviderAddress)) {
      toast({
        title: "Invalid Address",
        description: "Please enter a valid Ethereum address",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      await grantAccess(newProviderAddress);
      
      // Add the new provider to the list
      const newProvider = {
        id: Date.now().toString(),
        name: newProviderName || `Provider ${providers.length + 1}`,
        address: newProviderAddress,
        status: 'Active',
        grantedDate: new Date(),
      };
      
      setProviders([...providers, newProvider]);
      setShowAddDialog(false);
      setNewProviderAddress('');
      setNewProviderName('');
      
      toast({
        title: "Access Granted",
        description: `Access has been granted to ${newProviderName || 'the provider'}`,
        variant: "default",
      });
    } catch (error) {
      console.error('Error granting access:', error);
      toast({
        title: "Transaction Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleRevokeAccess = async () => {
    if (!isConnected || !selectedProvider) {
      return;
    }
    
    setIsProcessing(true);
    
    try {
      await revokeAccess(selectedProvider.address);
      
      // Update the provider's status
      const updatedProviders = providers.map(provider => 
        provider.id === selectedProvider.id
          ? { ...provider, status: 'Revoked' }
          : provider
      );
      
      setProviders(updatedProviders);
      setShowRevokeDialog(false);
      setSelectedProvider(null);
      
      toast({
        title: "Access Revoked",
        description: `Access has been revoked from ${selectedProvider.name}`,
        variant: "default",
      });
    } catch (error) {
      console.error('Error revoking access:', error);
      toast({
        title: "Transaction Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const openRevokeDialog = (provider) => {
    setSelectedProvider(provider);
    setShowRevokeDialog(true);
  };
  
  return (
    <>
      {/* Page header */}
      <div className="py-6 px-4 sm:px-6 lg:px-8 bg-white border-b border-neutral-200">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-neutral-900">Manage Access</h1>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="flex items-center gap-1"
          >
            <span className="material-icons text-sm">add</span>
            Grant Access
          </Button>
        </div>
      </div>
      
      {/* Provider list */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-neutral-200">
            <h3 className="text-lg leading-6 font-medium text-neutral-900">Healthcare Providers</h3>
            <p className="mt-1 max-w-2xl text-sm text-neutral-500">
              Providers with access to your health records
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Provider
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Wallet Address
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Granted Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {providers.map((provider) => (
                  <tr key={provider.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-neutral-900">{provider.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-500 font-mono">{shortenAddress(provider.address)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        provider.status === 'Active'
                          ? 'bg-secondary-100 text-secondary-800'
                          : 'bg-error-100 text-error-800'
                      }`}>
                        {provider.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                      {provider.grantedDate.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {provider.status === 'Active' && (
                        <button
                          onClick={() => openRevokeDialog(provider)}
                          className="text-error-600 hover:text-error-900"
                        >
                          Revoke Access
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                
                {providers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-neutral-500">
                      No providers have been granted access yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Add Provider Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grant Access to Provider</DialogTitle>
            <DialogDescription>
              Enter the wallet address of the healthcare provider you want to grant access to your health records.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label htmlFor="provider-name" className="text-sm font-medium text-neutral-700">
                Provider Name (optional)
              </label>
              <Input
                id="provider-name"
                placeholder="Dr. John Doe"
                value={newProviderName}
                onChange={(e) => setNewProviderName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="provider-address" className="text-sm font-medium text-neutral-700">
                Provider Wallet Address
              </label>
              <Input
                id="provider-address"
                placeholder="0x..."
                value={newProviderAddress}
                onChange={(e) => setNewProviderAddress(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddDialog(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleGrantAccess}
              disabled={isProcessing || !newProviderAddress}
            >
              {isProcessing ? 'Processing...' : 'Grant Access'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Revoke Access Dialog */}
      <Dialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke Provider Access</DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke access from this provider? They will no longer be able to view your health records.
            </DialogDescription>
          </DialogHeader>
          
          {selectedProvider && (
            <div className="py-2">
              <div className="bg-neutral-50 p-3 rounded-md">
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="font-medium text-neutral-500">Provider</dt>
                    <dd className="text-neutral-900">{selectedProvider.name}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium text-neutral-500">Address</dt>
                    <dd className="text-neutral-900 font-mono">{shortenAddress(selectedProvider.address)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium text-neutral-500">Granted On</dt>
                    <dd className="text-neutral-900">{selectedProvider.grantedDate.toLocaleDateString()}</dd>
                  </div>
                </dl>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRevokeDialog(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRevokeAccess}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Revoke Access'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ManageAccess;