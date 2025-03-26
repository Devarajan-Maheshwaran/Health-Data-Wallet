import React, { useState } from 'react';
import WalletConnector from './WalletConnector';

const TopNavbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
      <button 
        className="md:hidden px-4 border-r border-neutral-200 text-neutral-500 focus:outline-none focus:bg-neutral-100"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        <span className="material-icons">menu</span>
      </button>
      <div className="flex-1 px-4 flex justify-between">
        <div className="flex-1 flex items-center">
          <div className="w-full max-w-2xl">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                <span className="material-icons text-neutral-400">search</span>
              </div>
              <input 
                className="block w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-md text-sm placeholder-neutral-500 focus:outline-none focus:border-primary-500" 
                placeholder="Search health records..." 
                type="search"
              />
            </div>
          </div>
        </div>
        
        <WalletConnector />
        
        <div className="ml-3 relative">
          <button className="bg-white p-1 rounded-full text-neutral-400 hover:text-neutral-500 focus:outline-none">
            <span className="material-icons">notifications_none</span>
          </button>
        </div>
        
        <div className="ml-3 relative">
          <div>
            <button className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none">
              <div className="h-8 w-8 rounded-full bg-primary-200 flex items-center justify-center text-primary-600">JD</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopNavbar;
