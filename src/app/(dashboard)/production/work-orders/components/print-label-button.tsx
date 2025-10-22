'use client';

import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { type PartLabelData } from '@/lib/label-printing';
import { toast } from 'sonner';
import { markLabelsAsPrinted } from '@/lib/actions';
import { useRouter } from 'next/navigation';

interface PrintLabelButtonProps {
  workOrderNumber: string;
  partNumber: string;
  partName?: string;
  quantity?: number;
  dueDate?: string;
  workOrderId?: string;
  printerSerialNumber?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function PrintLabelButton({
  workOrderNumber,
  partNumber,
  partName,
  quantity,
  dueDate,
  workOrderId,
  printerSerialNumber = 'D8N252402228',
  variant = 'outline',
  size = 'default',
  className
}: PrintLabelButtonProps) {
  const router = useRouter();

  // Get base URL for QR code
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const labelData: PartLabelData = {
    workOrderNumber,
    partNumber,
    partName,
    quantity,
    dueDate,
    workOrderId,
    baseUrl
  };

  const handlePrint = async () => {
    try {
      // Send print request to Zebra Cloud API
      const response = await fetch('/api/print-label', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          labelData,
          printerSerialNumber
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success(
          `Label sent to printer ${result.printerSerialNumber} via ${result.method}`
        );

        // Mark labels as printed if workOrderId is provided
        if (workOrderId) {
          const markResult = await markLabelsAsPrinted(workOrderId);
          if (markResult.success) {
            // Refresh the page to update the UI
            router.refresh();
          } else {
            console.error(
              'Failed to mark labels as printed:',
              markResult.error
            );
            // Don't show error toast as the print itself was successful
          }
        }
      } else {
        toast.error(result.error || 'Failed to send label to printer');
      }
    } catch (error) {
      console.error('Print API error:', error);
      toast.error('Failed to communicate with print server');
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handlePrint}
    >
      <Printer className="h-4 w-4 mr-2" />
      Print Labels
    </Button>
  );
}
