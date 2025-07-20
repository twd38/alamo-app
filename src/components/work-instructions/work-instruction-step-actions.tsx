'use client';

import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { Prisma, ActionType } from '@prisma/client';
import {
  createWorkInstructionStepAction,
  deleteWorkInstructionStepAction,
  createWorkOrderWorkInstructionStepAction,
  deleteWorkOrderWorkInstructionStepAction,
  updateWorkInstructionStepAction,
  updateWorkOrderWorkInstructionStepAction
} from '@/lib/actions';
import { DynamicActionForm } from '@/components/work-instructions/dynamic-action-form';

interface WorkInstructionStepActionsProps {
  step: any; // Can be WorkInstructionStepWithActions or WorkOrderWorkInstructionStepWithActions
  onUpdateStep: (stepId: string, updates: any) => void;
  revalidate: () => void;
  isWorkOrder?: boolean;
  workOrder?: {
    id: string;
    partQty: number;
  };
}

export const WorkInstructionStepActions: React.FC<
  WorkInstructionStepActionsProps
> = ({ step, revalidate, isWorkOrder = false, workOrder }) => {
  if (!step) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <p>Select a step to view details</p>
      </div>
    );
  }

  const handleAddAction = async () => {
    try {
      // Create a new action with default values
      const createActionFn = isWorkOrder
        ? createWorkOrderWorkInstructionStepAction
        : createWorkInstructionStepAction;

      const result = await createActionFn({
        stepId: step.id,
        actionType: ActionType.VALUE_INPUT,
        description: 'New Action',
        isRequired: true
      });

      if (result.success && result.data) {
        // Trigger a revalidation to get the latest data
        await revalidate();
      }
    } catch (error) {
      console.error('Failed to create action:', error);
      // Revalidate to ensure we're in sync with the server
      await revalidate();
    }
  };

  const handleDeleteAction = async (actionId: string) => {
    try {
      // Perform the delete
      const deleteActionFn = isWorkOrder
        ? deleteWorkOrderWorkInstructionStepAction
        : deleteWorkInstructionStepAction;

      const result = await deleteActionFn(actionId);

      if (result.success) {
        // Trigger a revalidation to get the latest data
        await revalidate();
      }
    } catch (error) {
      console.error('Failed to delete action:', error);
      // Revalidate to restore the correct state
      await revalidate();
    }
  };

  const handleActionSaved = async () => {
    // Trigger a revalidation to get the latest data
    await revalidate();
  };

  return (
    <div className="p-4 space-y-4 h-full overflow-y-scroll">
      <Button onClick={handleAddAction} className="w-full gap-2">
        <Plus className="h-4 w-4" />
        Add Action
      </Button>

      <div className="space-y-4">
        {step.actions.map((action: any) => (
          <div key={action.id} className="relative">
            <DynamicActionForm
              stepId={step.id}
              action={action}
              onActionSaved={handleActionSaved}
              updateAction={
                isWorkOrder
                  ? (actionId: string, data: any) =>
                      updateWorkOrderWorkInstructionStepAction({
                        actionId,
                        ...data
                      })
                  : (actionId: string, data: any) =>
                      updateWorkInstructionStepAction({
                        actionId,
                        ...data
                      })
              }
              createAction={
                isWorkOrder
                  ? (stepId: string, data: any) =>
                      createWorkOrderWorkInstructionStepAction({
                        stepId,
                        ...data
                      })
                  : (stepId: string, data: any) =>
                      createWorkInstructionStepAction({
                        stepId,
                        ...data
                      })
              }
              workOrder={workOrder}
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-6 w-6"
              onClick={() => handleDeleteAction(action.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
