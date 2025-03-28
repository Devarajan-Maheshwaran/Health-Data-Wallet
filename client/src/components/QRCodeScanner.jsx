import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

// In a real application, we would use a proper QR code scanner library
// For this prototype, we'll simulate scanning with a button press
const QRCodeScanner = () => {
  const [showScanDialog, setShowScanDialog] = useState(false);
  const [scanningStatus, setScanningStatus] = useState('idle'); // idle, scanning, success, error
  const [scannedData, setScannedData] = useState(null);
  
  const simulateScan = () => {
    setScanningStatus('scanning');
    
    // Simulate scan delay
    setTimeout(() => {
      // Mock scanned data - in a real app this would come from a QR scanner
      const mockPatientData = {
        patientId: '12345',
        patientAddress: '0x8F3c123456789abcdef123456789abcdef123789',
        bloodType: 'O+',
        allergies: ['Penicillin', 'Peanuts'],
        emergencyContact: '+1-555-123-4567',
        timestamp: new Date().toISOString(),
        accessType: 'emergency'
      };
      
      setScannedData(mockPatientData);
      setScanningStatus('success');
    }, 2000);
  };
  
  const handleClose = () => {
    setShowScanDialog(false);
    setScanningStatus('idle');
    setScannedData(null);
  };

  // In a real app, we would request camera permissions here
  
  return (
    <>
      <Button 
        onClick={() => setShowScanDialog(true)}
        variant="outline"
        className="flex items-center gap-2"
      >
        <span className="material-icons text-sm">qr_code_scanner</span>
        Scan Patient QR
      </Button>

      <Dialog open={showScanDialog} onOpenChange={setShowScanDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Scan Patient QR Code</DialogTitle>
            <DialogDescription>
              Scan a patient's emergency QR code to access their critical health information.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center justify-center py-4">
            {scanningStatus === 'idle' && (
              <div className="text-center">
                <div className="border-2 border-dashed border-neutral-300 rounded-lg p-8 mb-4">
                  <span className="material-icons text-neutral-400 text-6xl">qr_code_scanner</span>
                  <p className="mt-2 text-neutral-600">Ready to scan</p>
                </div>
                <Button onClick={simulateScan} className="mt-2">
                  Start Scanning
                </Button>
              </div>
            )}
            
            {scanningStatus === 'scanning' && (
              <div className="text-center">
                <div className="border-2 border-primary-300 rounded-lg p-8 mb-4 animate-pulse">
                  <span className="material-icons text-primary-500 text-6xl">qr_code_scanner</span>
                  <p className="mt-2 text-primary-600">Scanning...</p>
                </div>
              </div>
            )}
            
            {scanningStatus === 'success' && scannedData && (
              <div className="w-full">
                <Alert className="mb-4 border-secondary-300 bg-secondary-50">
                  <span className="material-icons text-secondary-500 mr-2">check_circle</span>
                  <AlertTitle>Successfully Scanned</AlertTitle>
                  <AlertDescription>Patient information retrieved</AlertDescription>
                </Alert>
                
                <div className="bg-white p-4 rounded-lg border border-neutral-200 mb-4">
                  <h3 className="font-medium text-lg mb-3">Emergency Patient Information</h3>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between border-b pb-2">
                      <span className="font-medium text-neutral-600">Patient ID:</span>
                      <span className="font-mono">{scannedData.patientId}</span>
                    </div>
                    
                    <div className="flex justify-between border-b pb-2">
                      <span className="font-medium text-neutral-600">Blood Type:</span>
                      <span className="font-semibold text-primary-700">{scannedData.bloodType}</span>
                    </div>
                    
                    <div className="flex justify-between border-b pb-2">
                      <span className="font-medium text-neutral-600">Allergies:</span>
                      <span className="text-error-600">{scannedData.allergies.join(', ')}</span>
                    </div>
                    
                    <div className="flex justify-between border-b pb-2">
                      <span className="font-medium text-neutral-600">Emergency Contact:</span>
                      <span>{scannedData.emergencyContact}</span>
                    </div>
                    
                    <div className="flex justify-between pt-1">
                      <span className="font-medium text-neutral-600">Access Type:</span>
                      <span className="uppercase text-xs bg-error-100 text-error-800 px-2 py-1 rounded font-semibold">
                        {scannedData.accessType}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="text-center">
                  <Button 
                    variant="secondary"
                    className="mb-2"
                    onClick={() => {
                      // In a real app, this would navigate to a detailed patient view
                      alert('Accessing full patient records...');
                    }}
                  >
                    <span className="material-icons mr-1 text-sm">folder_open</span>
                    Access Patient Records
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default QRCodeScanner;