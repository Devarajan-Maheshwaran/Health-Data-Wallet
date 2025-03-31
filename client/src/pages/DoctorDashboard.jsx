import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useWallet } from '@/hooks/useWallet';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import QRCodeScanner from '@/components/QRCodeScanner';

const DoctorDashboard = () => {
  const [, navigate] = useLocation();
  const { isConnected, account } = useWallet();
  const [scannedPatient, setScannedPatient] = useState(null);
  
  // Handle successful QR code scan
  const handleScanSuccess = (patientData) => {
    setScannedPatient(patientData);
  };
  
  // View patient detailed information
  const viewPatientDetails = (patientId) => {
    navigate(`/patient/${patientId}`);
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">Healthcare Provider Dashboard</h1>
        <p className="text-muted-foreground">
          Access emergency patient information and manage patient records
        </p>
      </div>
      
      <Tabs defaultValue="scanner" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="scanner">Emergency Scanner</TabsTrigger>
          <TabsTrigger value="patients">Authorized Patients</TabsTrigger>
        </TabsList>
        
        <TabsContent value="scanner" className="mt-4 space-y-4">
          {!scannedPatient ? (
            <QRCodeScanner onScanSuccess={handleScanSuccess} />
          ) : (
            <Card>
              <CardHeader className="bg-green-50 rounded-t-lg">
                <CardTitle className="text-lg text-green-800">
                  <span className="material-icons mr-2 align-text-bottom">check_circle</span>
                  Emergency Access Granted
                </CardTitle>
                <CardDescription className="text-green-700">
                  You now have temporary access to critical health information
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Patient Information</h3>
                    <div className="bg-muted p-4 rounded-md">
                      <p className="mb-1"><span className="font-medium">Name:</span> {scannedPatient.name}</p>
                      <p className="mb-1"><span className="font-medium">Patient ID:</span> {scannedPatient.id}</p>
                      {scannedPatient.walletAddress && (
                        <p className="mb-1 font-mono text-xs"><span className="font-medium">Wallet:</span> {scannedPatient.walletAddress}</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Emergency Records</h3>
                    {scannedPatient.emergencyRecords && scannedPatient.emergencyRecords.length > 0 ? (
                      <div className="space-y-2">
                        {scannedPatient.emergencyRecords.map(record => (
                          <div key={record.id} className="border p-3 rounded-md">
                            <p className="font-medium mb-1">{record.title}</p>
                            <p className="text-sm text-muted-foreground mb-2">
                              Uploaded: {new Date(record.uploadedAt).toLocaleDateString()}
                            </p>
                            <Button size="sm" variant="outline" className="w-full">
                              <span className="material-icons mr-2 text-sm">visibility</span>
                              View Record
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 border rounded-md">
                        <p className="text-muted-foreground">No emergency records available</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-between border-t pt-4">
                <Button 
                  variant="outline"
                  onClick={() => setScannedPatient(null)}
                >
                  Scan Another Patient
                </Button>
                <Button
                  onClick={() => viewPatientDetails(scannedPatient.id)}
                >
                  View Full Details
                </Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="patients" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Authorized Patients</CardTitle>
              <CardDescription>
                Patients who have granted you access to their health records
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {!isConnected ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    Connect your wallet to view authorized patients
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    No patients have granted you access yet
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DoctorDashboard;