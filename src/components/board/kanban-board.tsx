"use client"

import { useState, startTransition, useMemo, useEffect } from "react"
import { DndContext, DragEndEvent, DragOverlay } from "@dnd-kit/core"
import { SortableContext, horizontalListSortingStrategy, useSortable, sortableKeyboardCoordinates } from "@dnd-kit/sortable"
import { KanbanColumn } from "./kanban-column"
import { TaskCard } from "./task-card"
import type { KanbanSection, Task, User, TaskTag } from "@prisma/client"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { updateKanbanSectionKanbanOrder, moveTask, reorderTasks } from '@/lib/actions'
import { useOptimistic } from 'react'
import { toast } from 'react-hot-toast'
import { MouseSensor, KeyboardSensor, TouchSensor } from '@/lib/dnd-sensors'
import TaskDetail from '@/components/board/task-detail';
import { useAtom } from 'jotai';
import { taskModal, filterStateAtom, FilterType } from '@/components/board/utils';
import { useFilterAtom, isValidUser, isValidString, isValidDate } from "@/components/filter-popover"
import NewSectionDialog from "./new-section-dialog"
import { KanbanColumnNew } from "./kanban-column-add"
import { useQueryStates, parseAsString } from 'nuqs'
import { useSearchParams } from "next/navigation"

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
  boardId,
}: {
  columns: KanbanSectionWithTasks[]
  tasks: Task[]
  boardId: string
}) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [sortableColumns, setSortableColumns] = useOptimistic(columns)
  const [activeTask, setActiveTask] = useAtom(taskModal)
  const [filterState, setFilterState] = useFilterAtom("kanban-board")
  const [isNewSectionDialogOpen, setIsNewSectionDialogOpen] = useState(false)
  const [creatingColumnId, setCreatingColumnId] = useState<string | null>(null)
   // Sort state (key & direction) comes from URL query params handled by nuqs
   const [{ sort: sortKey, dir: sortDir }] = useQueryStates({
    sort: parseAsString.withDefault(''),
    dir: parseAsString.withDefault('desc'),
  })

  // Read `taskId` from the current URL (e.g. /board?taskId=abc123)
  const searchParams = useSearchParams()
  const urlTaskId = searchParams.get("taskId")

  // Check if the active task is a new task
  useEffect(() => {
    if (activeTask?.type === "new") {
      setCreatingColumnId(sortableColumns[0]?.id)
    }
  }, [activeTask, sortableColumns])

  // ---------------------------------------------------------------------------
  // URL → Atom synchronisation
  // ---------------------------------------------------------------------------
  // When the URL contains a ?taskId=<id> query parameter, automatically open the
  // corresponding task in the detail view by synchronising the `taskModal` Jotai
  // atom. This runs whenever the `taskId` query parameter changes or the set of
  // columns/tasks is updated.
  useEffect(() => {
    if (!urlTaskId) return

    // If the task requested in the URL is already active, do nothing.
    if (activeTask?.taskId === urlTaskId) return

    // Try to locate the kanban section that contains the task so we can include
    // the `kanbanSectionId` in the atom state. If for some reason the task is
    // not found (e.g. stale URL), we still set the taskId so the detail view
    // can handle the missing data gracefully.
    const containingColumn = sortableColumns.find((column) =>
      column.tasks.some((task) => task.id === urlTaskId)
    )

    setActiveTask({
      type: "edit",
      taskId: urlTaskId,
      kanbanSectionId: containingColumn?.id ?? null,
    })
  }, [urlTaskId, sortableColumns, activeTask, setActiveTask])

  // Get the task data for the active task
  const activeTaskData = activeTask ? sortableColumns.flatMap(column => column.tasks).find(task => task.id === activeTask.taskId) : null
  const cleanActiveTaskData = activeTaskData ? {
    ...activeTaskData,
    tags: activeTaskData.tags.map((tag) => tag.id)
  } : null
  
  // Apply filters to tasks
  const applyFilters = (task: Task & {
    assignees: User[];
    createdBy: User;
    files: any[];
    tags: TaskTag[];
  }, filters: FilterType[]): boolean => {
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
        case "Assignee":
          const assigneeIds = task.assignees.map(user => user.id?.toLowerCase() || "");
          return isValidUser(assigneeIds, operator, filterValue)
          
        case "Tag":
          const tagNames = task.tags.map(tag => tag.name?.toLowerCase() || "");
          return isValidString(tagNames, operator, filterValue)
          
        case "Due date":
          if (!task.dueDate) return operator === "is not";
          const dueDate = new Date(task.dueDate).toISOString().split('T')[0];
          return isValidDate(dueDate, operator, filterValue)
          
        case "Created by":
          const creatorName = task.createdBy?.name?.toLowerCase() || "";
          const creatorEmail = task.createdBy?.email?.toLowerCase() || "";
          
          if (operator === "is") 
            return creatorName === filterValue || creatorEmail === filterValue;
          if (operator === "is not") 
            return creatorName !== filterValue && creatorEmail !== filterValue;
          if (operator === "contains") 
            return creatorName.includes(filterValue) || creatorEmail.includes(filterValue);
          if (operator === "does not contain") 
            return !creatorName.includes(filterValue) && !creatorEmail.includes(filterValue);
          break;
          
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
    return sortableColumns.map(column => {
      // First, filter tasks according to the active filters.
      let tasksAfterFilter = column.tasks.filter(task => applyFilters(task, filterState.filters))

      // Then, apply sorting depending on the selected option and direction.
      switch (sortKey) {
        case 'priority':
          tasksAfterFilter = [...tasksAfterFilter].sort((a, b) =>
            sortDir === 'asc' ? a.priority - b.priority : b.priority - a.priority
          )
          break;
        case 'due_date':
          tasksAfterFilter = [...tasksAfterFilter].sort((a, b) => {
            const aTime = a.dueDate ? new Date(a.dueDate).getTime() : Infinity
            const bTime = b.dueDate ? new Date(b.dueDate).getTime() : Infinity
            return sortDir === 'asc' ? aTime - bTime : bTime - aTime
          })
          break;
        default:
          // Keep original order based on taskOrder (lower value first).
          tasksAfterFilter = [...tasksAfterFilter].sort((a, b) => a.taskOrder - b.taskOrder)
      }

      return {
        ...column,
        tasks: tasksAfterFilter,
      }
    })
  }, [sortableColumns, filterState, sortKey, sortDir]);
  

  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if(active.id === over?.id) return;
    if (!over) return;

    const activeColumnIndex = sortableColumns.findIndex((column: KanbanSectionWithTasks) => column.name === active.id);
    const overColumnIndex = sortableColumns.findIndex((column: KanbanSectionWithTasks) => column.name === over.id);

    if (activeColumnIndex !== -1 && overColumnIndex !== -1) {
      // Handle column reordering
      startTransition(() => {
        const updatedColumns = [...sortableColumns];
        const [movedColumn] = updatedColumns.splice(activeColumnIndex, 1);
        updatedColumns.splice(overColumnIndex, 0, movedColumn);

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
      // Handle task reordering
      const activeTaskId = active.id as string;
      const overTaskId = over.id as string;
      
      // Find the source and target columns
      const sourceColumn = sortableColumns.find(column => 
        column.tasks.some(task => task.id === activeTaskId)
      );
      const targetColumn = sortableColumns.find(column => 
        column.tasks.some(task => task.id === overTaskId)
      ) || sortableColumns.find(column => column.name === over.id);

      if (!sourceColumn || !targetColumn) return;

      startTransition(() => {
        // Create a new array of columns
        const updatedColumns = [...sortableColumns];
        
        // Find the task to move
        const taskToMove = sourceColumn.tasks.find(task => task.id === activeTaskId);
        if (!taskToMove) return;

        // Remove task from source column
        const sourceColumnIndex = updatedColumns.findIndex(col => col.id === sourceColumn.id);
        const sourceTasks = sourceColumn.tasks.filter(task => task.id !== activeTaskId);
        updatedColumns[sourceColumnIndex] = {
          ...sourceColumn,
          tasks: sourceTasks
        };

        // Add task to target column
        const targetColumnIndex = updatedColumns.findIndex(col => col.id === targetColumn.id);
        let targetTasks: typeof sourceColumn.tasks;
        let newTaskOrder: number;
        
        if (sourceColumn.id === targetColumn.id) {
          // If reordering within the same column
          targetTasks = [...sourceTasks];
          if (overTaskId === targetColumn.name) {
            // If dropping on the column itself, add to the end
            newTaskOrder = targetTasks.length;
            targetTasks.push(taskToMove);
          } else {
            // If dropping on another task, insert at that position
            const overTaskIndex = targetTasks.findIndex(task => task.id === overTaskId);
            newTaskOrder = overTaskIndex;
            targetTasks.splice(overTaskIndex, 0, taskToMove);
          }
        } else {
          // If moving to a different column
          targetTasks = [...targetColumn.tasks];
          if (overTaskId === targetColumn.name) {
            // If dropping on the column itself, add to the end
            newTaskOrder = targetTasks.length;
            targetTasks.push(taskToMove);
          } else {
            // If dropping on another task, insert at that position
            const overTaskIndex = targetTasks.findIndex(task => task.id === overTaskId);
            newTaskOrder = overTaskIndex;
            targetTasks.splice(overTaskIndex, 0, taskToMove);
          }
        }

        updatedColumns[targetColumnIndex] = {
          ...targetColumn,
          tasks: targetTasks
        };

        setSortableColumns(updatedColumns);

        if (sourceColumn.id === targetColumn.id) {
          // If reordering within the same column
          console.log('Reordering tasks:', targetTasks.map(t => ({ id: t.id, order: t.taskOrder })));
          reorderTasks(targetColumn.id, targetTasks.map(task => task.id))
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
          // If moving to a different column
          console.log('Moving task to new column:', { taskId: activeTaskId, targetColumn: targetColumn.id, newOrder: newTaskOrder });
          moveTask(activeTaskId, targetColumn.id, newTaskOrder)
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
  };

  const handleDragStart = (event: any) => {
    const { active } = event;
    setActiveId(active.id);
  };

  const handleAddTask = (kanbanSectionId: string) => {
    setCreatingColumnId(kanbanSectionId)
  }

  const sensors = [
    {
      sensor: MouseSensor,
      options: {
        activationConstraint: {
          distance: 10,
        },
      },
    },
    {
      sensor: TouchSensor,
      options: {
        activationConstraint: {
          delay: 200,
          tolerance: 6,
        },
      },
    },
    {
      sensor: KeyboardSensor,
      options: {},
    },
  ];

  return (
    <div className="">
      <ScrollArea className="whitespace-nowrap">
        <div className="flex gap-2 py-4 w-max">
            <DndContext 
              onDragEnd={handleDragEnd} 
              onDragStart={handleDragStart}
              sensors={sensors}
              id="kanban-board"
            >
                <SortableContext items={filteredColumns.map(column => column.name)} strategy={horizontalListSortingStrategy}>
                
                  {filteredColumns.map((column, index) => (
                    <KanbanColumn
                      key={index}
                      id={column.id}
                      name={column.name}
                      tasks={column.tasks}
                      boardId={boardId}
                      showCreateCard={creatingColumnId === column.id}
                      onCancelCreate={() => setCreatingColumnId(null)}
                      handleAddTask={() => handleAddTask(column.id)}
                    />
                  ))}

                  {/* Add new section button */}
                  <KanbanColumnNew onAddColumn={() => setIsNewSectionDialogOpen(true)} />

                </SortableContext>
                <DragOverlay>
                  {activeId && sortableColumns.some(column => column.name === activeId) ? (
                      <KanbanColumn
                        id={activeId}
                        name={sortableColumns.find(column => column.name === activeId)!.name}
                        tasks={sortableColumns.find(column => column.name === activeId)!.tasks}
                        // handleAddTask={() => handleAddTask()}
                      />
                  ) : activeId ? (
                      <TaskCard task={sortableColumns.flatMap(column => column.tasks).find(task => task.id === activeId)!} />
                  ) : null}
                </DragOverlay>
            </DndContext>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      <TaskDetail task={cleanActiveTaskData || null} boardId={boardId}/>
      <NewSectionDialog 
        boardId={boardId} 
        isOpen={isNewSectionDialogOpen} 
        onClose={() => setIsNewSectionDialogOpen(false)} 
      />
    </div>
  )
}

