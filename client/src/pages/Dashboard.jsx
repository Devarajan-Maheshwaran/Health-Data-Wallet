import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { API_ENDPOINTS } from '@/constants';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import EmergencyQRCode from '@/components/EmergencyQRCode';

const Dashboard = () => {
  const { isConnected, account } = useWallet();
  const { toast } = useToast();
  
  // Fetch user data if authenticated
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: [API_ENDPOINTS.AUTH.USER],
    enabled: false, // Disable auto-fetching for this demo
  });
  
  // Fetch user's health records 
  const { data: recordsData, isLoading: recordsLoading } = useQuery({
    queryKey: [API_ENDPOINTS.RECORDS.LIST],
    enabled: false, // Disable auto-fetching for this demo
  });
  
  // Fetch user's access grants
  const { data: accessData, isLoading: accessLoading } = useQuery({
    queryKey: [API_ENDPOINTS.ACCESS.LIST],
    enabled: false, // Disable auto-fetching for this demo
  });
  
  // These would normally be loaded from the API, but we're using empty arrays for this demo
  const healthRecords = recordsData?.records || [];
  const accessGrants = accessData?.grants || [];
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold mb-1">Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your health records and access controls
          </p>
        </div>
        
        {isConnected && (
          <Button
            onClick={() => {
              toast({
                title: "Wallet Connected",
                description: `Your wallet (${account.substring(0, 6)}...) is connected and ready.`,
              });
            }}
            className="mt-4 md:mt-0"
          >
            <span className="material-icons mr-2">refresh</span>
            Refresh
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Health Records Summary Card */}
        <Card>
          <CardHeader className="bg-primary-50 rounded-t-lg">
            <CardTitle className="text-lg text-primary-900">
              <span className="material-icons mr-2 align-text-bottom">folder_shared</span>
              Health Records
            </CardTitle>
            <CardDescription>
              Your personal health data
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="mb-4">
                <p className="text-5xl font-bold text-primary-700 mb-1">{healthRecords.length}</p>
                <p className="text-sm text-muted-foreground">Total Records</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center border-t pt-4">
            <Button variant="outline" className="w-full">
              <span className="material-icons mr-2 text-sm">visibility</span>
              View All Records
            </Button>
          </CardFooter>
        </Card>
        
        {/* Access Control Card */}
        <Card>
          <CardHeader className="bg-primary-50 rounded-t-lg">
            <CardTitle className="text-lg text-primary-900">
              <span className="material-icons mr-2 align-text-bottom">security</span>
              Access Control
            </CardTitle>
            <CardDescription>
              Manage provider access
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="mb-4">
                <p className="text-5xl font-bold text-primary-700 mb-1">{accessGrants.length}</p>
                <p className="text-sm text-muted-foreground">Active Access Grants</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center border-t pt-4">
            <Button variant="outline" className="w-full">
              <span className="material-icons mr-2 text-sm">manage_accounts</span>
              Manage Access
            </Button>
          </CardFooter>
        </Card>
        
        {/* Upload Card */}
        <Card>
          <CardHeader className="bg-primary-50 rounded-t-lg">
            <CardTitle className="text-lg text-primary-900">
              <span className="material-icons mr-2 align-text-bottom">cloud_upload</span>
              Upload Health Data
            </CardTitle>
            <CardDescription>
              Add new health records
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="mb-4 text-neutral-600">
                <span className="material-icons text-4xl mb-2">upload_file</span>
                <p>Upload your health records securely to the blockchain</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center border-t pt-4">
            <Button className="w-full">
              <span className="material-icons mr-2 text-sm">add</span>
              Upload New Record
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {/* Emergency Access Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Emergency Access</h2>
        <EmergencyQRCode />
      </div>
    </div>
  );
};

export default Dashboard;