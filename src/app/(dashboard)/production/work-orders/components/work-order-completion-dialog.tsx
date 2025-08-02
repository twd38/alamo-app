'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { CheckCircle, LogOut } from 'lucide-react';
import { completeWorkOrderAndClockOut } from '@/lib/actions';
import { useRouter } from 'next/navigation';

interface WorkOrderCompletionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  workOrderId: string;
  workOrderNumber: string;
  partName: string;
}

export function WorkOrderCompletionDialog({
  isOpen,
  onOpenChange,
  workOrderId,
  workOrderNumber,
  partName
}: WorkOrderCompletionDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  const handleClockOutAndReturn = async () => {
    setIsProcessing(true);
    try {
      const result = await completeWorkOrderAndClockOut(workOrderId);

      if (result.success) {
        router.push('/production');
        onOpenChange(false);
      } else {
        console.error('Failed to complete work order:', result.error);
        // You could show a toast notification here
      }
    } catch (error) {
      console.error('Error completing work order:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <DialogTitle className="text-xl font-semibold">
            Work Order Completed!
          </DialogTitle>
          <DialogDescription className="text-base">
            Work order <span className="font-medium">{workOrderNumber}</span>{' '}
            for <span className="font-medium">{partName}</span> has been
            successfully completed.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            onClick={handleClockOutAndReturn}
            disabled={isProcessing}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {isProcessing
              ? 'Processing...'
              : 'Clock Out and Return to Work Orders'}
          </Button>

          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isProcessing}
            className="w-full"
          >
            Stay on This Page
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
