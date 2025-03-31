import React, { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useIsMobile } from '@/hooks/use-mobile';
import { NAV_ITEMS } from '@/constants';
import { useWallet } from '@/hooks/useWallet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const Sidebar = () => {
  const [location] = useLocation();
  const { isConnected, account } = useWallet();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  
  // Filter navigation items based on user role
  // In a real app, you'd have user roles stored in the context
  const filteredNavItems = NAV_ITEMS.filter(item => {
    // For this prototype, if the item requires a role, only show it if the user is connected
    if (item.roleRequired) {
      return isConnected;
    }
    return true;
  });
  
  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-4 py-6">
        <h2 className="text-xl font-bold text-primary mb-1">Health Chain</h2>
        <p className="text-sm text-muted-foreground">Secure Health Data Management</p>
      </div>
      
      <Separator />
      
      <nav className="flex-1 px-2 py-4">
        <ul className="space-y-1">
          {filteredNavItems.map((item) => {
            const isActive = location === item.href;
            
            return (
              <li key={item.href}>
                <Link href={item.href}>
                  <a 
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                      isActive 
                        ? 'bg-primary/10 text-primary' 
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                    onClick={() => isMobile && setIsOpen(false)}
                  >
                    <span className="material-icons mr-2 text-lg">{item.icon}</span>
                    {item.title}
                  </a>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="px-4 py-4 mt-auto border-t">
        <div className="flex flex-col gap-2">
          {isConnected ? (
            <div className="mb-2">
              <p className="text-xs text-muted-foreground mb-1">Connected Wallet</p>
              <p className="text-xs font-mono bg-muted p-2 rounded truncate">{account}</p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground mb-2">Connect your wallet to access all features</p>
          )}
        </div>
      </div>
    </div>
  );
  
  // Mobile sidebar with sheet component
  if (isMobile) {
    return (
      <>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="absolute top-4 left-4 z-50 md:hidden">
              <span className="material-icons">menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[240px]">
            <NavContent />
          </SheetContent>
        </Sheet>
      </>
    );
  }
  
  // Desktop sidebar
  return (
    <div className="hidden md:block w-[240px] border-r bg-card">
      <NavContent />
    </div>
  );
};

export default Sidebar;