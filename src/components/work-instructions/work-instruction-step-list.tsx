'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus } from 'lucide-react';
import { Prisma } from '@prisma/client';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { SortableStep } from './sortable-step';

interface WorkInstructionStepListProps {
  steps: Prisma.WorkInstructionStepGetPayload<{
    include: { actions: true };
  }>[];
  selectedStepId: string | null;
  onSelectStep: (stepId: string) => void;
  onAddStep: () => void;
  onRemoveStep: (stepId: string) => void;
  onReorderSteps: (stepIds: string[]) => Promise<void>;
  onCreateWorkInstruction?: () => void;
}

export const WorkInstructionStepList: React.FC<
  WorkInstructionStepListProps
> = ({
  steps,
  selectedStepId,
  onSelectStep,
  onAddStep,
  onRemoveStep,
  onReorderSteps,
  onCreateWorkInstruction
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = steps.findIndex((step) => step.id === active.id);
      const newIndex = steps.findIndex((step) => step.id === over.id);

      const newSteps = arrayMove(steps, oldIndex, newIndex);
      const stepIds = newSteps.map((step) => step.id);

      try {
        await onReorderSteps(stepIds);
      } catch (error) {
        console.error('Error reordering steps:', error);
      }
    }
  };

  return (
    <div className="h-full flex flex-col">
      <ScrollArea className="flex-1">
        <div className="p-3">
          {steps.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center bg-muted/50 p-4 rounded-lg">
              <p className="text-muted-foreground mb-4">
                Add steps to create your work instructions.
              </p>
              <Button
                onClick={onCreateWorkInstruction || onAddStep}
                className="gap-2 w-full"
              >
                <Plus className="h-4 w-4" />
                Add First Step
              </Button>
            </div>
          ) : (
            <>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={steps.map((step) => step.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {steps.map((step) => (
                    <SortableStep
                      key={step.id}
                      step={step}
                      selectedStepId={selectedStepId}
                      onSelectStep={onSelectStep}
                      onRemoveStep={onRemoveStep}
                      disabled={steps.length === 1}
                    />
                  ))}
                </SortableContext>
              </DndContext>
              <div className="mt-6 flex justify-center">
                <Button
                  variant="outline"
                  onClick={onAddStep}
                  className="w-full gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Step
                </Button>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
