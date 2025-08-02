'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Edit2, Trash2, Clock, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Prisma } from '@prisma/client';

type RoutingStepWithRelations = Prisma.RoutingStepGetPayload<{
  include: {
    operation: true;
    workCenter: true;
  };
}>;

interface SortableItemProps {
  id: string;
  step: RoutingStepWithRelations;
  onEdit: (step: RoutingStepWithRelations) => void;
  onDelete: (id: string) => void;
}

export function SortableItem({ id, step, onEdit, onDelete }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const totalTime = step.setupTime + step.runTime + step.queueTime + step.moveTime;
  const hourlyRate = step.workCenter.costPerHour || 0;
  const stepCost = (totalTime / 60) * hourlyRate;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`${isDragging ? 'shadow-lg' : ''}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab hover:bg-muted p-1 rounded"
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Step {step.stepNumber}</Badge>
                <h4 className="font-medium">{step.operation.name}</h4>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEdit(step)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDelete(step.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>Work Center: {step.workCenter.name}</span>
                <span>Code: {step.operation.code}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {totalTime} min
                </div>
                <div className="flex items-center">
                  <DollarSign className="h-3 w-3 mr-1" />
                  ${stepCost.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="mt-2 grid grid-cols-4 gap-2 text-xs text-muted-foreground">
              <div>Setup: {step.setupTime}min</div>
              <div>Run: {step.runTime}min</div>
              <div>Queue: {step.queueTime}min</div>
              <div>Move: {step.moveTime}min</div>
            </div>

            {step.notes && (
              <div className="mt-2 text-sm text-muted-foreground">
                Notes: {step.notes}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}