'use client';

import { Droppable } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import type { WorkOrderKanbanItem } from '../queries/getWorkOrdersKanban';
import { WorkOrderStatus } from '@prisma/client';
import { WorkOrderKanbanCard } from './work-order-kanban-card';

interface WorkOrdersKanbanColumnProps {
  status: WorkOrderStatus;
  label: string;
  workOrders: WorkOrderKanbanItem[];
  isLoading?: boolean;
  onArchive?: () => void;
}

export function WorkOrdersKanbanColumn({
  status,
  label,
  workOrders,
  isLoading,
  onArchive
}: WorkOrdersKanbanColumnProps) {
  return (
    <div className="flex min-h-0 min-w-[240px] flex-1">
      <div className="flex h-full min-h-0 w-full flex-col rounded-lg bg-muted/75">
        <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight truncate">
              {label}
            </p>
          </div>
          <span className="text-xs font-semibold text-muted-foreground">
            {workOrders.length}
          </span>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden p-2">
          <Droppable droppableId={status} type="workOrder">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={cn(
                  'flex h-full min-h-0 flex-col gap-3 overflow-y-auto overflow-x-hidden rounded-md p-0.5',
                  snapshot.isDraggingOver && 'bg-muted/30'
                )}
              >
                {isLoading && workOrders.length === 0 ? (
                  <div className="space-y-3">
                    {[0, 1, 2].map((index) => (
                      <Skeleton
                        key={index}
                        className="h-32 w-full rounded-lg"
                      />
                    ))}
                  </div>
                ) : (
                  workOrders.map((workOrder, index) => (
                    <WorkOrderKanbanCard
                      key={workOrder.id}
                      workOrder={workOrder}
                      index={index}
                      onArchive={onArchive}
                    />
                  ))
                )}
                {provided.placeholder}
                {!isLoading && workOrders.length === 0 && (
                  <p className="py-4 text-center text-xs text-muted-foreground">
                    No work orders
                  </p>
                )}
              </div>
            )}
          </Droppable>
        </div>
      </div>
    </div>
  );
}
