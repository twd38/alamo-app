"use client"

import { useState, startTransition } from "react"
import { DndContext, DragEndEvent, DragOverlay } from "@dnd-kit/core"
import { SortableContext, horizontalListSortingStrategy, useSortable } from "@dnd-kit/sortable"
import { KanbanColumn } from "./kanban-column"
import { TaskCard } from "./task-card"
import type { WorkStation, Job, Task, User } from "@prisma/client"
import { ScrollArea, ScrollBar } from "src/components/ui/scroll-area"
import { updateWorkStationKanbanOrder } from 'src/app/actions'
import { useOptimistic } from 'react'
import { toast } from 'react-hot-toast'
import { MouseSensor, KeyboardSensor } from '@/lib/dnd-sensors'

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
  console.log(sortableColumns)
  console.log(activeId)
  console.log(sortableColumns.flatMap(column => column.tasks).find(task => task.id === activeId))

  const handleDragEnd = (event: DragEndEvent) => {
    console.log("drag end")
    const { active, over } = event;
    console.log(event)

    if(active.id === over?.id) return;
    if (!over) return;

    const activeColumnIndex = sortableColumns.findIndex((column: WorkstationWithJobsAndTasks) => column.name === active.id);
    const overColumnIndex = sortableColumns.findIndex((column: WorkstationWithJobsAndTasks) => column.name === over.id);

    if (activeColumnIndex !== -1 && overColumnIndex !== -1) {
      const updatedColumns = [...sortableColumns];
      const [movedColumn] = updatedColumns.splice(activeColumnIndex, 1);
      updatedColumns.splice(overColumnIndex, 0, movedColumn);

      // Update kanbanOrder for each column
      updatedColumns.forEach((column, index) => {
        column.kanbanOrder = index;
      });

      // Optimistically update the UI within a transition
      startTransition(() => {
        console.log("updatedColumns", updatedColumns)
        setSortableColumns(updatedColumns);
      });

      // Update kanbanOrder for each workstation
      updatedColumns.forEach((workstation, index) => {
        updateWorkStationKanbanOrder(workstation.id, index)
          .then(() => {
            // Optionally revalidate or fetch new data here
          })
          .catch(() => {
            // Revert to previous state on error
            setSortableColumns(columns);
            toast.error('Failed to update order. Please try again.');
          });
      });
    } else {
      const activeTaskColumnIndex = columns.findIndex(column =>
        column.tasks.some(task => task.id === active.id)
      );
      const overTaskColumnIndex = columns.findIndex(column =>
        column.tasks.some(task => task.id === over.id) 
      );

      if (activeTaskColumnIndex !== -1 && overTaskColumnIndex !== -1) {
        const activeTaskIndex = columns[activeTaskColumnIndex].tasks.findIndex(task => task.id === active.id);
        const [movedTask] = columns[activeTaskColumnIndex].tasks.splice(activeTaskIndex, 1);

        const overTaskIndex = columns[overTaskColumnIndex].tasks.findIndex(task => task.id === over.id);
        const updatedTasks = [...columns[overTaskColumnIndex].tasks];
        updatedTasks.splice(overTaskIndex, 0, movedTask);

        const updatedColumns = [...columns];
        updatedColumns[overTaskColumnIndex] = {
          ...columns[overTaskColumnIndex],
          tasks: updatedTasks,
        };

        // Update kanbanOrder for each workstation
        updatedColumns.forEach((workstation, index) => {
          updateWorkStationKanbanOrder(workstation.id, index);
        });

        // setColumns(updatedColumns);
      } else if (activeTaskColumnIndex !== -1) {
        const activeTaskIndex = columns[activeTaskColumnIndex].tasks.findIndex(task => task.id === active.id);
        const [movedTask] = columns[activeTaskColumnIndex].tasks.splice(activeTaskIndex, 1);

        const emptyColumnIndex = columns.findIndex(column => column.name === over.id);
        if (emptyColumnIndex !== -1) {
          columns[emptyColumnIndex].tasks.push(movedTask);
          // setColumns([...columns]);
        }
      }
    }
    // setActiveId(null);
  };

  const handleDragStart = (event: any) => {
    console.log("drag start")
    const { active } = event;
    console.log(active.id)
    setActiveId(active.id);
  };

  return (
    <div className="">
      <ScrollArea className="whitespace-nowrap ">
        <div className="flex gap-2 py-4 w-max">
            <DndContext 
              onDragEnd={handleDragEnd} 
              onDragStart={handleDragStart}
              sensors={[
                {
                  sensor: MouseSensor,
                  options: {}
                },
                {
                  sensor: KeyboardSensor,
                  options: {}
                }
              ]}
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
    </div>
  )
}

