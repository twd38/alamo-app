"use client"

import { useState, startTransition } from "react"
import { DndContext, DragEndEvent, DragOverlay } from "@dnd-kit/core"
import { SortableContext, horizontalListSortingStrategy, useSortable } from "@dnd-kit/sortable"
import { KanbanColumn } from "./kanban-column"
import { TaskCard } from "./task-card"
import type { WorkStation, Job } from "@prisma/client"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { updateWorkStationKanbanOrder } from 'app/actions'
import { useOptimistic } from 'react'
import { toast } from 'react-hot-toast'

export const dynamic = 'force-dynamic';

type WorkstationWithJobs = WorkStation & {
  jobs: Job[];
};

export function KanbanBoard({
  columns,
}: {
  columns: WorkstationWithJobs[]
}) {
  // const [columns, setColumns] = useState<WorkstationWithJobs[]>(initialColumns)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [sortableColumns, setSortableColumns] = useOptimistic(columns);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    console.log(event)
    if(active.id === over?.id) return;
    if (!over) return;

    const activeColumnIndex = sortableColumns.findIndex((column: WorkstationWithJobs) => column.name === active.id);
    const overColumnIndex = sortableColumns.findIndex((column: WorkstationWithJobs) => column.name === over.id);

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
      const activeJobColumnIndex = columns.findIndex(column =>
        column.jobs.some(job => job.id === active.id)
      );
      const overJobColumnIndex = columns.findIndex(column =>
        column.jobs.some(job => job.id === over.id) 
      );

      if (activeJobColumnIndex !== -1 && overJobColumnIndex !== -1) {
        const activeJobIndex = columns[activeJobColumnIndex].jobs.findIndex(job => job.id === active.id);
        const [movedJob] = columns[activeJobColumnIndex].jobs.splice(activeJobIndex, 1);

        const overJobIndex = columns[overJobColumnIndex].jobs.findIndex(job => job.id === over.id);
        const updatedJobs = [...columns[overJobColumnIndex].jobs];
        updatedJobs.splice(overJobIndex, 0, movedJob);

        const updatedColumns = [...columns];
        updatedColumns[overJobColumnIndex] = {
          ...columns[overJobColumnIndex],
          jobs: updatedJobs,
        };

        // Update kanbanOrder for each workstation
        updatedColumns.forEach((workstation, index) => {
          updateWorkStationKanbanOrder(workstation.id, index);
        });

        // setColumns(updatedColumns);
      } else if (activeJobColumnIndex !== -1) {
        const activeJobIndex = columns[activeJobColumnIndex].jobs.findIndex(job => job.id === active.id);
        const [movedJob] = columns[activeJobColumnIndex].jobs.splice(activeJobIndex, 1);

        const emptyColumnIndex = columns.findIndex(column => column.name === over.id);
        if (emptyColumnIndex !== -1) {
          columns[emptyColumnIndex].jobs.push(movedJob);
          // setColumns([...columns]);
        }
      }
    }
    setActiveId(null);
  };

  const handleDragStart = (event: any) => {
    const { active } = event;
    console.log(event)
    setActiveId(active.id);
  };

  return (
    <div className="">
      <ScrollArea className="whitespace-nowrap ">
        <div className="flex gap-2 py-4 w-max">
            <DndContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
                <SortableContext items={sortableColumns.map(column => column.name)} strategy={horizontalListSortingStrategy}>
                
                  {sortableColumns.map((column, index) => (
                  <KanbanColumn key={index} id={column.name} name={column.name} jobs={column.jobs} />
                  ))}

                </SortableContext>
                <DragOverlay>
                {activeId && sortableColumns.some(column => column.name === activeId) ? (
                    <KanbanColumn
                    id={activeId}
                    name={sortableColumns.find(column => column.name === activeId)!.name}
                    jobs={sortableColumns.find(column => column.name === activeId)!.jobs}
                    />
                ) : activeId ? (
                    <TaskCard job={sortableColumns.flatMap(column => column.jobs).find(job => job.id === activeId)!} />
                ) : null}
                </DragOverlay>
            </DndContext>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}

