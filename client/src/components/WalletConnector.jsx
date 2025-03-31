import React from 'react';
import { useWallet } from '@/hooks/useWallet';
import { Button } from '@/components/ui/button';
import { shortenAddress } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const WalletConnector = () => {
  const { 
    isConnected, 
    account, 
    chainId,
    isCorrectNetwork,
    connectWallet, 
    disconnectWallet,
    switchToCorrectNetwork
  } = useWallet();
  
  if (!isConnected) {
    return (
      <Button 
        onClick={connectWallet} 
        variant="default"
        className="bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-600"
      >
        <span className="material-icons mr-2">account_balance_wallet</span>
        Connect Wallet
      </Button>
    );
  }
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={isCorrectNetwork ? "outline" : "destructive"} className="flex items-center gap-2">
          <span className="material-icons text-sm">
            {isCorrectNetwork ? 'check_circle' : 'warning'}
          </span>
          <span className="hidden md:inline">{shortenAddress(account)}</span>
          <span className="md:hidden">Wallet</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>My Wallet</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <div className="px-2 py-1.5">
          <p className="text-xs text-muted-foreground mb-1">Address</p>
          <p className="text-xs font-mono truncate">{account}</p>
        </div>
        
        <div className="px-2 py-1.5">
          <p className="text-xs text-muted-foreground mb-1">Network</p>
          <div className="flex items-center">
            <span className={`w-2 h-2 rounded-full mr-2 ${isCorrectNetwork ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <p className="text-xs">{isCorrectNetwork ? 'Connected to correct network' : 'Wrong network'}</p>
          </div>
        </div>
        
        <DropdownMenuSeparator />
        
        {!isCorrectNetwork && (
          <DropdownMenuItem 
            className="text-primary cursor-pointer"
            onClick={switchToCorrectNetwork}
          >
            <span className="material-icons mr-2 text-sm">swap_horiz</span>
            Switch Network
          </DropdownMenuItem>
        )}
        
        <DropdownMenuItem 
          onClick={disconnectWallet}
          className="text-destructive cursor-pointer"
        >
          <span className="material-icons mr-2 text-sm">logout</span>
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default WalletConnector;