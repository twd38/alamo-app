'use client';

import { useState } from 'react';
import { WorkOrderStatus } from '@prisma/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { ProductionStatusBadge } from './production-status-badge';
import { updateWorkOrder } from '@/lib/actions';
import { toast } from 'sonner';

interface StatusDropdownCellProps {
  workOrderId: string;
  currentStatus: string;
  onStatusChange?: () => void;
}

const STATUS_OPTIONS: { value: WorkOrderStatus; label: string }[] = [
  { value: WorkOrderStatus.TODO, label: 'To Do' },
  { value: WorkOrderStatus.PAUSED, label: 'Paused' },
  { value: WorkOrderStatus.MANUFACTURING, label: 'Manufacturing' },
  { value: WorkOrderStatus.QUALITY_CONTROL, label: 'Quality Control' },
  { value: WorkOrderStatus.COMPLETED, label: 'Completed' },
  { value: WorkOrderStatus.SHIP, label: 'Ship' }
];

export function StatusDropdownCell({
  workOrderId,
  currentStatus,
  onStatusChange
}: StatusDropdownCellProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus: WorkOrderStatus) => {
    if (newStatus === currentStatus) return;

    setIsUpdating(true);
    try {
      const result = await updateWorkOrder({
        workOrderId,
        status: newStatus
      });

      if (result.success) {
        toast.success(
          `Status updated to ${STATUS_OPTIONS.find((opt) => opt.value === newStatus)?.label || newStatus}`
        );
        onStatusChange?.();
      } else {
        toast.error(result.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating work order status:', error);
      toast.error('An unexpected error occurred while updating the status');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Select
        value={currentStatus}
        onValueChange={(value) => handleStatusChange(value as WorkOrderStatus)}
        disabled={isUpdating}
      >
        <SelectTrigger
          className="h-auto w-auto border-none bg-transparent p-0 shadow-none hover:bg-transparent focus:ring-0 focus:ring-offset-0 data-[state=open]:bg-transparent [&>span:first-child]:hidden"
          selectSize="sm"
        >
          <SelectValue />
          <ProductionStatusBadge status={currentStatus} />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
