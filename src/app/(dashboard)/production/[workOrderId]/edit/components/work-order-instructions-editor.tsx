'use client';

import { WorkInstructionsEditor } from '@/components/work-instructions';
import { Prisma } from '@prisma/client';
import { WorkOrderWorkInstructions } from '../queries/getWorkOrderWorkInstructions';
import {
  updateWorkOrderWorkInstructionStep,
  createWorkOrderWorkInstructionStep,
  deleteWorkOrderWorkInstructionStep,
  reorderWorkOrderWorkInstructionSteps,
  addFilesToWorkOrderWorkInstructionStep,
  deleteFilesFromWorkOrderWorkInstructionStep
} from '@/lib/actions';

interface WorkOrderInstructionsEditorProps {
  workInstructions: WorkOrderWorkInstructions;
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
  const workInstructionId = workInstructions.id;

  const handleAddStep = async () => {
    if (!workInstructionId) return;
    try {
      const steps = workInstructions.steps || [];
      await createWorkOrderWorkInstructionStep({
        workOrderInstructionId: workInstructionId,
        stepNumber: steps.length + 1,
        title: `Step ${steps.length + 1}`,
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

  const handleAddFilesToStep = async (
    stepId: string,
    files: Prisma.FileCreateInput[]
  ) => {
    await addFilesToWorkOrderWorkInstructionStep(stepId, files);
    onUpdate();
  };

  const handleDeleteFilesFromStep = async (
    stepId: string,
    fileIds: string[]
  ) => {
    await deleteFilesFromWorkOrderWorkInstructionStep(stepId, fileIds);
    onUpdate();
  };

  if (!workInstructions) {
    return null;
  }

  return (
    <WorkInstructionsEditor
      workInstructions={workInstructions}
      isLoading={isLoading}
      onUpdateStep={handleUpdateStep}
      onAddStep={handleAddStep}
      onRemoveStep={handleRemoveStep}
      onReorderSteps={handleReorderSteps}
      onAddFilesToStep={handleAddFilesToStep}
      onDeleteFilesFromStep={handleDeleteFilesFromStep}
      revalidate={onUpdate}
      isWorkOrder={true}
      workOrder={workOrder}
    />
  );
}
