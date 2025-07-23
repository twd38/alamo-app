'use client';

import { useState, useEffect } from 'react';
import { WorkOrderStatus } from '@prisma/client';
import { updateWorkOrder } from '@/lib/actions';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { UserSelect } from '@/components/user-select';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Prisma } from '@prisma/client';

type WorkOrder = Prisma.WorkOrderGetPayload<{
  include: {
    part: {
      include: {
        bomParts: {
          include: {
            part: true;
          };
        };
      };
    };
    assignees: true;
    files: true;
  };
}>;

interface WorkOrderDetailsEditorProps {
  workOrder: WorkOrder;
  users: User[];
  onUpdate: () => void;
}

export function WorkOrderDetailsEditor({
  workOrder,
  users,
  onUpdate
}: WorkOrderDetailsEditorProps) {
  const [editingDueDate, setEditingDueDate] = useState<string>('');
  const [editingQuantity, setEditingQuantity] = useState<string>('');
  const [editingAssignees, setEditingAssignees] = useState<string[]>([]);
  const [editingStatus, setEditingStatus] = useState<WorkOrderStatus>(
    WorkOrderStatus.TODO
  );

  // Initialize editable fields when work order data loads
  useEffect(() => {
    if (workOrder) {
      setEditingDueDate(
        workOrder.dueDate
          ? new Date(workOrder.dueDate).toISOString().split('T')[0]
          : ''
      );
      setEditingQuantity(workOrder.partQty.toString());
      setEditingAssignees(workOrder.assignees.map((a) => a.userId));
      setEditingStatus(workOrder.status as WorkOrderStatus);
    }
  }, [workOrder]);

  const handleDueDateChange = async (newDueDate: string) => {
    setEditingDueDate(newDueDate);
    try {
      const dueDate = newDueDate ? new Date(newDueDate) : null;
      const result = await updateWorkOrder({
        workOrderId: workOrder.id,
        dueDate
      });

      if (result.success) {
        onUpdate();
        toast.success('Due date updated successfully');
      } else {
        toast.error(result.error || 'Failed to update due date');
      }
    } catch (error) {
      console.error('Error updating due date:', error);
      toast.error('Failed to update due date');
    }
  };

  const handleQuantityChange = async (newQuantity: string) => {
    setEditingQuantity(newQuantity);
    const qty = parseInt(newQuantity);
    if (qty > 0) {
      try {
        const result = await updateWorkOrder({
          workOrderId: workOrder.id,
          partQty: qty
        });

        if (result.success) {
          onUpdate();
          toast.success('Quantity updated successfully');
        } else {
          toast.error(result.error || 'Failed to update quantity');
        }
      } catch (error) {
        console.error('Error updating quantity:', error);
        toast.error('Failed to update quantity');
      }
    }
  };

  const handleAssigneesChange = async (newAssigneeIds: string | string[]) => {
    const assigneeIds = Array.isArray(newAssigneeIds) ? newAssigneeIds : [];
    setEditingAssignees(assigneeIds);

    try {
      const result = await updateWorkOrder({
        workOrderId: workOrder.id,
        assigneeIds
      });

      if (result.success) {
        onUpdate();
        toast.success('Assignees updated successfully');
      } else {
        toast.error(result.error || 'Failed to update assignees');
      }
    } catch (error) {
      console.error('Error updating assignees:', error);
      toast.error('Failed to update assignees');
    }
  };

  const handleStatusChange = async (newStatus: WorkOrderStatus) => {
    setEditingStatus(newStatus);
    console.log('newStatus', newStatus);
    try {
      const result = await updateWorkOrder({
        workOrderId: workOrder.id,
        status: newStatus
      });

      if (result.success) {
        onUpdate();
        toast.success('Status updated successfully');
      } else {
        toast.error(result.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const getStatusOptions = () => {
    return [
      { value: WorkOrderStatus.TODO, label: 'To Do' },
      { value: WorkOrderStatus.HOLD, label: 'Hold' },
      { value: WorkOrderStatus.IN_PROGRESS, label: 'In Progress' },
      { value: WorkOrderStatus.PAUSED, label: 'Paused' },
      { value: WorkOrderStatus.COMPLETED, label: 'Completed' },
      { value: WorkOrderStatus.SCRAPPED, label: 'Scrapped' }
    ];
  };

  return (
    <div className="p-4 h-full overflow-y-auto">
      <div className="mx-auto space-y-6">
        {/* Overview Details */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Part Name</label>
                  <div className="mt-1 font-medium">
                    {workOrder.part.name || workOrder.part.description}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Part Number</label>
                  <Link
                    href={`/parts/library/${workOrder.part.id}`}
                    className="mt-1 font-mono block underline"
                  >
                    {workOrder.part.partNumber}
                  </Link>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Quantity</label>
                  <div className="mt-1 flex items-center gap-2">
                    <Input
                      type="number"
                      min="1"
                      value={editingQuantity}
                      onChange={(e) => setEditingQuantity(e.target.value)}
                      onBlur={(e) => handleQuantityChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleQuantityChange(editingQuantity);
                        }
                      }}
                      className="w-20"
                    />
                    <span className="text-md">{workOrder.part.unit}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Assignees</label>
                  <div className="mt-1">
                    <UserSelect
                      users={users}
                      value={editingAssignees}
                      onChange={handleAssigneesChange}
                      multiSelect={true}
                      placeholder="Select assignees..."
                      className=""
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Due Date</label>
                  <div className="mt-1">
                    <Input
                      type="date"
                      value={editingDueDate}
                      onChange={(e) => setEditingDueDate(e.target.value)}
                      onBlur={(e) => handleDueDateChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleDueDateChange(editingDueDate);
                        }
                      }}
                      className="w-auto"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <div className="mt-1">
                    <Select
                      value={editingStatus}
                      onValueChange={(value) =>
                        handleStatusChange(value as WorkOrderStatus)
                      }
                    >
                      <SelectTrigger
                        className="w-auto min-w-[150px]"
                        selectSize="sm"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getStatusOptions().map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {workOrder.notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Notes
                    </label>
                    <div className="mt-1 text-sm bg-gray-50 p-3 rounded-md">
                      {workOrder.notes}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bill of Materials */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Bill of Materials</CardTitle>
            <CardDescription>
              Components and materials required for this part
            </CardDescription>
          </CardHeader>
          <CardContent>
            {workOrder.part.bomParts?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">
                        Part Number
                      </th>
                      <th className="text-left py-3 px-4 font-medium">Name</th>
                      <th className="text-left py-3 px-4 font-medium">
                        Quantity
                      </th>
                      <th className="text-left py-3 px-4 font-medium">
                        Total Qty
                      </th>
                      <th className="text-left py-3 px-4 font-medium">Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workOrder.part.bomParts.map((bomPart) => (
                      <tr
                        key={bomPart.id}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="py-3 px-4 font-mono text-sm">
                          {bomPart.part?.partNumber}
                        </td>
                        <td className="py-3 px-4">
                          {bomPart.part?.name || bomPart.part?.description}
                        </td>
                        <td className="py-3 px-4 text-center">{bomPart.qty}</td>
                        <td className="py-3 px-4 text-center font-semibold">
                          {bomPart.qty * workOrder.partQty}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {bomPart.part?.unit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No bill of materials defined for this part
              </div>
            )}
          </CardContent>
        </Card>

        {/* Files */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Files</CardTitle>
            <CardDescription>
              Documents and files associated with this work order
            </CardDescription>
          </CardHeader>
          <CardContent>
            {workOrder.files?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {workOrder.files.map((file) => (
                  <div
                    key={file.id}
                    className="border rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm truncate">
                          {file.name}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">
                          {file.type}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(file.url, '_blank')}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No files attached to this work order
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
