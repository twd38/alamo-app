'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { useParams } from 'next/navigation';
import { getPartWorkInstructions, PartWorkInstructions } from '@/lib/queries';
import { WorkInstructionStep } from '@prisma/client';
import {
  createWorkInstruction,
  createWorkInstructionStep,
  updateWorkInstructionStep,
  deleteWorkInstructionStep,
  reorderWorkInstructionSteps
} from '@/lib/actions';
import { WorkInstructionsEditor } from '@/components/work-instructions';

// *** Work Instructions Editor *** (Main Component)
const PartWorkInstructionsEditor: React.FC = () => {
  const params = useParams();
  const partId = params.partId as string;

  const {
    data: workInstructions,
    isLoading: isWorkInstructionsLoading,
    mutate
  } = useSWR<PartWorkInstructions>(
    `/api/parts/${partId}/work-instructions`,
    () => getPartWorkInstructions(partId)
  );

  const workInstructionId = workInstructions?.[0]?.id;

  const handleCreateWorkInstruction = async () => {
    if (!partId) return;

    try {
      await createWorkInstruction({
        partId: partId,
        title: 'New Work Instruction',
        description: '',
        instructionNumber: `WI-${Date.now()}`, // Generate a unique instruction number
        steps: [
          {
            stepNumber: 1,
            title: 'Step 1',
            instructions: `{"type": "doc","content": []}`,
            estimatedLabourTime: 0
          }
        ]
      });

      // Refresh the data
      mutate();
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddStep = async () => {
    if (!workInstructionId) return;
    try {
      const steps = workInstructions?.[0]?.steps || [];
      await createWorkInstructionStep({
        workInstructionId: workInstructionId,
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
      const result = await deleteWorkInstructionStep(stepId);
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
      const result = await reorderWorkInstructionSteps(
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

  const handleUpdateStep = async (
    stepId: string,
    updates: Partial<WorkInstructionStep>
  ) => {
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
      const result = await updateWorkInstructionStep({
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

  return (
    <WorkInstructionsEditor
      workInstructions={workInstructions}
      isLoading={isWorkInstructionsLoading}
      onUpdateStep={handleUpdateStep}
      onAddStep={handleAddStep}
      onRemoveStep={handleRemoveStep}
      onReorderSteps={handleReorderSteps}
      onCreateWorkInstruction={handleCreateWorkInstruction}
      revalidate={() => mutate()}
    />
  );
};

export default PartWorkInstructionsEditor;
