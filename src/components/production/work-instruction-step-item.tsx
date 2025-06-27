import { Badge } from '@/components/ui/badge';
import { WorkOrderWorkInstructionStep } from '@prisma/client';

interface WorkInstructionStepItemProps {
  step: WorkOrderWorkInstructionStep;
  isSelected: boolean;
  onClick: () => void;
}

export function WorkInstructionStepItem({
  step,
  isSelected,
  onClick
}: WorkInstructionStepItemProps) {
  return (
    <div
      className={`
        p-3 space-y-1 rounded-lg border shadow-sm items-center cursor-pointer w-full
        ${
          isSelected
            ? 'bg-blue-50 border-blue-500'
            : 'hover:bg-accent border-border hover:border-blue-200'
        }
      `}
      onClick={onClick}
    >
      <div className="flex items-center gap-2 w-full">
        <span className="text-xs text-muted-foreground font-medium">
          Step {step.stepNumber}
        </span>
        <Badge variant="outline">{step.estimatedLabourTime} min</Badge>
      </div>
      <h4 className="text-sm font-medium truncate">{step.title}</h4>
    </div>
  );
}
