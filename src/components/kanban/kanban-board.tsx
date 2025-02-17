"use client"

import { useState, startTransition } from "react"
import { DndContext, DragEndEvent, DragOverlay } from "@dnd-kit/core"
import { SortableContext, horizontalListSortingStrategy, useSortable, sortableKeyboardCoordinates } from "@dnd-kit/sortable"
import { KanbanColumn } from "./kanban-column"
import { TaskCard } from "./task-card"
import type { WorkStation, Job, Task, User } from "@prisma/client"
import { ScrollArea, ScrollBar } from "src/components/ui/scroll-area"
import { updateWorkStationKanbanOrder, moveTask, reorderTasks } from 'src/app/actions'
import { useOptimistic } from 'react'
import { toast } from 'react-hot-toast'
import { MouseSensor, KeyboardSensor } from '@/lib/dnd-sensors'
import TaskDetail from '@/components/production/task-detail';
import { useAtom } from 'jotai';
import { taskModal } from '@/components/production/utils';

export const dynamic = 'force-dynamic';

type WorkstationWithJobsAndTasks = WorkStation & {
  jobs: Job[];
    tasks: (Task & {
      assignees: User[];
      createdBy: User;
      files: any[];
    })[];
};

export function KanbanBoard({
  columns,
}: {
  columns: WorkstationWithJobsAndTasks[]
}) {
  // const [columns, setColumns] = useState<WorkstationWithJobs[]>(initialColumns)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [sortableColumns, setSortableColumns] = useOptimistic(columns);
  const [activeTask, setActiveTask] = useAtom(taskModal)
  const activeTaskData = activeTask ? sortableColumns.flatMap(column => column.tasks).find(task => task.id === activeTask) : null

  console.log(sortableColumns)
  console.log(activeId)
  console.log(sortableColumns.flatMap(column => column.tasks).find(task => task.id === activeId))

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if(active.id === over?.id) return;
    if (!over) return;

    const activeColumnIndex = sortableColumns.findIndex((column: WorkstationWithJobsAndTasks) => column.name === active.id);
    const overColumnIndex = sortableColumns.findIndex((column: WorkstationWithJobsAndTasks) => column.name === over.id);

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
            updateWorkStationKanbanOrder(workstation.id, index)
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
    console.log("drag start")
    const { active } = event;
    console.log(active.id)
    setActiveId(active.id);
  };

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
      sensor: KeyboardSensor,
      options: {},
    },
  ];

  return (
    <div className="">
      <ScrollArea className="whitespace-nowrap ">
        <div className="flex gap-2 py-4 w-max">
            <DndContext 
              onDragEnd={handleDragEnd} 
              onDragStart={handleDragStart}
              sensors={sensors}
            >
                <SortableContext items={sortableColumns.map(column => column.name)} strategy={horizontalListSortingStrategy}>
                
                  {sortableColumns.map((column, index) => (
                    <KanbanColumn key={index} id={column.id} name={column.name} jobs={column.jobs} tasks={column.tasks} />
                  ))}

                </SortableContext>
                <DragOverlay>
                  {activeId && sortableColumns.some(column => column.name === activeId) ? (
                      <KanbanColumn
                        id={activeId}
                        name={sortableColumns.find(column => column.name === activeId)!.name}
                        jobs={sortableColumns.find(column => column.name === activeId)!.jobs}
                        tasks={sortableColumns.find(column => column.name === activeId)!.tasks}
                      />
                  ) : activeId ? (
                      <TaskCard task={sortableColumns.flatMap(column => column.tasks).find(task => task.id === activeId)!} />
                  ) : null}
                </DragOverlay>
            </DndContext>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      <TaskDetail task={activeTaskData || null} />
    </div>
  )
}

