'use client';

import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import {
  generatePartLabelZPL,
  sendZPLToPrinter,
  type PartLabelData
} from '@/lib/label-printing';
import { toast } from 'sonner';

interface PrintLabelButtonProps {
  workOrderNumber: string;
  partNumber: string;
  partName?: string;
  quantity?: number;
  dueDate?: string;
  workOrderId?: string;
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
      const zplCode = generatePartLabelZPL(labelData);
      await sendZPLToPrinter(zplCode, '192.168.1.148');
      toast.success('Label sent to printer via network');
    } catch (error) {
      console.error('Network print error:', error);
      toast.error('Failed to reach printer. Please check printer connection.');
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
