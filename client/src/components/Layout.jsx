import React from 'react';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import { useLocation } from 'wouter';
import { useWallet } from '@/hooks/useWallet';

const Layout = ({ children }) => {
  const [location] = useLocation();
  const { isConnected } = useWallet();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <TopNavbar />
        
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;