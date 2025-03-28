import React, { useState } from 'react';
import QRCode from 'react-qr-code';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { shortenAddress } from '@/lib/utils';

const EmergencyQRCode = ({ patient, patientData }) => {
  const [showQRDialog, setShowQRDialog] = useState(false);

  // Create a data structure to represent essential patient info for emergency access
  const emergencyData = {
    patientId: patient?.id || '',
    patientAddress: patient?.address || '',
    bloodType: patientData?.bloodType || 'Unknown',
    allergies: patientData?.allergies || [],
    emergencyContact: patientData?.emergencyContact || '',
    timestamp: new Date().toISOString(),
    accessType: 'emergency'
  };

  // Convert the data to JSON string for the QR code
  const qrData = JSON.stringify(emergencyData);

  return (
    <>
      <Button 
        onClick={() => setShowQRDialog(true)}
        variant="secondary"
        className="flex items-center gap-2"
      >
        <span className="material-icons text-sm">qr_code</span>
        Emergency QR Code
      </Button>

      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Emergency Access QR Code</DialogTitle>
            <DialogDescription>
              Scan this QR code in case of emergency to access critical patient information.
              This code provides limited access to essential health data.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center justify-center py-4">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <QRCode
                value={qrData}
                size={200}
                level="H"
              />
            </div>
          </div>
          
          <div className="bg-neutral-50 p-3 rounded-md text-sm">
            <h4 className="font-medium mb-2">Emergency Access Information</h4>
            <p className="text-neutral-600 mb-1">
              Patient ID: <span className="font-mono">{patient?.id || 'N/A'}</span>
            </p>
            <p className="text-neutral-600 mb-1">
              Wallet: <span className="font-mono">{shortenAddress(patient?.address || '')}</span>
            </p>
            <p className="text-neutral-600 mb-3">
              This QR code will grant temporary emergency access to critical health information.
            </p>
            <div className="text-error-600 text-xs">
              <p>Important: Share this QR code only with trusted healthcare providers.</p>
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowQRDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EmergencyQRCode;