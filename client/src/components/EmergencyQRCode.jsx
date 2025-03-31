import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { API_ENDPOINTS } from '@/constants';
import QRCode from 'react-qr-code';

const EmergencyQRCode = () => {
  const [showQrCode, setShowQrCode] = useState(false);
  const [qrValue, setQrValue] = useState('');
  const [expiryTime, setExpiryTime] = useState(null);
  
  // Fetch QR code data when requested
  const { data, error, isLoading, refetch, isRefetching } = useQuery({
    queryKey: [API_ENDPOINTS.EMERGENCY.GENERATE],
    queryFn: ({ queryKey }) => fetch(queryKey[0], { credentials: 'include' }).then(res => res.json()),
    enabled: false, // Don't run query on component mount
  });
  
  // When data is loaded, update QR code
  useEffect(() => {
    if (data && data.success && data.qrData) {
      setQrValue(data.qrData.url);
      
      // Set expiry time to 24 hours from now
      const expiry = new Date();
      expiry.setHours(expiry.getHours() + 24);
      setExpiryTime(expiry);
      
      setShowQrCode(true);
    }
  }, [data]);
  
  const handleGenerateQr = () => {
    refetch();
  };
  
  const handleCloseQr = () => {
    setShowQrCode(false);
    setQrValue('');
    setExpiryTime(null);
  };
  
  return (
    <Card className="border-primary-100">
      <CardHeader className="bg-primary-50 rounded-t-lg">
        <CardTitle className="text-lg text-primary-900">Emergency Access QR Code</CardTitle>
        <CardDescription>
          Generate a QR code that healthcare providers can scan for emergency access to your critical health information.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-6">
        {error && (
          <div className="p-4 mb-4 text-error-700 bg-error-100 rounded-md">
            <p className="font-medium">Error generating QR code</p>
            <p className="text-sm">{error.message || 'Please try again later'}</p>
          </div>
        )}
        
        {!showQrCode ? (
          <div className="text-center py-8">
            <div className="mb-4 text-neutral-600">
              <span className="material-icons text-4xl mb-2">qr_code_2</span>
              <p>This QR code will provide limited, time-based access to critical health information in emergency situations.</p>
            </div>
            <Button 
              onClick={handleGenerateQr} 
              disabled={isLoading || isRefetching}
              className="mt-2"
              size="lg"
            >
              {(isLoading || isRefetching) ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <span className="material-icons mr-2">qr_code</span>
                  Generate Emergency QR
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="bg-white p-4 inline-block rounded-lg mb-4">
              <QRCode 
                value={qrValue}
                size={200}
                level="H"
                className="mx-auto"
              />
            </div>
            
            {expiryTime && (
              <div className="text-sm text-neutral-600 mb-4">
                <p className="font-medium">Valid until:</p>
                <p>{expiryTime.toLocaleString()}</p>
                <p className="mt-2 text-error-600 text-xs font-medium">This QR code provides limited access to your emergency health information.</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-center border-t pt-4">
        {showQrCode ? (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleCloseQr}
            >
              Close
            </Button>
            <Button 
              variant="secondary"
              onClick={() => window.print()}
            >
              <span className="material-icons mr-2 text-sm">print</span>
              Print QR Code
            </Button>
          </div>
        ) : (
          <p className="text-xs text-neutral-500">
            For security, this QR code will expire after 24 hours.
          </p>
        )}
      </CardFooter>
    </Card>
  );
};

export default EmergencyQRCode;