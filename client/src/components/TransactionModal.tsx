import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  documentTitle?: string;
  network?: string;
  gasFee?: string;
  isProcessing?: boolean;
}

const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  documentTitle = 'Document',
  network = 'Polygon Mumbai',
  gasFee = '0.0015 MATIC',
  isProcessing = false,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4 bg-neutral-50 p-3 rounded-md">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="font-medium text-neutral-500">Document</dt>
              <dd className="text-neutral-900">{documentTitle}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium text-neutral-500">Network</dt>
              <dd className="text-neutral-900">{network}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium text-neutral-500">Est. Gas Fee</dt>
              <dd className="text-neutral-900">{gasFee}</dd>
            </div>
          </dl>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button 
            onClick={onConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionModal;
