'use client'
import { useDroppable } from "@dnd-kit/core"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { TaskCard } from "./task-card"
import { Button } from "src/components/ui/button"
import { MoreHorizontal, Edit, Trash } from "lucide-react"
import { Job, Task, User } from "@prisma/client"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "src/components/ui/dropdown-menu"
import { useState, useEffect } from 'react';
import { DeleteAlert } from '@/components/delete-alert';
import { deleteWorkStation } from '@/app/actions';
import { toast } from 'react-hot-toast';

// export const dynamic = 'force-dynamic';

interface KanbanColumnProps {
  id: string
  name: string
  jobs: Job[]
  tasks: (Task & {
    assignees: User[];
    createdBy: User;
    files: any[];
  })[]
}

export function KanbanColumn({ id, name, jobs, tasks }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({ id: name });
  const { attributes, listeners, setNodeRef: setSortableNodeRef, transform, transition, isDragging } = useSortable({ 
    id: name,
    data: {
      type: 'column',
      tasks,
      jobs,
    }
  });
  const [isDeleteAlertOpen, setDeleteAlertOpen] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const closeDeleteAlert = () => {
    setDeleteAlertOpen(false);
  }

  // Function to open the delete alert
  const openDeleteAlert = () => {
    setDeleteAlertOpen(true);
  };

  // Function to handle the delete action
  const handleDeleteColumn = async () => {
    console.log(`Deleting column with id: ${id}`);
    try{
      await deleteWorkStation(id);
      toast.success('Column deleted');
      setDeleteAlertOpen(false);
    } catch (error) {
      console.error('Error deleting column', error);
      toast.error('Error deleting column');
      setDeleteAlertOpen(false);
    }
  };

  console.log("tasks", tasks)

  return (
    <div className="dark:bg-gray-800 rounded-lg">
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
              <div data-no-dnd="true">
                <DropdownMenu modal={false}>
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
                    <DropdownMenuItem onClick={openDeleteAlert} className="text-red-600" data-no-dnd>
                      <Trash className="mr-2 h-4 w-4" />
                      Delete column
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
          <div className="p-3">
            <SortableContext items={tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto min-h-[400px]">
                {tasks.map((task) => (
                  task ? <TaskCard key={task.id} task={task} /> : null
                ))}
              </div>
            </SortableContext>
          </div>
        </div>
      </div>
      <div data-no-dnd="true">
        <DeleteAlert
          isOpen={isDeleteAlertOpen}
          onCloseAction={closeDeleteAlert}
          onConfirm={handleDeleteColumn}
          resourceName="column"
        />
      </div>
    </div>
  )
}

