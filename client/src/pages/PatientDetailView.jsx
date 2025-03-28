import React, { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { formatDate, shortenAddress } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const PatientDetailView = () => {
  const [, params] = useRoute('/patient/:id');
  const patientId = params?.id;
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('records');
  const [showRecordDialog, setShowRecordDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  
  // Mock patient data - in a real app, this would be fetched from API
  const [patient, setPatient] = useState({
    id: patientId,
    name: 'John Doe',
    address: '0x5F3c123456789abcdef123456789abcdef123456',
    dateOfBirth: '1985-06-15',
    gender: 'Male',
    bloodType: 'O+',
    allergies: ['Penicillin', 'Peanuts'],
    emergencyContact: '+1-555-123-4567',
    status: 'Active',
    lastUpdated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  });
  
  const [records, setRecords] = useState([
    {
      id: 1,
      recordType: 'Vaccination',
      title: 'COVID-19 Vaccination Record',
      ipfsHash: 'QmZ9gdj48hfio3j4iofj4oijf34oij',
      timestamp: Date.now() - 30 * 24 * 60 * 60 * 1000,
    },
    {
      id: 2,
      recordType: 'Lab Results',
      title: 'Blood Test Results',
      ipfsHash: 'QmA1b2c3d4e5f6g7h8i9j0k1l2m3n4o5',
      timestamp: Date.now() - 60 * 24 * 60 * 60 * 1000,
    },
    {
      id: 3,
      recordType: 'Prescription',
      title: 'Antibiotic Prescription',
      ipfsHash: 'QmV5w6x7y8z9a1b2c3d4e5f6g7h8i9j',
      timestamp: Date.now() - 90 * 24 * 60 * 60 * 1000,
    },
    {
      id: 4,
      recordType: 'Medical Image',
      title: 'Chest X-Ray',
      ipfsHash: 'QmP1o2i3u4y5t6r7e8w9q0a1s2d3f4',
      timestamp: Date.now() - 120 * 24 * 60 * 60 * 1000,
    }
  ]);
  
  const handleViewRecord = (record) => {
    setSelectedRecord(record);
    setShowRecordDialog(true);
  };
  
  const handleDownload = async () => {
    if (!selectedRecord) return;
    
    try {
      // In a real app, this would trigger a download
      toast({
        title: "Download Started",
        description: "The encrypted file will be downloaded shortly",
      });
    } catch (error) {
      console.error('Error downloading record:', error);
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Failed to download the record",
        variant: "destructive",
      });
    }
  };
  
  return (
    <>
      {/* Page header */}
      <div className="py-6 px-4 sm:px-6 lg:px-8 bg-white border-b border-neutral-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button 
              className="mr-4 p-1 rounded-full hover:bg-neutral-100"
              onClick={() => window.location.href = '/doctor'}
            >
              <span className="material-icons">arrow_back</span>
            </button>
            <h1 className="text-2xl font-semibold text-neutral-900">
              Patient: {patient.name}
            </h1>
          </div>
          <Button
            variant="outline"
            className="flex items-center gap-1"
          >
            <span className="material-icons text-sm">print</span>
            Print Summary
          </Button>
        </div>
      </div>
      
      {/* Patient Information */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white shadow sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-neutral-900">Patient Information</h3>
              <p className="mt-1 max-w-2xl text-sm text-neutral-500">Personal details and health summary</p>
            </div>
            <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${
              patient.status === 'Active'
                ? 'bg-secondary-100 text-secondary-800'
                : 'bg-neutral-100 text-neutral-800'
            }`}>
              {patient.status}
            </span>
          </div>
          <div className="border-t border-neutral-200 px-4 py-5 sm:px-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <dt className="text-sm font-medium text-neutral-500">Full name</dt>
                <dd className="mt-1 text-sm text-neutral-900">{patient.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-neutral-500">Date of birth</dt>
                <dd className="mt-1 text-sm text-neutral-900">{new Date(patient.dateOfBirth).toLocaleDateString()}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-neutral-500">Gender</dt>
                <dd className="mt-1 text-sm text-neutral-900">{patient.gender}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-neutral-500">Blood type</dt>
                <dd className="mt-1 text-sm text-neutral-900 font-semibold">{patient.bloodType}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-neutral-500">Allergies</dt>
                <dd className="mt-1 text-sm text-neutral-900">
                  {patient.allergies.length > 0 ? (
                    <ul className="list-disc pl-4 text-error-600">
                      {patient.allergies.map((allergy, index) => (
                        <li key={index}>{allergy}</li>
                      ))}
                    </ul>
                  ) : (
                    'None reported'
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-neutral-500">Emergency contact</dt>
                <dd className="mt-1 text-sm text-neutral-900">{patient.emergencyContact}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-neutral-500">Wallet address</dt>
                <dd className="mt-1 text-sm text-neutral-900 font-mono">{shortenAddress(patient.address)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-neutral-500">Last updated</dt>
                <dd className="mt-1 text-sm text-neutral-900">{patient.lastUpdated.toLocaleDateString()}</dd>
              </div>
            </dl>
          </div>
        </div>
        
        {/* Tabs for different sections */}
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="mb-4">
            <TabsTrigger value="records">Health Records</TabsTrigger>
            <TabsTrigger value="visits">Visit History</TabsTrigger>
            <TabsTrigger value="notes">Doctor Notes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="records" className="mt-2">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {records.map((record) => (
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
                        <span>{formatDate(record.timestamp)}</span>
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
          </TabsContent>
          
          <TabsContent value="visits" className="mt-2">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Visit Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Provider
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Diagnosis
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">2023-03-15</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">Annual Checkup</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">Dr. Sarah Johnson</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">Healthy</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button className="text-primary-600 hover:text-primary-900">View Details</button>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">2022-11-22</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">Urgent Care</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">Dr. Michael Williams</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">Bronchitis</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button className="text-primary-600 hover:text-primary-900">View Details</button>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">2022-08-05</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">Follow-up</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">Dr. Sarah Johnson</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">Recovery - Monitoring</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button className="text-primary-600 hover:text-primary-900">View Details</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </TabsContent>
          
          <TabsContent value="notes" className="mt-2">
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-neutral-200">
                <h3 className="text-lg leading-6 font-medium text-neutral-900">Doctor Notes</h3>
                <p className="mt-1 max-w-2xl text-sm text-neutral-500">Private notes from healthcare providers</p>
              </div>
              <div className="px-4 py-5 sm:p-6 space-y-6">
                <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-sm font-medium text-neutral-900">Annual Checkup Notes</p>
                      <p className="text-xs text-neutral-500">2023-03-15 by Dr. Sarah Johnson</p>
                    </div>
                    <span className="bg-secondary-100 text-secondary-800 text-xs px-2 py-1 rounded-full font-medium">Recent</span>
                  </div>
                  <p className="text-sm text-neutral-700">
                    Patient appears in good health. Blood pressure is normal at 120/80. Weight is stable. 
                    Recommended continued exercise and balanced diet. No concerns at this time.
                  </p>
                </div>
                
                <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-sm font-medium text-neutral-900">Urgent Care Visit</p>
                      <p className="text-xs text-neutral-500">2022-11-22 by Dr. Michael Williams</p>
                    </div>
                  </div>
                  <p className="text-sm text-neutral-700">
                    Patient presented with persistent cough, fever (101.2°F), and chest congestion for 5 days.
                    Diagnosed with acute bronchitis. Prescribed antibiotics and recommended rest for 7 days.
                    Follow-up in 2 weeks if symptoms persist.
                  </p>
                </div>
                
                <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-sm font-medium text-neutral-900">Follow-up Appointment</p>
                      <p className="text-xs text-neutral-500">2022-08-05 by Dr. Sarah Johnson</p>
                    </div>
                  </div>
                  <p className="text-sm text-neutral-700">
                    Patient recovering well from bronchitis. Lung sounds clear, no more coughing.
                    Completed antibiotics course with no side effects. Cleared to return to normal activities.
                  </p>
                </div>
                
                <div className="mt-6">
                  <Button>
                    <span className="material-icons mr-1 text-sm">add</span>
                    Add New Note
                  </Button>
                </div>
              </div>
            </div>
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
                  <dd className="mt-1 text-sm text-neutral-900">{formatDate(selectedRecord.timestamp)}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-neutral-500">IPFS Hash</dt>
                  <dd className="mt-1 text-sm font-mono text-neutral-900 break-all">{selectedRecord.ipfsHash}</dd>
                </div>
                
                <div className="pt-4">
                  <p className="text-sm text-neutral-500">
                    This record is encrypted and stored on IPFS. You can download the encrypted file for viewing.
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

export default PatientDetailView;