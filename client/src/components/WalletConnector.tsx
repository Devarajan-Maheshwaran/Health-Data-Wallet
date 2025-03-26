import React from 'react';
import { useWallet } from '@/hooks/useWallet';
import { shortenAddress } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const WalletConnector: React.FC = () => {
  const { isConnected, account, connect, disconnect } = useWallet();
  const { toast } = useToast();

  const handleConnect = async () => {
    try {
      await connect();
      toast({
        title: "Wallet Connected",
        description: "Your wallet has been connected successfully.",
        variant: "default",
      });
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Could not connect to wallet",
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = () => {
    disconnect();
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected.",
      variant: "default",
    });
  };

  return (
    <div className="ml-4 flex items-center md:ml-6">
      {!isConnected ? (
        <Button
          onClick={handleConnect}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 flex items-center"
        >
          <span className="material-icons mr-2">account_balance_wallet</span>
          Connect Wallet
        </Button>
      ) : (
        <div className="flex items-center bg-neutral-100 rounded-md border border-neutral-200 px-3 py-1 text-sm">
          <div className="h-2 w-2 rounded-full bg-secondary-500 mr-2"></div>
          <span className="text-neutral-700 font-mono">{shortenAddress(account, 4)}</span>
          <div 
            className="ml-2 cursor-pointer text-neutral-500"
            onClick={handleDisconnect}
          >
            <span className="material-icons text-sm">close</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletConnector;
