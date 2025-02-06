"use client"

import { useState } from "react"
import { DndContext, DragEndEvent, DragOverlay } from "@dnd-kit/core"
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable"
import { KanbanColumn } from "./kanban-column"
import { TaskCard } from "./task-card"
import type { WorkStation, Job } from "@prisma/client"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeColumnIndex = columns.findIndex(column => column.name === active.id);
    const overColumnIndex = columns.findIndex(column => column.name === over.id);

    if (activeColumnIndex !== -1 && overColumnIndex !== -1) {
      const updatedColumns = [...columns];
      const [movedColumn] = updatedColumns.splice(activeColumnIndex, 1);
      updatedColumns.splice(overColumnIndex, 0, movedColumn);

      // setColumns(updatedColumns);
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
    setActiveId(active.id);
  };

  return (
    <div className="">
      <ScrollArea className="whitespace-nowrap ">
        <div className="flex gap-2 py-4 w-max">
            <DndContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
                <SortableContext items={columns.map(column => column.name)} strategy={horizontalListSortingStrategy}>
                
                  {columns.map((column, index) => (
                  <KanbanColumn key={index} id={column.name} name={column.name} jobs={column.jobs} />
                  ))}

                </SortableContext>
                <DragOverlay>
                {activeId && columns.some(column => column.name === activeId) ? (
                    <KanbanColumn
                    id={activeId}
                    name={columns.find(column => column.name === activeId)!.name}
                    jobs={columns.find(column => column.name === activeId)!.jobs}
                    />
                ) : activeId ? (
                    <TaskCard job={columns.flatMap(column => column.jobs).find(job => job.id === activeId)!} />
                ) : null}
                </DragOverlay>
            </DndContext>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}

