import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/hooks/useWallet';
import { API_ENDPOINTS } from '@/constants';
import { apiRequest } from '@/lib/queryClient';

// This is a mock scanner component - in a real app, you'd use a library like jsQR or a React wrapper for it
const QRCodeScanner = ({ onScanSuccess }) => {
  const videoRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [permissions, setPermissions] = useState(false);
  const { toast } = useToast();
  const { account } = useWallet();

  // Mock function to handle QR code scanning
  // In a real implementation, this would be replaced with actual QR scanning logic
  const startScanning = async () => {
    setScanning(true);
    setError(null);
    
    try {
      // Check if browser supports getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser does not support camera access');
      }
      
      // Request camera permissions
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setPermissions(true);
        
        // Simulate finding a QR code after 3 seconds
        // This is where you'd implement real QR code detection
        setTimeout(() => {
          // Mock QR code data
          const mockQrData = {
            patientId: '12345',
            timestamp: Date.now(),
            token: 'mockEmergencyToken' + Math.random().toString(36).substr(2, 5)
          };
          
          // Verify the QR code with the backend
          verifyQrCode(mockQrData);
          
          // Stop the camera
          const tracks = stream.getTracks();
          tracks.forEach(track => track.stop());
        }, 3000);
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setError(err.message || 'Failed to access camera');
      setScanning(false);
    }
  };
  
  const stopScanning = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setScanning(false);
    setPermissions(false);
  };
  
  // Verify the QR code with the backend
  const verifyQrCode = async (qrData) => {
    try {
      // In a real implementation, this would send the QR data to your backend
      const response = await apiRequest('POST', API_ENDPOINTS.EMERGENCY.VERIFY, {
        qrData,
        providerAddress: account
      });
      
      // Success - call the callback with patient data
      const result = await response.json();
      setScanning(false);
      
      if (result.success && result.patientData) {
        toast({
          title: 'Emergency Access Granted',
          description: `Access granted to ${result.patientData.name}'s emergency information`,
        });
        
        if (onScanSuccess) {
          onScanSuccess(result.patientData);
        }
      } else {
        throw new Error(result.message || 'Invalid QR code');
      }
    } catch (err) {
      console.error('QR verification error:', err);
      setError(err.message || 'Failed to verify QR code');
      setScanning(false);
      
      toast({
        title: 'Verification Failed',
        description: err.message || 'Failed to verify emergency access QR code',
        variant: 'destructive'
      });
    }
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);
  
  return (
    <Card className="border-primary-100">
      <CardHeader className="bg-primary-50 rounded-t-lg">
        <CardTitle className="text-lg text-primary-900">Emergency Access Scanner</CardTitle>
        <CardDescription>
          Scan a patient's emergency QR code to access critical health information
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-6">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="relative aspect-video max-h-[350px] bg-black rounded-lg overflow-hidden mb-4">
          {scanning ? (
            <>
              <video 
                ref={videoRef} 
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              
              {permissions && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-white rounded-lg"></div>
                </div>
              )}
              
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-sm text-center">
                Position the QR code within the square
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full bg-neutral-100">
              <div className="text-center">
                <span className="material-icons text-4xl text-neutral-400 mb-2">qr_code_scanner</span>
                <p className="text-neutral-500">Camera preview will appear here</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-center border-t pt-4">
        {scanning ? (
          <Button 
            variant="destructive" 
            onClick={stopScanning}
          >
            <span className="material-icons mr-2">stop</span>
            Stop Scanning
          </Button>
        ) : (
          <Button 
            onClick={startScanning}
            size="lg"
          >
            <span className="material-icons mr-2">qr_code_scanner</span>
            Start Scanning
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default QRCodeScanner;