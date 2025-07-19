'use client';

import { WorkInstructionsEditor } from '@/components/work-instructions';
import {
  updateWorkOrderWorkInstructionStep,
  createWorkOrderWorkInstructionStep,
  deleteWorkOrderWorkInstructionStep,
  reorderWorkOrderWorkInstructionSteps
} from '@/lib/actions';

type WorkInstruction = {
  id: string;
  steps: Array<{
    id: string;
    stepNumber: number;
    title: string;
    instructions: string;
    estimatedLabourTime: number;
    actions: Array<{
      id: string;
      type: string;
      label: string;
      uploadedFile?: {
        id: string;
        name: string;
        url: string;
      };
      executionFile?: {
        id: string;
        name: string;
        url: string;
      };
    }>;
  }>;
};

interface WorkOrderInstructionsEditorProps {
  workInstructions: WorkInstruction[] | undefined;
  isLoading: boolean;
  onUpdate: () => void;
  workOrder?: {
    id: string;
    partQty: number;
  };
}

export function WorkOrderInstructionsEditor({
  workInstructions,
  isLoading,
  onUpdate,
  workOrder
}: WorkOrderInstructionsEditorProps) {
  const workInstructionId = workInstructions?.[0]?.id;

  const handleAddStep = async () => {
    if (!workInstructionId) return;
    try {
      const steps = workInstructions?.[0]?.steps || [];
      await createWorkOrderWorkInstructionStep({
        workOrderInstructionId: workInstructionId,
        stepNumber: steps.length + 1,
        title: `Step ${  steps.length + 1}`,
        instructions: `{"type": "doc","content": []}`,
        estimatedLabourTime: 0
      });
      onUpdate();
    } catch (error) {
      console.error(error);
    }
  };

  const handleRemoveStep = async (stepId: string) => {
    try {
      const result = await deleteWorkOrderWorkInstructionStep(stepId);
      if (result.success) {
        onUpdate();
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
        onUpdate();
      }
    } catch (error) {
      console.error('Error reordering steps:', error);
    }
  };

  const handleUpdateStep = async (stepId: string, updates: any) => {
    try {
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
      onUpdate();
    } catch (error) {
      console.error('Error updating step:', error);
    }
  };

  return (
    <WorkInstructionsEditor
      workInstructions={workInstructions}
      isLoading={isLoading}
      onUpdateStep={handleUpdateStep}
      onAddStep={handleAddStep}
      onRemoveStep={handleRemoveStep}
      onReorderSteps={handleReorderSteps}
      revalidate={onUpdate}
      isWorkOrder={true}
      workOrder={workOrder}
    />
  );
}
