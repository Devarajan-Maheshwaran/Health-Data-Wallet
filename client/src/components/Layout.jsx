import React from 'react';
import { useLocation } from 'wouter';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';

const Layout = ({ children }) => {
  const [location] = useLocation();
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopNavbar />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;