'use client'
import { useDroppable } from "@dnd-kit/core"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { TaskCard } from "./task-card"
import { Button } from "src/components/ui/button"
import { MoreHorizontal, Edit, Trash } from "lucide-react"
import { Job } from "@prisma/client"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "src/components/ui/dropdown-menu"
import { useState, useEffect } from 'react';
import { DeleteAlert } from '@/components/delete-alert';

interface KanbanColumnProps {
  id: string
  name: string
  jobs: Job[]
}

export function KanbanColumn({ id, name, jobs }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({ id });
  const { attributes, listeners, setNodeRef: setSortableNodeRef, transform, transition } = useSortable({ id });
  
  useEffect(() => {
    console.log('KanbanColumn mounted');
    return () => {
      console.log('KanbanColumn unmounted');
    };
  }, []);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // State to manage the visibility of the delete alert
  const [isDeleteAlertOpen, setDeleteAlertOpen] = useState(false);
  console.log(isDeleteAlertOpen)

  // Function to open the delete alert
  const openDeleteAlert = () => {
    setDeleteAlertOpen(true);
  };

  // Function to handle the delete action
  const handleDeleteColumn = () => {
    console.log(`Deleting column with id: ${id}`);
    // Add your delete logic here
    setDeleteAlertOpen(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800">
      <div
        ref={node => {
          setNodeRef(node);
          setSortableNodeRef(node);
        }}
        style={style}
        {...attributes}
        {...listeners}
        className="flex-1 min-w-[280px] max-w-[350px] transition-all duration-200"
      >
        <div className="bg-muted/50 rounded-lg">
          <div className="p-3 bg-primary/5 rounded-t-lg border-b">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold truncate">{name}</h2>
                {/* {machine.scheduledTime && (
                  <div className="flex items-center gap-2 mt-1">
                    <div
                      className={`h-1.5 w-1.5 rounded-full ${
                        machine.status === "active" ? "bg-primary" : "bg-muted-foreground"
                      }`}
                    />
                    <p className="text-xs text-muted-foreground">{machine.scheduledTime}</p>
                  </div>
                )} */}
              </div>
              <DropdownMenu data-no-dnd="true">
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => console.log('Rename column')}>
                    <Edit className="mr-2 h-4 w-4" />
                    Rename column
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={openDeleteAlert} className="text-red-600">
                    <Trash className="mr-2 h-4 w-4" />
                    Delete column
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="p-3">
            <SortableContext items={jobs.map(job => job.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
                {/* {jobs.map((job) => (
                  <TaskCard key={job.id} job={job} />
                ))} */}
              </div>
            </SortableContext>
          </div>
        </div>
      </div>
      <DeleteAlert
        isOpen={isDeleteAlertOpen}
        onClose={() => setDeleteAlertOpen(false)}
        onConfirm={handleDeleteColumn}
        resourceName="column"
      />
    </div>
  )
}

