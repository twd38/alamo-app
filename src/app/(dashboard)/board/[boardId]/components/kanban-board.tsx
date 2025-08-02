'use client';

import { useState, startTransition, useMemo, useEffect, useCallback } from 'react';
import { DragDropContext, DropResult, DragStart, DragUpdate, Droppable } from '@hello-pangea/dnd';
import { KanbanColumn } from './kanban-column';
import { TaskCard } from './task-card';
import type { KanbanSection, Task, User, TaskTag } from '@prisma/client';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  updateKanbanSectionKanbanOrder,
  moveTask,
  reorderTasks
} from '../actions';
import { useOptimistic } from 'react';
import { toast } from 'sonner';
import TaskDetailSheet from './task-detail-sheet';
import { useAtom } from 'jotai';
import { taskModal, filterStateAtom, FilterType } from './utils';
import {
  useFilterAtom,
  isValidUser,
  isValidString,
  isValidDate
} from '@/components/filter-popover';
import NewSectionDialog from './new-section-dialog';
import { KanbanColumnNew } from './kanban-column-add';
import { useQueryStates, parseAsString } from 'nuqs';
import { useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';

type KanbanSectionWithTasks = KanbanSection & {
  tasks: (Task & {
    assignees: User[];
    createdBy: User;
    files: any[];
    tags: TaskTag[];
  })[];
};

export function KanbanBoard({
  columns,
  tasks,
  boardId
}: {
  columns: KanbanSectionWithTasks[];
  tasks: Task[];
  boardId: string;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sortableColumns, setSortableColumns] = useOptimistic(columns);
  const [activeTask, setActiveTask] = useAtom(taskModal);
  const [filterState, setFilterState] = useFilterAtom('kanban-board');
  const [isNewSectionDialogOpen, setIsNewSectionDialogOpen] = useState(false);
  const [creatingColumnId, setCreatingColumnId] = useState<string | null>(null);
  // Sort state (key & direction) comes from URL query params handled by nuqs
  const [{ sort: sortKey, dir: sortDir }] = useQueryStates({
    sort: parseAsString.withDefault(''),
    dir: parseAsString.withDefault('desc')
  });

  // Read `taskId` from the current URL (e.g. /board?taskId=abc123)
  const searchParams = useSearchParams();
  const urlTaskId = searchParams.get('taskId');

  // Check if the active task is a new task
  useEffect(() => {
    if (activeTask?.type === 'new') {
      setCreatingColumnId(sortableColumns[0]?.id);
    }
  }, [activeTask, sortableColumns]);

  // ---------------------------------------------------------------------------
  // URL → Atom synchronisation
  // ---------------------------------------------------------------------------
  // When the URL contains a ?taskId=<id> query parameter, automatically open the
  // corresponding task in the detail view by synchronising the `taskModal` Jotai
  // atom. This runs whenever the `taskId` query parameter changes or the set of
  // columns/tasks is updated.
  useEffect(() => {
    if (!urlTaskId) return;

    // If the task requested in the URL is already active, do nothing.
    if (activeTask?.taskId === urlTaskId) return;

    // Try to locate the kanban section that contains the task so we can include
    // the `kanbanSectionId` in the atom state. If for some reason the task is
    // not found (e.g. stale URL), we still set the taskId so the detail view
    // can handle the missing data gracefully.
    const containingColumn = sortableColumns.find((column) =>
      column.tasks.some((task) => task.id === urlTaskId)
    );

    setActiveTask({
      type: 'edit',
      taskId: urlTaskId,
      kanbanSectionId: containingColumn?.id ?? null
    });
  }, [urlTaskId, sortableColumns, activeTask, setActiveTask]);

  // Get the task data for the active task
  const activeTaskData = activeTask
    ? sortableColumns
        .flatMap((column) => column.tasks)
        .find((task) => task.id === activeTask.taskId)
    : null;
  const cleanActiveTaskData = activeTaskData
    ? {
        ...activeTaskData,
        tags: activeTaskData.tags.map((tag) => tag.id)
      }
    : null;

  // Apply filters to tasks
  const applyFilters = (
    task: Task & {
      assignees: User[];
      createdBy: User;
      files: any[];
      tags: TaskTag[];
    },
    filters: FilterType[]
  ): boolean => {
    // If no filters, return all tasks
    if (!filters || filters.length === 0) return true;

    // Check if task matches all filters (AND logic)
    return filters.every((filter) => {
      const { type, operator, value } = filter;

      // Skip empty filters
      if (!value.trim()) return true;

      // Convert value to lowercase for case-insensitive comparison
      const filterValue = value.toLowerCase().trim();

      switch (type) {
        case 'Assignee': {
          const assigneeIds = task.assignees.map(
            (user) => user.id?.toLowerCase() || ''
          );
          return isValidUser(assigneeIds, operator, filterValue);
        }

        case 'Tag': {
          const tagNames = task.tags.map(
            (tag) => tag.name?.toLowerCase() || ''
          );
          return isValidString(tagNames, operator, filterValue);
        }

        case 'Due date': {
          if (!task.dueDate) return operator === 'is not';
          const dueDate = new Date(task.dueDate).toISOString().split('T')[0];
          return isValidDate(dueDate, operator, filterValue);
        }

        case 'Created by': {
          const creatorName = task.createdBy?.name?.toLowerCase() || '';
          const creatorEmail = task.createdBy?.email?.toLowerCase() || '';

          if (operator === 'is')
            return creatorName === filterValue || creatorEmail === filterValue;
          if (operator === 'is not')
            return creatorName !== filterValue && creatorEmail !== filterValue;
          if (operator === 'contains')
            return (
              creatorName.includes(filterValue) ||
              creatorEmail.includes(filterValue)
            );
          if (operator === 'does not contain')
            return (
              !creatorName.includes(filterValue) &&
              !creatorEmail.includes(filterValue)
            );
          break;
        }

        default:
          return true;
      }

      return true; // Default case if no condition is met
    });
  };

  /**
   * Apply filters and sorting to the tasks of each column.
   * Sorting rules:
   *   – "priority": higher priority first (desc).
   *   – "due_date": earliest date first (asc). Tasks without a due date are
   *                  pushed to the end.
   *   – default/unknown: keep the existing taskOrder sequence.
   */
  const filteredColumns = useMemo(() => {
    return sortableColumns.map((column) => {
      // First, filter tasks according to the active filters.
      let tasksAfterFilter = column.tasks.filter((task) =>
        applyFilters(task, filterState.filters)
      );

      // Then, apply sorting depending on the selected option and direction.
      switch (sortKey) {
        case 'priority':
          tasksAfterFilter = [...tasksAfterFilter].sort((a, b) =>
            sortDir === 'asc'
              ? a.priority - b.priority
              : b.priority - a.priority
          );
          break;
        case 'due_date':
          tasksAfterFilter = [...tasksAfterFilter].sort((a, b) => {
            const aTime = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
            const bTime = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
            return sortDir === 'asc' ? aTime - bTime : bTime - aTime;
          });
          break;
        default:
          // Keep original order based on taskOrder (lower value first).
          tasksAfterFilter = [...tasksAfterFilter].sort(
            (a, b) => a.taskOrder - b.taskOrder
          );
      }

      return {
        ...column,
        tasks: tasksAfterFilter
      };
    });
  }, [sortableColumns, filterState, sortKey, sortDir]);

  const handleDragEnd = useCallback((result: DropResult) => {
    const { source, destination, type, draggableId } = result;

    // Dropped outside the list
    if (!destination) {
      return;
    }

    // No movement
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    if (type === 'column') {
      // Handle column reordering
      startTransition(() => {
        const updatedColumns = [...sortableColumns];
        const [movedColumn] = updatedColumns.splice(source.index, 1);
        updatedColumns.splice(destination.index, 0, movedColumn);

        // Update kanbanOrder for each column
        updatedColumns.forEach((column, index) => {
          column.kanbanOrder = index;
        });

        setSortableColumns(updatedColumns);

        // Update all column orders in a single batch
        Promise.all(
          updatedColumns.map((workstation, index) =>
            updateKanbanSectionKanbanOrder(workstation.id, index)
          )
        ).catch(() => {
          // Revert to previous state on error
          setSortableColumns(columns);
          toast.error('Failed to update order. Please try again.');
        });
      });
    } else {
      // Handle task movement
      // Use filteredColumns to get the correct task references
      const sourceColumn = filteredColumns.find(
        (col) => col.id === source.droppableId
      );
      const destColumn = filteredColumns.find(
        (col) => col.id === destination.droppableId
      );

      if (!sourceColumn || !destColumn) return;

      // Get the task being moved from the filtered view
      const taskToMove = sourceColumn.tasks[source.index];
      if (!taskToMove) return;

      startTransition(() => {
        // Create a deep copy of columns to avoid mutations
        const updatedColumns = sortableColumns.map(col => ({
          ...col,
          tasks: [...col.tasks]
        }));
        
        const sourceColumnIndex = updatedColumns.findIndex(
          (col) => col.id === source.droppableId
        );
        const destColumnIndex = updatedColumns.findIndex(
          (col) => col.id === destination.droppableId
        );

        if (sourceColumnIndex === -1 || destColumnIndex === -1) return;

        // For same column reordering
        if (source.droppableId === destination.droppableId) {
          const column = updatedColumns[sourceColumnIndex];
          const tasks = [...column.tasks];
          
          // Find the task in the original unfiltered list
          const taskIndex = tasks.findIndex(t => t.id === taskToMove.id);
          if (taskIndex === -1) return;
          
          // Remove the task from its current position
          tasks.splice(taskIndex, 1);
          
          // Calculate where to insert based on the filtered view
          const filteredTasks = sourceColumn.tasks.filter(t => t.id !== taskToMove.id);
          
          if (destination.index >= filteredTasks.length) {
            // Add to the end
            tasks.push(taskToMove);
          } else {
            // Find the task that should be after our moved task
            const afterTask = filteredTasks[destination.index];
            const afterIndex = tasks.findIndex(t => t.id === afterTask.id);
            
            if (afterIndex !== -1) {
              tasks.splice(afterIndex, 0, taskToMove);
            } else {
              tasks.push(taskToMove);
            }
          }
          
          // Update task orders
          tasks.forEach((task, idx) => {
            task.taskOrder = idx;
          });
          
          updatedColumns[sourceColumnIndex] = {
            ...column,
            tasks
          };
        } else {
          // For cross-column moves
          const sourceCol = updatedColumns[sourceColumnIndex];
          const destCol = updatedColumns[destColumnIndex];
          
          // Remove from source
          sourceCol.tasks = sourceCol.tasks.filter(t => t.id !== taskToMove.id);
          sourceCol.tasks.forEach((task, idx) => {
            task.taskOrder = idx;
          });
          
          // Add to destination at the correct position
          const destTasks = [...destCol.tasks];
          const filteredDestTasks = destColumn.tasks;
          
          if (destination.index >= filteredDestTasks.length) {
            destTasks.push(taskToMove);
          } else {
            const afterTask = filteredDestTasks[destination.index];
            const afterIndex = destTasks.findIndex(t => t.id === afterTask.id);
            
            if (afterIndex !== -1) {
              destTasks.splice(afterIndex, 0, taskToMove);
            } else {
              destTasks.push(taskToMove);
            }
          }
          
          // Update task orders
          destTasks.forEach((task, idx) => {
            task.taskOrder = idx;
          });
          
          updatedColumns[destColumnIndex] = {
            ...destCol,
            tasks: destTasks
          };
        }

        // Update the state immediately for optimistic UI
        setSortableColumns(updatedColumns);

        if (source.droppableId === destination.droppableId) {
          // Reordering within the same column
          const reorderedColumn = updatedColumns[sourceColumnIndex];
          reorderTasks(
            destination.droppableId,
            reorderedColumn.tasks.map((task) => task.id)
          )
            .then((result) => {
              if (!result?.success) {
                throw new Error('Failed to reorder tasks');
              }
            })
            .catch((error) => {
              console.error('Failed to reorder tasks:', error);
              setSortableColumns(columns);
              toast.error('Failed to reorder tasks. Please try again.');
            });
        } else {
          // Moving to a different column
          moveTask(draggableId, destination.droppableId, destination.index)
            .then((result) => {
              if (!result?.success) {
                throw new Error('Failed to move task');
              }
            })
            .catch((error) => {
              console.error('Failed to move task:', error);
              setSortableColumns(columns);
              toast.error('Failed to move task. Please try again.');
            });
        }
      });
    }

    setActiveId(null);
  }, [sortableColumns, columns, filteredColumns]);

  const handleDragStart = useCallback((result: DragStart) => {
    setActiveId(result.draggableId);
  }, []);

  const handleAddTask = (kanbanSectionId: string) => {
    setCreatingColumnId(kanbanSectionId);
  };

  return (
    <div className="h-full">
      <DragDropContext
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
      >
        <ScrollArea className="whitespace-nowrap">
          <Droppable droppableId="board" direction="horizontal" type="column">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="flex gap-2 py-4 w-max"
              >
                {filteredColumns.map((column, index) => (
                  <KanbanColumn
                    key={column.id}
                    id={column.id}
                    index={index}
                    name={column.name}
                    tasks={column.tasks}
                    boardId={boardId}
                    showCreateCard={creatingColumnId === column.id}
                    onCancelCreate={() => setCreatingColumnId(null)}
                    handleAddTask={() => handleAddTask(column.id)}
                  />
                ))}
                {provided.placeholder}

                {/* Add new section button */}
                <KanbanColumnNew
                  onAddColumn={() => setIsNewSectionDialogOpen(true)}
                />
              </div>
            )}
          </Droppable>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </DragDropContext>
      <TaskDetailSheet task={cleanActiveTaskData || null} boardId={boardId} />
      <NewSectionDialog
        boardId={boardId}
        isOpen={isNewSectionDialogOpen}
        onClose={() => setIsNewSectionDialogOpen(false)}
      />
    </div>
  );
}
