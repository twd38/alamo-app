'use client';

import { Badge } from '@/components/ui/badge';
import { GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Prisma } from '@prisma/client';
import { StepDropdown } from '@/components/library/step-dropdown';

interface SortableStepProps {
  step: Prisma.WorkInstructionStepGetPayload<{
    include: { actions: true };
  }>;
  selectedStepId: string | null;
  onSelectStep: (stepId: string) => void;
  onRemoveStep: (stepId: string) => void;
  disabled: boolean;
}

export const SortableStep: React.FC<SortableStepProps> = ({
  step,
  selectedStepId,
  onSelectStep,
  onRemoveStep,
  disabled
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
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div ref={setNodeRef} style={style} className="mb-3">
      <div
        className={`
                    p-3 space-y-1 rounded-lg border shadow-sm cursor-pointer w-full
                    ${
                      selectedStepId === step.id
                        ? 'bg-blue-50 border-blue-500'
                        : 'hover:bg-accent border-border hover:border-blue-200'
                    }
                `}
        onClick={() => onSelectStep(step.id)}
      >
        <div className="flex items-center justify-between gap-2 w-full">
          <div className="flex items-center gap-3">
            <div
              className="cursor-grab active:cursor-grabbing"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex flex-col w-full gap-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">
                  Step {step.stepNumber}
                </span>
                <Badge variant="outline">{step.estimatedLabourTime} min</Badge>
              </div>
              <h4 className="text-sm font-medium truncate">{step.title}</h4>
            </div>
          </div>
          <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
            <StepDropdown
              onRemove={() => onRemoveStep(step.id)}
              disabled={disabled}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
