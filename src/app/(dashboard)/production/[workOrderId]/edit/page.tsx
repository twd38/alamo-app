'use client';

import useSWR from 'swr';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { getWorkOrderWorkInstructions, getWorkOrder } from '@/lib/queries';
import {
  updateWorkOrderWorkInstructionStep,
  createWorkOrderWorkInstructionStep,
  deleteWorkOrderWorkInstructionStep,
  reorderWorkOrderWorkInstructionSteps
} from '@/lib/actions';
import { WorkInstructionsEditor } from '@/components/work-instructions';
import BasicTopBar from '@/components/layouts/basic-top-bar';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Book, Clipboard } from 'lucide-react';

// *** Work Order Work Instructions Editor *** (Main Component)
const WorkOrderWorkInstructionsEditor: React.FC = () => {
  const params = useParams();
  const workOrderId = params.workOrderId as string;
  const [activeTab, setActiveTab] = useState('work-instructions');

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

  const workInstructionId = workInstructions?.[0]?.id;

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
          <h1 className="text-sm font-semibold">
            Work Order - {workOrder?.workOrderNumber}
          </h1>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList size="sm">
              <TabsTrigger value="details" size="sm">
                <Clipboard className="w-3 h-3 mr-2" />
                Details
              </TabsTrigger>
              <TabsTrigger value="work-instructions" size="sm">
                <Book className="w-3 h-3 mr-2" />
                Work Instructions
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
                    Loading work order details...
                  </div>
                </div>
              ) : workOrder ? (
                <div className="max-w-4xl mx-auto space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-2xl">
                        Work Order Details
                      </CardTitle>
                      <CardDescription>
                        Edit and manage work order information
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700">
                            Work Order Number
                          </label>
                          <div className="mt-1 text-lg font-mono">
                            {workOrder.workOrderNumber}
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">
                            Operation
                          </label>
                          <div className="mt-1">{workOrder.operation}</div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">
                            Status
                          </label>
                          <div className="mt-1">
                            <Badge className={getStatusColor(workOrder.status)}>
                              {formatStatus(workOrder.status)}
                            </Badge>
                          </div>
                        </div>
                        {/* Add more work order detail fields here */}
                        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                          <p className="text-gray-600 text-center">
                            Work order details editing form will be implemented
                            here
                          </p>
                        </div>
                      </div>
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

          {activeTab === 'work-instructions' && (
            <WorkInstructionsEditor
              workInstructions={workInstructions}
              isLoading={isWorkInstructionsLoading}
              onUpdateStep={handleUpdateStep}
              onAddStep={handleAddStep}
              onRemoveStep={handleRemoveStep}
              onReorderSteps={handleReorderSteps}
              revalidate={() => mutate()}
              isWorkOrder={true}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkOrderWorkInstructionsEditor;
