import React, { useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';
import { shortenAddress } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import QRCodeScanner from '@/components/QRCodeScanner';

const DoctorDashboard = () => {
  const { account, isConnected } = useWallet();
  const { toast } = useToast();
  
  const [patients, setPatients] = useState([
    {
      id: '1',
      name: 'John Doe',
      address: '0x5F3c123456789abcdef123456789abcdef123456',
      status: 'Active',
      lastUpdated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      records: 12
    },
    {
      id: '2',
      name: 'Jane Smith',
      address: '0xA123456789abcdef123456789abcdef123456789',
      status: 'Active',
      lastUpdated: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      records: 8
    },
    {
      id: '3',
      name: 'Robert Johnson',
      address: '0xB123456789abcdef123456789abcdef123456789',
      status: 'Pending',
      lastUpdated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      records: 0
    }
  ]);
  
  // Stats for the doctor's dashboard
  const stats = {
    totalPatients: patients.length,
    activePatients: patients.filter(p => p.status === 'Active').length,
    pendingRequests: patients.filter(p => p.status === 'Pending').length,
    recentUpdates: 5
  };
  
  return (
    <>
      {/* Page header */}
      <div className="py-6 px-4 sm:px-6 lg:px-8 bg-white border-b border-neutral-200">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-neutral-900">Doctor Dashboard</h1>
          <div className="flex items-center gap-2">
            <QRCodeScanner />
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => {
                toast({
                  title: "Switching View",
                  description: "Navigating to patient view...",
                });
                // In a real app, this would use proper navigation
                setTimeout(() => {
                  window.location.href = '/';
                }, 1000);
              }}
            >
              <span className="material-icons text-sm">swap_horiz</span>
              Switch to Patient View
            </Button>
          </div>
        </div>
      </div>
      
      {/* Dashboard content */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start">
              <div className="bg-primary-100 rounded-full p-3">
                <span className="material-icons text-primary-600">people</span>
              </div>
              <div className="ml-5">
                <h3 className="text-lg font-medium text-neutral-900">Patients</h3>
                <p className="mt-1 text-2xl font-semibold">{stats.totalPatients}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start">
              <div className="bg-secondary-100 rounded-full p-3">
                <span className="material-icons text-secondary-600">how_to_reg</span>
              </div>
              <div className="ml-5">
                <h3 className="text-lg font-medium text-neutral-900">Active</h3>
                <p className="mt-1 text-2xl font-semibold">{stats.activePatients}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start">
              <div className="bg-accent-100 rounded-full p-3">
                <span className="material-icons text-accent-600">pending_actions</span>
              </div>
              <div className="ml-5">
                <h3 className="text-lg font-medium text-neutral-900">Pending</h3>
                <p className="mt-1 text-2xl font-semibold">{stats.pendingRequests}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start">
              <div className="bg-neutral-100 rounded-full p-3">
                <span className="material-icons text-neutral-600">update</span>
              </div>
              <div className="ml-5">
                <h3 className="text-lg font-medium text-neutral-900">Updates</h3>
                <p className="mt-1 text-2xl font-semibold">{stats.recentUpdates}</p>
              </div>
            </div>
          </Card>
        </div>
        
        {/* Patient List */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg leading-6 font-medium text-neutral-900">Your Patients</h2>
            <Button variant="outline" className="text-sm">
              <span className="material-icons mr-1 text-sm">person_add</span>
              Request Access
            </Button>
          </div>
          
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Wallet Address
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Records
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {patients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-neutral-900">{patient.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-500 font-mono">{shortenAddress(patient.address)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        patient.status === 'Active'
                          ? 'bg-secondary-100 text-secondary-800'
                          : 'bg-neutral-100 text-neutral-800'
                      }`}>
                        {patient.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                      {patient.lastUpdated.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                      {patient.records}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {patient.status === 'Active' ? (
                        <Button
                          variant="ghost"
                          className="text-primary-600 hover:text-primary-900 text-sm"
                          onClick={() => {
                            window.location.href = `/patient/${patient.id}`;
                          }}
                        >
                          View Records
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          className="text-neutral-600 hover:text-neutral-900 text-sm"
                          disabled={true}
                        >
                          Pending
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Recent Activity */}
        <div className="mt-8">
          <h2 className="text-lg leading-6 font-medium text-neutral-900 mb-4">Recent Activity</h2>
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <ul className="divide-y divide-neutral-200">
              <li className="px-6 py-4 flex items-center">
                <div className="bg-primary-100 rounded-full p-2 mr-4">
                  <span className="material-icons text-primary-600 text-sm">folder_open</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-900">
                    Accessed medical records for <span className="font-semibold">John Doe</span>
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">Today, 10:30 AM</p>
                </div>
              </li>
              <li className="px-6 py-4 flex items-center">
                <div className="bg-secondary-100 rounded-full p-2 mr-4">
                  <span className="material-icons text-secondary-600 text-sm">how_to_reg</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-900">
                    Access granted by <span className="font-semibold">Jane Smith</span>
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">Yesterday, 2:45 PM</p>
                </div>
              </li>
              <li className="px-6 py-4 flex items-center">
                <div className="bg-neutral-100 rounded-full p-2 mr-4">
                  <span className="material-icons text-neutral-600 text-sm">comment</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-900">
                    Added notes to <span className="font-semibold">Robert Johnson</span>'s record
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">Yesterday, 9:15 AM</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default DoctorDashboard;