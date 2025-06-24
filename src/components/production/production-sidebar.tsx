'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  WorkInstructionStep,
  ActionType,
  WorkOrderStatus
} from '@prisma/client';
import { ProductionActionItem } from './actions';
import { CircleCheck } from 'lucide-react';
import { getWorkOrder } from '@/lib/queries';
import { completeStepExecution } from '@/lib/actions';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Comments } from '@/components/comments';

type WorkOrder = Awaited<ReturnType<typeof getWorkOrder>>;

type WorkInstructionStepAction = {
  id: string;
  stepId: string;
  actionType: ActionType;
  description: string;
  targetValue: number | null;
  unit: string | null;
  tolerance: number | null;
  signoffRoles: string[];
  isRequired: boolean;
  uploadedFileId: string | null;
  notes: string | null;
};

type WorkInstructionStepWithActions = WorkInstructionStep & {
  actions: WorkInstructionStepAction[];
};

interface ProductionSidebarProps {
  step: WorkInstructionStepWithActions | null;
  workOrder: WorkOrder;
  onStepCompleted?: (stepId: string) => void;
}

export function ProductionSidebar({
  step,
  workOrder,
  onStepCompleted
}: ProductionSidebarProps) {
  const router = useRouter();
  const [isCompleting, setIsCompleting] = useState(false);

  const isWorkOrderInProgress =
    workOrder?.status === WorkOrderStatus.IN_PROGRESS;

  // Check if step is completed by looking at step execution status
  const stepExecution = step
    ? workOrder?.stepExecutions?.find(
        (se) => se.workInstructionStep.id === step.id
      )
    : null;

  const isStepCompleted = stepExecution?.status === 'COMPLETED';

  // Check if all required actions are completed
  const requiredActions =
    step?.actions.filter((action) => action.isRequired) || [];
  const completedRequiredActions =
    stepExecution?.actionExecutions.filter(
      (ae) =>
        requiredActions.some(
          (ra) => ra.id === ae.workInstructionStepActionId
        ) && ae.completedAt
    ) || [];

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
      const result = await completeStepExecution({
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

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex flex-col min-h-0">
        <Tabs defaultValue="actions" className="flex flex-col h-full">
          <div className="border-b flex-shrink-0">
            <TabsList className="w-full justify-start h-12 p-0 bg-transparent border-b-0">
              <TabsTrigger
                value="actions"
                className="data-[state=active]:bg-background rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 h-12"
              >
                Actions
              </TabsTrigger>
              <TabsTrigger
                value="comments"
                className="data-[state=active]:bg-background rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 h-12"
              >
                Comments
              </TabsTrigger>
              <TabsTrigger
                value="files"
                className="data-[state=active]:bg-background rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 h-12"
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
              stepExecution={stepExecution}
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
              <Button
                variant="default"
                className="w-full"
                disabled={!canCompleteStep || isCompleting}
                onClick={handleCompleteStep}
              >
                <CircleCheck className="w-4 h-4 mr-2" />
                {isCompleting
                  ? 'Completing...'
                  : isStepCompleted
                    ? 'Step Completed'
                    : 'Complete Step'}
              </Button>
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
    </div>
  );
}

// Actions component for production - interactive but not editable
function ProductionActions({
  step,
  workOrder,
  stepExecution,
  isWorkOrderInProgress
}: {
  step: WorkInstructionStepWithActions | null;
  workOrder: WorkOrder;
  stepExecution: any;
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
      {step.actions.map((action) => {
        // Find the action execution for this action
        const actionExecution = stepExecution?.actionExecutions.find(
          (ae: any) => ae.workInstructionStepActionId === action.id
        );

        return (
          <ProductionActionItem
            key={action.id}
            action={action}
            workOrderId={workOrder.id}
            stepId={step.id}
            actionExecution={actionExecution}
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
  step: WorkInstructionStepWithActions | null;
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
      entityType="WORK_INSTRUCTION_STEP"
      entityId={step.id}
      entityUrl={`/production/${workOrderId}?step=${step.id}&tab=comments`}
    />
  );
}

// Placeholder component for Files
function ProductionFiles({
  step
}: {
  step: WorkInstructionStepWithActions | null;
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
