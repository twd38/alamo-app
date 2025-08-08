'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, GripVertical, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
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
import {
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Prisma } from '@prisma/client';

type ProcedureStep = Prisma.ProcedureStepGetPayload<{
  include: {
    actions: true;
    files: true;
  };
}>;

interface ProcedureStepListProps {
  steps: ProcedureStep[];
  selectedStepId: string | null;
  onSelectStep: (stepId: string) => void;
  onAddStep: () => void;
  onRemoveStep: (stepId: string) => void;
  onReorderSteps: (stepIds: string[]) => Promise<void>;
  onCreateProcedure?: () => void;
}

interface SortableStepItemProps {
  step: ProcedureStep;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}

const SortableStepItem: React.FC<SortableStepItemProps> = ({
  step,
  isSelected,
  onSelect,
  onRemove
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative flex items-center gap-2 px-3 py-2 border rounded-md cursor-pointer transition-colors',
        isSelected && 'bg-primary/10 border-primary',
        !isSelected && 'hover:bg-muted/50',
        isDragging && 'opacity-50'
      )}
      onClick={onSelect}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab hover:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            Step {step.stepNumber}
          </span>
          <span className="text-sm font-medium truncate">
            {step.title || 'Untitled Step'}
          </span>
        </div>
        {step.actions && step.actions.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {step.actions.length} action{step.actions.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
};

export const ProcedureStepList: React.FC<ProcedureStepListProps> = ({
  steps,
  selectedStepId,
  onSelectStep,
  onAddStep,
  onRemoveStep,
  onReorderSteps,
  onCreateProcedure
}) => {
  const [stepOrder, setStepOrder] = useState<string[]>(
    steps.map(s => s.id)
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = stepOrder.indexOf(active.id as string);
      const newIndex = stepOrder.indexOf(over.id as string);

      const newOrder = arrayMove(stepOrder, oldIndex, newIndex);
      setStepOrder(newOrder);
      await onReorderSteps(newOrder);
    }
  };

  if (steps.length === 0 && !onCreateProcedure) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <p className="text-sm text-muted-foreground mb-4">No steps yet</p>
        <Button onClick={onAddStep} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add First Step
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">Procedure Steps</h3>
        <Button onClick={onAddStep} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Step
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={stepOrder}
              strategy={verticalListSortingStrategy}
            >
              {steps
                .sort((a, b) => a.stepNumber - b.stepNumber)
                .map((step) => (
                  <SortableStepItem
                    key={step.id}
                    step={step}
                    isSelected={step.id === selectedStepId}
                    onSelect={() => onSelectStep(step.id)}
                    onRemove={() => onRemoveStep(step.id)}
                  />
                ))}
            </SortableContext>
          </DndContext>
        </div>
      </ScrollArea>
    </div>
  );
};