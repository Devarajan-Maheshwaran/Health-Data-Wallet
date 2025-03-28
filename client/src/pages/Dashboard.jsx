import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import StatusCard from '@/components/StatusCard';
import ActivityList from '@/components/ActivityList';
import EmergencyQRCode from '@/components/EmergencyQRCode';
import { ACTIVITY_TYPES } from '@/constants';
import { useWallet } from '@/hooks/useWallet';
import { useContract } from '@/hooks/useContract';

const Dashboard = () => {
  const { account, isConnected } = useWallet();
  const { isPatientRegistered, getRecordCount } = useContract();
  
  const [isRegistered, setIsRegistered] = useState(false);
  const [recordCount, setRecordCount] = useState(0);
  const [accessCount, setAccessCount] = useState(2); // Mock data
  const [activities, setActivities] = useState([]);
  const [activeTab, setActiveTab] = useState('upload');
  
  // Mock patient data with emergency health information
  const [patientData, setPatientData] = useState({
    bloodType: 'O+',
    allergies: ['Penicillin', 'Peanuts'],
    emergencyContact: '+1-555-123-4567',
    medicalConditions: ['Asthma', 'Hypertension'],
    medications: ['Albuterol', 'Lisinopril']
  });
  
  // Check if patient is registered and get record count
  useEffect(() => {
    if (isConnected && account) {
      const checkPatientStatus = async () => {
        try {
          const registered = await isPatientRegistered(account);
          setIsRegistered(registered);
          
          if (registered) {
            const count = await getRecordCount(account);
            setRecordCount(count);
          }
        } catch (error) {
          console.error('Error checking patient status:', error);
        }
      };
      
      checkPatientStatus();
    }
  }, [isConnected, account, isPatientRegistered, getRecordCount]);
  
  // Mock activity data
  useEffect(() => {
    // In a real app, this would come from contract events or backend API
    setActivities([
      {
        id: '1',
        type: ACTIVITY_TYPES.UPLOAD,
        title: 'Medical record uploaded',
        status: 'Completed',
        statusColor: 'secondary',
        metadata: {
          hash: 'QmZ9gdj48hfio3j4iofj4oijf34oij',
        },
        timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 days ago
      },
      {
        id: '2',
        type: ACTIVITY_TYPES.GRANT_ACCESS,
        title: 'Access granted to Dr. Sarah Johnson',
        status: 'Active',
        statusColor: 'secondary',
        metadata: {
          address: '0x5F3c123456789abcdef123456789abcdef123456',
          addressType: 'doctor',
        },
        timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 days ago
      },
      {
        id: '3',
        type: ACTIVITY_TYPES.REVOKE_ACCESS,
        title: 'Access revoked from City Hospital',
        status: 'Revoked',
        statusColor: 'error',
        metadata: {
          address: '0xA123456789abcdef123456789abcdef123456789',
          addressType: 'hospital',
        },
        timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
      },
    ]);
  }, []);
  
  return (
    <>
      {/* Page header */}
      <div className="py-6 px-4 sm:px-6 lg:px-8 bg-white border-b border-neutral-200">
        <div className="flex items-center">
          <h1 className="text-2xl font-semibold text-neutral-900">Dashboard</h1>
          <div className="ml-auto flex items-center space-x-3">
            <EmergencyQRCode 
              patient={{
                id: '1', 
                address: account
              }} 
              patientData={patientData} 
            />
            <button 
              className="inline-flex items-center px-4 py-2 border border-neutral-300 bg-white text-sm font-medium rounded-md text-neutral-700 hover:bg-neutral-50"
              onClick={() => {
                window.location.href = '/doctor';
              }}
            >
              <span className="material-icons mr-2 text-sm">swap_horiz</span>
              Switch to Provider View
            </button>
          </div>
        </div>
      </div>
      
      {/* Dashboard content */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Health status summary cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatusCard
            icon="verified_user"
            iconBgColor="bg-primary-100"
            iconColor="text-primary-600"
            title="Vaccination Status"
            value="Up to date"
            valueColor="text-secondary-600"
            actionText="View details"
            actionUrl="/records"
          />
          
          <StatusCard
            icon="admin_panel_settings"
            iconBgColor="bg-secondary-100"
            iconColor="text-secondary-600"
            title="Active Access Grants"
            value={`${accessCount} Providers`}
            actionText="Manage access"
            actionUrl="/access"
          />
          
          <StatusCard
            icon="storage"
            iconBgColor="bg-accent-100"
            iconColor="text-accent-600"
            title="Records on Blockchain"
            value={`${recordCount} Records`}
            actionText="View all records"
            actionUrl="/records"
          />
          
          <StatusCard
            icon="receipt_long"
            iconBgColor="bg-neutral-100"
            iconColor="text-neutral-600"
            title="Last Updated"
            value="3 days ago"
            actionText="Update records"
            actionUrl="/upload"
          />
        </div>
        
        {/* Recent activity */}
        <div className="mt-8">
          <h2 className="text-lg leading-6 font-medium text-neutral-900">Recent Activity</h2>
          <div className="mt-3">
            <ActivityList activities={activities} />
          </div>
        </div>
        
        {/* Tabs for data management */}
        <div className="mt-8">
          <div className="sm:hidden">
            <label htmlFor="tabs" className="sr-only">Select a tab</label>
            <select
              id="tabs"
              name="tabs"
              className="block w-full focus:ring-primary-500 focus:border-primary-500 border-neutral-300 rounded-md"
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
            >
              <option value="upload">Upload Health Data</option>
              <option value="access">Manage Access</option>
              <option value="records">View My Records</option>
            </select>
          </div>
          <div className="hidden sm:block">
            <nav className="flex space-x-4" aria-label="Tabs">
              <Link 
                href="/upload"
                className={`${activeTab === 'upload' ? 'bg-primary-100 text-primary-700' : 'text-neutral-500 hover:text-neutral-700'} px-3 py-2 font-medium text-sm rounded-md`}
                onClick={() => setActiveTab('upload')}
              >
                Upload Health Data
              </Link>
              <Link 
                href="/access"
                className={`${activeTab === 'access' ? 'bg-primary-100 text-primary-700' : 'text-neutral-500 hover:text-neutral-700'} px-3 py-2 font-medium text-sm rounded-md`}
                onClick={() => setActiveTab('access')}
              >
                Manage Access
              </Link>
              <Link 
                href="/records"
                className={`${activeTab === 'records' ? 'bg-primary-100 text-primary-700' : 'text-neutral-500 hover:text-neutral-700'} px-3 py-2 font-medium text-sm rounded-md`}
                onClick={() => setActiveTab('records')}
              >
                View My Records
              </Link>
            </nav>
          </div>
        </div>
        
        {/* Registration prompt if not registered */}
        {isConnected && !isRegistered && (
          <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-neutral-200">
              <h3 className="text-lg leading-6 font-medium text-neutral-900">Welcome to HealthChain</h3>
              <p className="mt-1 max-w-2xl text-sm text-neutral-500">Complete your registration to start managing your health records.</p>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <Link 
                href="/register"
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Register as Patient
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Dashboard;