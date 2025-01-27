"use client"

import { useState } from "react"
import { DndContext, DragEndEvent, DragOverlay } from "@dnd-kit/core"
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable"
import { KanbanColumn } from "./kanban-column"
import { TaskCard } from "./task-card"
import type { Column, Task } from "app/types/kanban"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Filter, Search } from "lucide-react"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"


const initialColumns: Column[] = [
  {
    machine: {
      name: "Mass Ply Press",
      scheduledTime: "1 hour",
      status: "active",
    },
    tasks: [
      {
        id: "1",
        jobNumber: "J000012",
        partName: "SIP (Floor 1 | Front)",
        operation: "Press",
        status: "In Progress",
        timeEstimate: "3 hours, 30 minutes",
        dueDate: "Due in 1 week",
        serialNumber: "SO000017",
        customer: "Home 1",
        imageUrl: "https://cdn.agacad.com/wp-content/uploads/2023/06/SIP_Documentation-feature-2.jpg",
      },
    ],
  },
  {
    machine: {
      name: "Laguna SmartShop II 8x10 CNC Router",
      scheduledTime: "2 hours",
      status: "active",
    },
    tasks: [
      {
        id: "2",
        jobNumber: "J000013",
        partName: "SIP Panel (Floor 2 | Back)",
        operation: "2D Cutting & Drilling",
        status: "In Progress", 
        timeEstimate: "1 hour, 45 minutes",
        dueDate: "Due in 3 days",
        serialNumber: "SO000018",
        customer: "Home 1",
        imageUrl: "https://cdn.agacad.com/wp-content/uploads/2024/04/33-SIP-finish-layers-1024x637.jpg",
      },
    ],
  },
  {
    machine: {
      name: "Haas VF-2 Vertical Mill",
      scheduledTime: "45 minutes",
      status: "idle",
    },
    tasks: [
        {
            id: "3",
            jobNumber: "J000014",
            partName: "Bracket",
            operation: "Inspection",
            status: "Todo",
            timeEstimate: "2 hours, 40 minutes",
            dueDate: "Due in 4 days",
            serialNumber: "SO000019",
            customer: "LMN Industries",
            imageUrl: "https://d2t1xqejof9utc.cloudfront.net/screenshots/pics/e0924fc495ba13bc373c31d38eeb5243/large.jpg",
        },
    ],
  },
  {
    machine: {
      name: "Assembly",
      status: "idle",
    },
    tasks: [],
  },
  {
    machine: {
      name: "Hotwire CNC",
      scheduledTime: "1 hour, 30 minutes",
      status: "active",
    },
    tasks: [
      {
        id: "4",
        jobNumber: "J000015",
        partName: "Insulation Panel",
        operation: "Cut insulation",
        status: "In Progress",
        timeEstimate: "2 hours",
        dueDate: "Due in 2 days",
        serialNumber: "SO000020",
        customer: "XYZ Corp",
        imageUrl: "https://www.insulation4less.com/bootstrap/assets/images/Rigid_Foam_Board_Insulation.jpg",
      },
    ],
  },
]

export function KanbanBoard() {
  const [columns, setColumns] = useState<Column[]>(initialColumns)
  const [activeId, setActiveId] = useState<string | null>(null)

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeColumnIndex = columns.findIndex(column => column.machine.name === active.id);
    const overColumnIndex = columns.findIndex(column => column.machine.name === over.id);

    if (activeColumnIndex !== -1 && overColumnIndex !== -1) {
      const updatedColumns = [...columns];
      const [movedColumn] = updatedColumns.splice(activeColumnIndex, 1);
      updatedColumns.splice(overColumnIndex, 0, movedColumn);

      setColumns(updatedColumns);
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

        setColumns(updatedColumns);
      } else if (activeTaskColumnIndex !== -1) {
        const activeTaskIndex = columns[activeTaskColumnIndex].tasks.findIndex(task => task.id === active.id);
        const [movedTask] = columns[activeTaskColumnIndex].tasks.splice(activeTaskIndex, 1);

        const emptyColumnIndex = columns.findIndex(column => column.machine.name === over.id);
        if (emptyColumnIndex !== -1) {
          columns[emptyColumnIndex].tasks.push(movedTask);
          setColumns([...columns]);
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search" className="pl-8 w-[250px]" />
          </div>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </div>
        <div className="flex items-center gap-4">
            <Button variant="outline">Display</Button>
        </div>
      </div>
      <ScrollArea className="whitespace-nowrap ">
        <div className="flex gap-2 py-4 w-max">
            <DndContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
                <SortableContext items={columns.map(column => column.machine.name)} strategy={horizontalListSortingStrategy}>
                
                        {columns.map((column, index) => (
                        <KanbanColumn key={index} id={column.machine.name} machine={column.machine} tasks={column.tasks} />
                        ))}

                </SortableContext>
                <DragOverlay>
                {activeId && columns.some(column => column.machine.name === activeId) ? (
                    <KanbanColumn
                    id={activeId}
                    machine={columns.find(column => column.machine.name === activeId)!.machine}
                    tasks={columns.find(column => column.machine.name === activeId)!.tasks}
                    />
                ) : activeId ? (
                    <TaskCard task={columns.flatMap(column => column.tasks).find(task => task.id === activeId)!} />
                ) : null}
                </DragOverlay>
            </DndContext>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}

