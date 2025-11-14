'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { WorkOrdersKanbanColumn } from './work-orders-kanban-column';
import {
  WORK_ORDER_KANBAN_STATUS_CONFIG,
  WORK_ORDER_KANBAN_STATUS_ORDER
} from '../constants';
import type {
  WorkOrderKanbanItem,
  WorkOrdersKanban
} from '../queries/getWorkOrdersKanban';
import { WorkOrderStatus } from '@prisma/client';
import { updateWorkOrder } from '@/lib/actions';
import { toast } from 'sonner';

type ColumnsState = Record<WorkOrderStatus, WorkOrderKanbanItem[]>;

const buildColumnsState = (
  workOrders: WorkOrderKanbanItem[]
): ColumnsState => {
  const initialState = WORK_ORDER_KANBAN_STATUS_ORDER.reduce(
    (acc, status) => {
      acc[status] = [];
      return acc;
    },
    {} as ColumnsState
  );

  workOrders.forEach((workOrder) => {
    const status = workOrder.status as WorkOrderStatus;
    if (!initialState[status]) {
      initialState[status] = [];
    }
    initialState[status].push(workOrder);
  });

  return initialState;
};

interface WorkOrdersKanbanProps {
  workOrders: WorkOrdersKanban['workOrders'];
  loading?: boolean;
  onStatusChange?: () => void;
  onArchive?: () => void;
}

export function WorkOrdersKanban({
  workOrders,
  loading,
  onStatusChange,
  onArchive
}: WorkOrdersKanbanProps) {
  const [columns, setColumns] = useState<ColumnsState>(() =>
    buildColumnsState(workOrders)
  );

  useEffect(() => {
    setColumns(buildColumnsState(workOrders));
  }, [workOrders]);

  const orderedColumns = useMemo(
    () =>
      WORK_ORDER_KANBAN_STATUS_CONFIG.map(({ value, label }) => ({
        status: value,
        label,
        items: columns[value] || []
      })),
    [columns]
  );

  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      const { source, destination, draggableId } = result;
      if (!destination) return;

      const sourceStatus = source.droppableId as WorkOrderStatus;
      const destinationStatus = destination.droppableId as WorkOrderStatus;

      if (
        sourceStatus === destinationStatus &&
        source.index === destination.index
      ) {
        return;
      }

      const previousState = columns;

      setColumns((prev) => {
        const sourceItems = [...(prev[sourceStatus] || [])];
        const destinationItems =
          sourceStatus === destinationStatus
            ? sourceItems
            : [...(prev[destinationStatus] || [])];

        const [movedItem] = sourceItems.splice(source.index, 1);
        if (!movedItem) {
          return prev;
        }

        if (sourceStatus === destinationStatus) {
          destinationItems.splice(destination.index, 0, movedItem);
          return {
            ...prev,
            [sourceStatus]: destinationItems
          };
        }

        const updatedItem = { ...movedItem, status: destinationStatus };
        destinationItems.splice(destination.index, 0, updatedItem);

        return {
          ...prev,
          [sourceStatus]: sourceItems,
          [destinationStatus]: destinationItems
        };
      });

      if (sourceStatus !== destinationStatus) {
        try {
          const response = await updateWorkOrder({
            workOrderId: draggableId,
            status: destinationStatus
          });

          if (!response?.success) {
            throw new Error(response?.error || 'Failed to update work order');
          }

          onStatusChange?.();
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : 'Failed to update work order'
          );
          setColumns(previousState);
        }
      }
    },
    [columns, onStatusChange]
  );

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex-1 overflow-x-auto pb-2">
          <div className="flex h-full gap-4 pr-6">
            {orderedColumns.map((column) => (
              <WorkOrdersKanbanColumn
                key={column.status}
                status={column.status}
                label={column.label}
                workOrders={column.items}
                isLoading={loading}
                onArchive={onArchive}
              />
            ))}
          </div>
        </div>
      </DragDropContext>
    </div>
  );
}

