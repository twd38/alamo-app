'use client';

import useSWR from 'swr';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  getWorkOrderWorkInstructions,
  getWorkOrder,
  getAllUsers
} from '@/lib/queries';
import {
  updateWorkOrderWorkInstructionStep,
  createWorkOrderWorkInstructionStep,
  deleteWorkOrderWorkInstructionStep,
  reorderWorkOrderWorkInstructionSteps,
  updateWorkOrder
} from '@/lib/actions';
import { WorkOrderStatus } from '@prisma/client';
import { WorkInstructionsEditor } from '@/components/work-instructions';
import BasicTopBar from '@/components/layouts/basic-top-bar';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Book, Clipboard, Box, Loader2 } from 'lucide-react';
import { UserSelect } from '@/components/user-select';
import AutodeskViewer from '@/components/autodesk-viewer';
import PageContainer from '@/components/page-container';
import { toast } from 'sonner';

// *** Work Order Work Instructions Editor *** (Main Component)
const WorkOrderWorkInstructionsEditor: React.FC = () => {
  const params = useParams();
  const workOrderId = params.workOrderId as string;
  const [activeTab, setActiveTab] = useState('details');

  // Editable field states
  const [editingDueDate, setEditingDueDate] = useState<string>('');
  const [editingQuantity, setEditingQuantity] = useState<string>('');
  const [editingAssignees, setEditingAssignees] = useState<string[]>([]);
  const [editingStatus, setEditingStatus] = useState<WorkOrderStatus>(
    WorkOrderStatus.TODO
  );

  const {
    data: workOrder,
    isLoading: isWorkOrderLoading,
    mutate: mutateWorkOrder
  } = useSWR(`/api/work-orders/${workOrderId}`, () =>
    getWorkOrder(workOrderId)
  );

  const {
    data: workInstructions,
    isLoading: isWorkInstructionsLoading,
    mutate
  } = useSWR(`/api/work-orders/${workOrderId}/work-instructions`, () =>
    getWorkOrderWorkInstructions(workOrderId)
  );

  const { data: users, isLoading: isUsersLoading } = useSWR(
    '/api/users',
    getAllUsers
  );

  const workInstructionId = workInstructions?.[0]?.id;

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

  // Auto-save handlers
  const handleDueDateChange = async (newDueDate: string) => {
    setEditingDueDate(newDueDate);
    try {
      const dueDate = newDueDate ? new Date(newDueDate) : null;
      const result = await updateWorkOrder({
        workOrderId,
        dueDate
      });

      if (result.success) {
        mutateWorkOrder();
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
          workOrderId,
          partQty: qty
        });

        if (result.success) {
          mutateWorkOrder();
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
        workOrderId,
        assigneeIds
      });

      if (result.success) {
        mutateWorkOrder();
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

    try {
      const result = await updateWorkOrder({
        workOrderId,
        status: newStatus
      });

      if (result.success) {
        mutateWorkOrder();
        toast.success('Status updated successfully');
      } else {
        toast.error(result.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleAddStep = async () => {
    if (!workInstructionId) return;
    try {
      const steps = workInstructions?.[0]?.steps || [];
      await createWorkOrderWorkInstructionStep({
        workOrderInstructionId: workInstructionId,
        stepNumber: steps.length + 1,
        title: 'Step ' + (steps.length + 1),
        instructions: `{"type": "doc","content": []}`,
        estimatedLabourTime: 0
      });
      mutate();
    } catch (error) {
      console.error(error);
    }
  };

  const handleRemoveStep = async (stepId: string) => {
    try {
      const result = await deleteWorkOrderWorkInstructionStep(stepId);
      if (result.success) {
        mutate();
      } else {
        console.error('Failed to delete step:', result.error);
      }
    } catch (error) {
      console.error('Failed to delete step:', error);
    }
  };

  const handleReorderSteps = async (stepIds: string[]) => {
    if (!workInstructionId) return;

    try {
      const result = await reorderWorkOrderWorkInstructionSteps(
        workInstructionId,
        stepIds
      );
      if (result.success) {
        mutate();
      }
    } catch (error) {
      console.error('Error reordering steps:', error);
    }
  };

  const handleUpdateStep = async (stepId: string, updates: any) => {
    try {
      // Optimistically update the UI
      const optimisticData = workInstructions?.map((wi) => ({
        ...wi,
        steps: wi.steps.map((step) =>
          step.id === stepId ? { ...step, ...updates } : step
        )
      }));

      // Update the cache immediately
      mutate(optimisticData, false);

      // Call the server action
      const result = await updateWorkOrderWorkInstructionStep({
        stepId,
        title: updates.title || '',
        instructions: updates.instructions || '',
        estimatedLabourTime: updates.estimatedLabourTime || 0
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      // Revalidate the data
      mutate();
    } catch (error) {
      // Revert the optimistic update on error
      mutate();
      console.error('Error updating step:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NOT_STARTED':
        return 'bg-gray-100 text-gray-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'ON_HOLD':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status: string) => {
    return status
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getStatusOptions = () => {
    return [
      { value: WorkOrderStatus.TODO, label: 'To Do' },
      { value: WorkOrderStatus.IN_PROGRESS, label: 'In Progress' },
      { value: WorkOrderStatus.PAUSED, label: 'Paused' },
      { value: WorkOrderStatus.COMPLETED, label: 'Completed' },
      { value: WorkOrderStatus.SCRAPPED, label: 'Scrapped' }
    ];
  };

  return (
    <div className="h-screen flex flex-col">
      <BasicTopBar
        breadcrumbs={[
          {
            label: 'Production',
            href: '/production'
          },
          {
            label: workOrder?.workOrderNumber || workOrderId,
            href: `/production/${workOrderId}`
          },
          {
            label: 'Edit',
            href: `/production/${workOrderId}/edit`
          }
        ]}
        actions={
          <Link href={`/production/${workOrderId}`}>
            <Button size="sm">View Work Order</Button>
          </Link>
        }
      />

      <div className="flex-1 flex flex-col">
        <div className="flex gap-4 px-4 border-b h-12 justify-between items-center">
          <div className="flex gap-2 items-center">
            <h1 className="text-sm font-semibold">
              Work Order - {workOrder?.workOrderNumber}
            </h1>
            <span className="text-sm text-muted-foreground">|</span>
            {workOrder && (
              <Badge className={getStatusColor(workOrder.status)}>
                {formatStatus(workOrder.status)}
              </Badge>
            )}
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList size="sm">
              <TabsTrigger value="details" size="sm">
                <Clipboard className="w-3 h-3 mr-2" />
                Details
              </TabsTrigger>
              <TabsTrigger value="model" size="sm">
                <Box className="w-3 h-3 mr-2" />
                Model
              </TabsTrigger>
              <TabsTrigger value="instructions" size="sm">
                <Book className="w-3 h-3 mr-2" />
                Instructions
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex-1 overflow-hidden">
          {activeTab === 'details' && (
            <div className="p-4 h-full overflow-y-auto">
              {isWorkOrderLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-gray-500">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                </div>
              ) : workOrder ? (
                <div className="mx-auto space-y-6">
                  {/* Overview Details */}
                  <Card>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium">
                              Part Name
                            </label>
                            <div className="mt-1 font-medium">
                              {workOrder.part.name ||
                                workOrder.part.description}
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium">
                              Part Number
                            </label>
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
                            <label className="text-sm font-medium">
                              Quantity
                            </label>
                            <div className="mt-1 flex items-center gap-2">
                              <Input
                                type="number"
                                min="1"
                                value={editingQuantity}
                                onChange={(e) =>
                                  setEditingQuantity(e.target.value)
                                }
                                onBlur={(e) =>
                                  handleQuantityChange(e.target.value)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleQuantityChange(editingQuantity);
                                  }
                                }}
                                className="w-20"
                              />
                              <span className="text-md">
                                {workOrder.part.unit}
                              </span>
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium">
                              Assignees
                            </label>
                            <div className="mt-1">
                              <UserSelect
                                users={users || []}
                                value={editingAssignees}
                                onChange={handleAssigneesChange}
                                multiSelect={true}
                                placeholder="Select assignees..."
                                disabled={isUsersLoading}
                                className=""
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium">
                              Due Date
                            </label>
                            <div className="mt-1">
                              <Input
                                type="date"
                                value={editingDueDate}
                                onChange={(e) =>
                                  setEditingDueDate(e.target.value)
                                }
                                onBlur={(e) =>
                                  handleDueDateChange(e.target.value)
                                }
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
                            <label className="text-sm font-medium">
                              Status
                            </label>
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
                                    <SelectItem
                                      key={option.value}
                                      value={option.value}
                                    >
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
                      <CardTitle className="text-xl">
                        Bill of Materials
                      </CardTitle>
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
                                <th className="text-left py-3 px-4 font-medium">
                                  Name
                                </th>
                                <th className="text-left py-3 px-4 font-medium">
                                  Quantity
                                </th>
                                <th className="text-left py-3 px-4 font-medium">
                                  Total Qty
                                </th>
                                <th className="text-left py-3 px-4 font-medium">
                                  Unit
                                </th>
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
                                    {bomPart.part?.name ||
                                      bomPart.part?.description}
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    {bomPart.qty}
                                  </td>
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
                                  onClick={() =>
                                    window.open(file.url, '_blank')
                                  }
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
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-gray-500">Work order not found</div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'model' && (
            <div className="p-4 h-full">
              {workOrder ? (
                <AutodeskViewer
                  urn={workOrder.part.apsUrn || undefined}
                  height="100%"
                  className="rounded-lg shadow-sm"
                  onLoad={(viewer: any) => {
                    console.log('Autodesk viewer loaded:', viewer);
                  }}
                  onError={(error: Error) => {
                    console.error('Autodesk viewer error:', error);
                    toast.error(`Viewer Error: ${error.message}`);
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-gray-500 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading work order...
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'instructions' && (
            <WorkInstructionsEditor
              workInstructions={workInstructions}
              isLoading={isWorkInstructionsLoading}
              onUpdateStep={handleUpdateStep}
              onAddStep={handleAddStep}
              onRemoveStep={handleRemoveStep}
              onReorderSteps={handleReorderSteps}
              revalidate={() => mutate()}
              isWorkOrder={true}
              workOrder={
                workOrder
                  ? { id: workOrder.id, partQty: workOrder.partQty }
                  : undefined
              }
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkOrderWorkInstructionsEditor;
