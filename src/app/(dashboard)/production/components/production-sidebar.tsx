'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  WorkInstructionStep,
  ActionType,
  WorkOrderStatus,
  WorkOrderWorkInstructionStep,
  WorkOrderWorkInstructionStepAction
} from '@prisma/client';
import { ProductionActionItem } from './actions';
import { CircleCheck } from 'lucide-react';
import { getWorkOrder } from '../queries/getWorkOrder';
import {
  completeWorkOrderWorkInstructionStep,
  completeWorkOrder
} from '@/lib/actions';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Comments } from '@/components/comments';
import { useSearchParams } from 'next/navigation';
import { WorkOrderCompletionDialog } from './work-order-completion-dialog';

type WorkOrder = Awaited<ReturnType<typeof getWorkOrder>>;

type WorkOrderInstructionStepWithActions = WorkOrderWorkInstructionStep & {
  actions: WorkOrderWorkInstructionStepAction[];
};

interface ProductionSidebarProps {
  step: WorkOrderInstructionStepWithActions | null;
  workOrder: WorkOrder;
  onStepCompleted?: (stepId: string) => void;
}

// Button component for completing a normal step
interface CompleteStepButtonProps {
  canComplete: boolean;
  isCompleting: boolean;
  isStepCompleted: boolean;
  onComplete: () => void;
}

function CompleteStepButton({
  canComplete,
  isCompleting,
  isStepCompleted,
  onComplete
}: CompleteStepButtonProps) {
  return (
    <Button
      variant="default"
      className="w-full"
      disabled={!canComplete || isCompleting}
      onClick={onComplete}
    >
      <CircleCheck className="w-4 h-4 mr-2" />
      {isCompleting
        ? 'Completing...'
        : isStepCompleted
          ? 'Step Completed'
          : 'Complete Step'}
    </Button>
  );
}

// Button component for completing a work order (last step)
interface CompleteWorkOrderButtonProps {
  canComplete: boolean;
  isCompleting: boolean;
  isStepCompleted: boolean;
  isWorkOrderCompleted: boolean;
  onComplete: () => void;
}

function CompleteWorkOrderButton({
  canComplete,
  isCompleting,
  isStepCompleted,
  isWorkOrderCompleted,
  onComplete
}: CompleteWorkOrderButtonProps) {
  return (
    <Button
      variant="default"
      className="w-full text-white"
      disabled={!canComplete || isCompleting}
      onClick={onComplete}
    >
      <CircleCheck className="w-4 h-4 mr-2" />
      {isCompleting
        ? 'Completing...'
        : isWorkOrderCompleted
          ? 'Work Order Completed'
          : 'Complete Work Order'}
    </Button>
  );
}

export function ProductionSidebar({
  step,
  workOrder,
  onStepCompleted
}: ProductionSidebarProps) {
  const router = useRouter();
  const [isCompleting, setIsCompleting] = useState(false);
  const [activeTab, setActiveTab] = useState('actions');
  const [isCompletionDialogOpen, setIsCompletionDialogOpen] = useState(false);
  const searchParams = useSearchParams();
  useEffect(() => {
    // If URL has a tab query param, set the active tab
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const isWorkOrderInProgress =
    workOrder?.status === WorkOrderStatus.IN_PROGRESS;

  const isWorkOrderCompleted = workOrder?.status === WorkOrderStatus.COMPLETED;

  // Find the corresponding work order step (execution tracking is embedded)
  const isStepCompleted = step?.status === 'COMPLETED';

  // Find if this is the last step in the work order
  const isLastStep =
    workOrder?.workInstruction?.steps.length === step?.stepNumber;

  // Check if all required actions are completed
  const requiredActions =
    step?.actions.filter((action) => action.isRequired) || [];

  // Find completed required actions by checking the work order step actions
  const completedRequiredActions =
    step?.actions?.filter((stepAction) => {
      // Find all steps with completedAt
      const completedAt = stepAction.completedAt;
      return completedAt;
    }) || [];

  // If there are no required actions, the step can be completed immediately
  // If there are required actions, all of them must be completed
  const allActionsCompleted =
    requiredActions.length === 0 ||
    completedRequiredActions.length === requiredActions.length;

  const canCompleteStep =
    isWorkOrderInProgress && allActionsCompleted && !isStepCompleted;

  const handleCompleteStep = async () => {
    if (!step || !workOrder) return;

    setIsCompleting(true);
    try {
      const result = await completeWorkOrderWorkInstructionStep({
        workOrderId: workOrder.id,
        stepId: step.id
      });

      if (result.success) {
        // Advance to next step if callback is provided
        if (onStepCompleted) {
          onStepCompleted(step.id);
        }
        router.refresh();
      } else {
        console.error('Failed to complete step:', result.error);
        // You could show a toast notification here
      }
    } catch (error) {
      console.error('Error completing step:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleCompleteWorkOrder = async () => {
    if (!step || !workOrder) return;

    setIsCompleting(true);
    try {
      // For the last step, complete the step first, then complete the work order
      const stepResult = await completeWorkOrderWorkInstructionStep({
        workOrderId: workOrder.id,
        stepId: step.id
      });

      if (stepResult.success) {
        // Complete the work order
        const workOrderResult = await completeWorkOrder(workOrder.id);

        if (workOrderResult.success) {
          // Show completion dialog
          setIsCompletionDialogOpen(true);

          // Advance to next step if callback is provided
          if (onStepCompleted) {
            onStepCompleted(step.id);
          }
          router.refresh();
        } else {
          console.error(
            'Failed to complete work order:',
            workOrderResult.error
          );
          // You could show a toast notification here
        }
      } else {
        console.error('Failed to complete step:', stepResult.error);
        // You could show a toast notification here
      }
    } catch (error) {
      console.error('Error completing work order:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex flex-col min-h-0">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex flex-col h-full"
        >
          <div className="border-b flex-shrink-0">
            <TabsList className="w-full justify-start h-10 p-0 bg-transparent border-b-0">
              <TabsTrigger
                value="actions"
                className="data-[state=active]:bg-background rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 h-10"
              >
                Actions
              </TabsTrigger>
              <TabsTrigger
                value="comments"
                className="data-[state=active]:bg-background rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 h-10"
              >
                Comments
              </TabsTrigger>
              <TabsTrigger
                value="files"
                className="data-[state=active]:bg-background rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 h-10"
              >
                Files
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent
            value="actions"
            className="mt-0 flex-1 min-h-0 flex flex-col justify-between"
          >
            <ProductionActions
              step={step}
              workOrder={workOrder}
              isWorkOrderInProgress={isWorkOrderInProgress}
            />
            <div className="border-t border-inherit px-4 py-4 flex-shrink-0">
              {!isWorkOrderInProgress && (
                <div className="mb-2 text-sm text-amber-600 bg-amber-50 p-2 rounded">
                  Work order must be started to complete steps
                </div>
              )}

              {isStepCompleted && (
                <div className="mb-2 text-sm text-green-600 bg-green-50 p-2 rounded">
                  Step completed
                </div>
              )}

              {!allActionsCompleted &&
                isWorkOrderInProgress &&
                !isStepCompleted && (
                  <div className="mb-2 text-sm text-blue-600 bg-blue-50 p-2 rounded">
                    Complete{' '}
                    {requiredActions.length - completedRequiredActions.length}{' '}
                    more required actions
                  </div>
                )}

              {isLastStep ? (
                <CompleteWorkOrderButton
                  canComplete={canCompleteStep}
                  isCompleting={isCompleting}
                  isStepCompleted={isStepCompleted}
                  isWorkOrderCompleted={isWorkOrderCompleted}
                  onComplete={handleCompleteWorkOrder}
                />
              ) : (
                <CompleteStepButton
                  canComplete={canCompleteStep}
                  isCompleting={isCompleting}
                  isStepCompleted={isStepCompleted}
                  onComplete={handleCompleteStep}
                />
              )}
            </div>
          </TabsContent>
          <TabsContent value="comments" className="mt-0 min-h-0 h-full">
            <ProductionComments step={step} workOrderId={workOrder?.id} />
          </TabsContent>
          <TabsContent value="files" className="mt-0 flex-1 min-h-0">
            <ProductionFiles step={step} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Work Order Completion Dialog */}
      <WorkOrderCompletionDialog
        isOpen={isCompletionDialogOpen}
        onOpenChange={setIsCompletionDialogOpen}
        workOrderId={workOrder?.id || ''}
        workOrderNumber={workOrder?.workOrderNumber || ''}
        partName={workOrder?.part?.name || ''}
      />
    </div>
  );
}

// Actions component for production - interactive but not editable
function ProductionActions({
  step,
  workOrder,
  isWorkOrderInProgress
}: {
  step: WorkOrderInstructionStepWithActions | null;
  workOrder: WorkOrder;
  isWorkOrderInProgress: boolean;
}) {
  if (!step || !workOrder) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <p>Select a step to view actions</p>
      </div>
    );
  }

  if (step.actions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <p>No actions required for this step</p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto p-4 space-y-4">
      {step?.actions?.map((stepAction: WorkOrderWorkInstructionStepAction) => {
        return (
          <ProductionActionItem
            key={stepAction.id}
            action={stepAction}
            workOrderId={workOrder.id}
            stepId={step.id}
            disabled={!isWorkOrderInProgress}
          />
        );
      })}
    </div>
  );
}

// Comments component for production steps
function ProductionComments({
  step,
  workOrderId
}: {
  step: WorkOrderInstructionStepWithActions | null;
  workOrderId?: string;
}) {
  if (!step) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <p>Select a step to view comments</p>
      </div>
    );
  }

  return (
    <Comments
      entityType="WORK_ORDER_WORK_INSTRUCTION_STEP"
      entityId={step.id}
      entityUrl={`/production/${workOrderId}?step=${step.id}&tab=comments`}
    />
  );
}

// Placeholder component for Files
function ProductionFiles({
  step
}: {
  step: WorkOrderInstructionStepWithActions | null;
}) {
  if (!step) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <p>Select a step to view files</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4">
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
          <p>Files functionality coming soon</p>
        </div>
      </div>
    </div>
  );
}
