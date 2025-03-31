import React from 'react';
import { useLocation } from 'wouter';
import { useWallet } from '@/hooks/useWallet';
import { NAV_ITEMS } from '@/constants';
import { Button } from '@/components/ui/button';
import { shortenAddress } from '@/lib/utils';
import WalletConnector from './WalletConnector';

const TopNavbar = () => {
  const [location] = useLocation();
  const { isConnected, account } = useWallet();
  
  // Find the current page title
  const currentPage = NAV_ITEMS.find(item => item.href === location) || { title: 'Dashboard' };
  
  return (
    <header className="border-b bg-white sticky top-0 z-40">
      <div className="container mx-auto flex items-center justify-between p-4">
        <div className="flex items-center">
          {/* Hidden on mobile as it's in the sidebar */}
          <h1 className="hidden md:block text-xl font-bold text-primary">
            {currentPage.title}
          </h1>
          
          {/* Visible on mobile only */}
          <h1 className="md:hidden text-xl font-bold text-primary">
            Health Chain
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <WalletConnector />
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;