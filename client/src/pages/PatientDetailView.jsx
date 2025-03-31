import React, { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/hooks/useWallet';
import { useContract } from '@/hooks/useContract';
import { useIpfs } from '@/hooks/useIpfs';
import { API_ENDPOINTS } from '@/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const PatientDetailView = () => {
  const [match, params] = useRoute('/patient/:id');
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { account } = useWallet();
  const { checkAccess } = useContract();
  const { fetchFromIPFS } = useIpfs();
  
  const [hasAccess, setHasAccess] = useState(false);
  const [activeRecord, setActiveRecord] = useState(null);
  const [recordContent, setRecordContent] = useState(null);
  
  // Get patient ID from URL params
  const patientId = params?.id;
  
  // Fetch patient data
  const { data: patientData, isLoading: patientLoading } = useQuery({
    queryKey: [`/api/patients/${patientId}`],
    enabled: !!patientId,
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to load patient information',
        variant: 'destructive'
      });
    }
  });
  
  // Fetch patient records
  const { data: recordsData, isLoading: recordsLoading } = useQuery({
    queryKey: [`/api/patients/${patientId}/records`],
    enabled: !!patientId && hasAccess,
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to load patient records',
        variant: 'destructive'
      });
    }
  });
  
  // Check if provider has access to this patient's records
  useEffect(() => {
    const verifyAccess = async () => {
      try {
        if (!patientId || !account) return;
        
        // In a real app, this would check the blockchain
        // For demo, just simulate access verification
        const access = true; // checkAccess(patientId, account);
        setHasAccess(access);
        
        if (!access) {
          toast({
            title: 'Access Denied',
            description: 'You do not have access to this patient\'s records',
            variant: 'destructive'
          });
        }
      } catch (error) {
        console.error('Error verifying access:', error);
        setHasAccess(false);
      }
    };
    
    verifyAccess();
  }, [patientId, account]);
  
  // Load record content when a record is selected
  useEffect(() => {
    const loadRecordContent = async () => {
      if (!activeRecord) {
        setRecordContent(null);
        return;
      }
      
      try {
        // In a real app, this would fetch from IPFS
        // For demo, create mock data
        const content = {
          type: activeRecord.recordType,
          title: activeRecord.title,
          date: new Date(activeRecord.uploadedAt).toLocaleDateString(),
          data: {
            text: `Sample content for ${activeRecord.title}`,
            values: {
              bloodPressure: "120/80",
              heartRate: "72 bpm",
              temperature: "98.6°F"
            }
          }
        };
        
        setRecordContent(content);
      } catch (error) {
        console.error('Error loading record content:', error);
        toast({
          title: 'Error',
          description: 'Failed to load record content',
          variant: 'destructive'
        });
      }
    };
    
    loadRecordContent();
  }, [activeRecord]);
  
  // If URL doesn't match, show 404
  if (!match) {
    navigate('/not-found');
    return null;
  }
  
  const patient = patientData?.patient || {
    id: patientId,
    name: 'John Doe',
    age: 45,
    gender: 'Male',
    walletAddress: '0x1234...5678'
  };
  
  const records = recordsData?.records || [];
  
  const renderRecordContent = () => {
    if (!recordContent) return null;
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold">{recordContent.title}</h3>
            <p className="text-sm text-muted-foreground">Recorded: {recordContent.date}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <span className="material-icons mr-2 text-sm">download</span>
              Download
            </Button>
            <Button variant="outline" size="sm">
              <span className="material-icons mr-2 text-sm">verified</span>
              Verify
            </Button>
          </div>
        </div>
        
        <div className="p-4 bg-muted rounded-md">
          <h4 className="font-medium mb-2">Record Data</h4>
          {Object.entries(recordContent.data.values).map(([key, value]) => (
            <div key={key} className="flex py-1 border-b last:border-0">
              <span className="w-1/3 font-medium">{key}</span>
              <span>{value}</span>
            </div>
          ))}
          <div className="mt-4 p-3 bg-background rounded border">
            <p>{recordContent.data.text}</p>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate('/doctor')}
        >
          <span className="material-icons mr-2 text-sm">arrow_back</span>
          Back
        </Button>
        <h1 className="text-2xl font-bold">Patient Details</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Patient Information</CardTitle>
          <CardDescription>
            Basic information and health records
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Patient Info Card */}
            <div className="md:col-span-1">
              <div className="p-4 border rounded-md">
                <h3 className="font-semibold text-lg mb-3">Demographics</h3>
                <div className="space-y-2">
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Name</span>
                    <span className="font-medium">{patient.name}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Age</span>
                    <span className="font-medium">{patient.age}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Gender</span>
                    <span className="font-medium">{patient.gender}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Patient ID</span>
                    <span className="font-medium">{patient.id}</span>
                  </div>
                </div>
                
                <h3 className="font-semibold text-lg mt-4 mb-3">Blockchain</h3>
                <div className="space-y-2">
                  <div className="py-1 border-b">
                    <p className="text-muted-foreground mb-1">Wallet Address</p>
                    <p className="font-mono text-xs break-all">{patient.walletAddress}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Patient Records */}
            <div className="md:col-span-2">
              <Tabs defaultValue="records" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="records">Health Records</TabsTrigger>
                  <TabsTrigger value="emergency">Emergency Info</TabsTrigger>
                </TabsList>
                
                <TabsContent value="records" className="mt-4 space-y-4">
                  {!hasAccess ? (
                    <div className="p-8 border border-red-200 bg-red-50 rounded-md text-center">
                      <span className="material-icons text-red-500 text-4xl mb-2">gpp_bad</span>
                      <h3 className="font-semibold mb-2 text-red-800">Access Required</h3>
                      <p className="text-red-700 mb-4">
                        You do not have permission to view this patient's records.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => navigate('/doctor')}
                      >
                        Return to Dashboard
                      </Button>
                    </div>
                  ) : records.length === 0 ? (
                    <div className="border p-8 rounded-md text-center">
                      <p className="text-muted-foreground">No health records available</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="col-span-1 border rounded-md overflow-hidden">
                        <div className="p-3 bg-muted font-medium">
                          Available Records
                        </div>
                        <div className="divide-y max-h-[400px] overflow-y-auto">
                          {[
                            { id: '1', title: 'Annual Physical', recordType: 'medical_history', uploadedAt: new Date() },
                            { id: '2', title: 'Blood Test Results', recordType: 'lab_results', uploadedAt: new Date() },
                            { id: '3', title: 'Vaccination Record', recordType: 'immunizations', uploadedAt: new Date() }
                          ].map(record => (
                            <div 
                              key={record.id} 
                              className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors ${activeRecord?.id === record.id ? 'bg-primary/10' : ''}`}
                              onClick={() => setActiveRecord(record)}
                            >
                              <p className="font-medium">{record.title}</p>
                              <p className="text-xs text-muted-foreground">
                                Type: {record.recordType}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="col-span-1 md:col-span-2 border rounded-md">
                        <div className="p-3 bg-muted font-medium">
                          Record Details
                        </div>
                        <div className="p-4 min-h-[200px]">
                          {activeRecord ? renderRecordContent() : (
                            <div className="h-full flex items-center justify-center text-muted-foreground">
                              <p>Select a record to view details</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="emergency" className="mt-4">
                  <div className="p-4 border rounded-md bg-red-50">
                    <h3 className="font-semibold text-lg mb-3 text-red-800">
                      <span className="material-icons mr-2 align-text-bottom">emergency</span>
                      Emergency Information
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="bg-white p-3 rounded-md border">
                        <h4 className="font-medium mb-2">Allergies</h4>
                        <ul className="list-disc pl-5">
                          <li>Penicillin</li>
                          <li>Shellfish</li>
                        </ul>
                      </div>
                      
                      <div className="bg-white p-3 rounded-md border">
                        <h4 className="font-medium mb-2">Current Medications</h4>
                        <ul className="list-disc pl-5">
                          <li>Lisinopril 10mg - once daily</li>
                          <li>Metformin 500mg - twice daily</li>
                        </ul>
                      </div>
                      
                      <div className="bg-white p-3 rounded-md border">
                        <h4 className="font-medium mb-2">Emergency Contact</h4>
                        <p><span className="font-medium">Name:</span> Jane Doe</p>
                        <p><span className="font-medium">Relationship:</span> Spouse</p>
                        <p><span className="font-medium">Phone:</span> (123) 456-7890</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientDetailView;