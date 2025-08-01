'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { useParams } from 'next/navigation';
import {
  getPartWorkInstructions,
  PartWorkInstructions
} from '../queries/getPartWorkInstructions';
import { WorkInstructionStep, Prisma } from '@prisma/client';
import {
  createWorkInstruction,
  createWorkInstructionStep,
  updateWorkInstructionStep,
  deleteWorkInstructionStep,
  reorderWorkInstructionSteps,
  addFilesToWorkInstructionStep,
  deleteFilesFromWorkInstructionStep
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

  const workInstructionId = workInstructions?.id;

  const handleCreateWorkInstruction = async () => {
    if (!partId) return;

    try {
      await createWorkInstruction({
        partId,
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
      const steps = workInstructions?.steps;
      await createWorkInstructionStep({
        workInstructionId,
        stepNumber: steps.length + 1,
        title: `Step ${steps.length + 1}`,
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

  const handleAddFilesToStep = async (
    stepId: string,
    files: Prisma.FileCreateInput[]
  ) => {
    await addFilesToWorkInstructionStep(stepId, files);
    mutate();
  };

  const handleDeleteFilesFromStep = async (
    stepId: string,
    fileIds: string[]
  ) => {
    await deleteFilesFromWorkInstructionStep(stepId, fileIds);
    mutate();
  };
  const handleUpdateStep = async (
    stepId: string,
    updates: Partial<WorkInstructionStep>
  ) => {
    try {
      // Optimistically update the UI
      const optimisticData = workInstructions
        ? {
            ...workInstructions,
            steps: workInstructions.steps.map((step) =>
              step.id === stepId ? { ...step, ...updates } : step
            )
          }
        : undefined;

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
      onAddFilesToStep={handleAddFilesToStep}
      onDeleteFilesFromStep={handleDeleteFilesFromStep}
      revalidate={() => mutate()}
    />
  );
};

export default PartWorkInstructionsEditor;
