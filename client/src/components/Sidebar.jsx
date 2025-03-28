import React from 'react';
import { Link, useLocation } from 'wouter';
import { NAV_ITEMS } from '@/constants';
import { useWallet } from '@/hooks/useWallet';
import { shortenAddress } from '@/lib/utils';

const Sidebar = () => {
  const [location] = useLocation();
  const { account } = useWallet();

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64 border-r border-neutral-200">
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-primary-600">
          <div className="flex items-center justify-center flex-shrink-0 px-4">
            <div className="h-8 w-auto flex items-center text-white font-bold text-xl gap-2">
              <span className="material-icons">healing</span>
              HealthChain
            </div>
          </div>
          <div className="mt-5 flex-1 flex flex-col">
            <nav className="flex-1 px-2 space-y-1">
              {NAV_ITEMS.map((item) => (
                <div key={item.path}>
                  <Link 
                    href={item.path}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      location === item.path 
                        ? 'text-white bg-primary-700' 
                        : 'text-primary-100 hover:bg-primary-700'
                    }`}
                  >
                    <span className={`material-icons mr-3 ${
                      location === item.path 
                        ? 'text-white' 
                        : 'text-primary-300'
                    }`}>
                      {item.icon}
                    </span>
                    {item.name}
                  </Link>
                </div>
              ))}
            </nav>
          </div>
          {/* User profile section */}
          <div className="flex-shrink-0 flex border-t border-primary-700 p-4">
            <div className="flex items-center">
              <div>
                <div className="text-white text-sm font-medium">Patient Profile</div>
                <div className="text-primary-200 text-xs">
                  {shortenAddress(account, 4)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;