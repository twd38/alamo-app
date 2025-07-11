'use client';

import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { type PartLabelData } from '@/lib/label-printing';
import { toast } from 'sonner';

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
  printerSerialNumber = 'D2J185007015',
  variant = 'outline',
  size = 'default',
  className
}: PrintLabelButtonProps) {
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
      Print Label
    </Button>
  );
}
