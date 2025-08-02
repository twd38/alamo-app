'use client';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { TaskCard } from './task-card';
import { Button } from 'src/components/ui/button';
import { MoreHorizontal, Edit, Trash, Plus } from 'lucide-react';
import { Task, User, TaskTag } from '@prisma/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from 'src/components/ui/dropdown-menu';
import { useState, useEffect } from 'react';
import { DeleteAlert } from '@/components/delete-alert';
import { deleteKanbanSection } from '../actions';
import { toast } from 'sonner';
import EditColumnDialog from './edit-column-dialog';
import { TaskCardCreate } from './task-card-create';
// export const dynamic = 'force-dynamic';

interface KanbanColumnProps {
  id: string;
  index: number;
  name: string;
  tasks: (Task & {
    assignees: User[];
    createdBy: User;
    files: any[];
    tags: TaskTag[];
  })[];
  handleAddTask?: () => void;
  boardId?: string;
  showCreateCard?: boolean;
  onCancelCreate?: () => void;
}

export function KanbanColumn({
  id,
  index,
  name,
  tasks,
  handleAddTask,
  boardId,
  showCreateCard,
  onCancelCreate
}: KanbanColumnProps) {
  const [isDeleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);

  const closeDeleteAlert = () => {
    setDeleteAlertOpen(false);
  };

  // Function to open the delete alert
  const openDeleteAlert = () => {
    setDeleteAlertOpen(true);
  };

  // Function to handle the delete action
  const handleDeleteColumn = async () => {
    try {
      await deleteKanbanSection(id);
      toast.success('Column deleted');
      setDeleteAlertOpen(false);
    } catch (error) {
      console.error('Error deleting column', error);
      toast.error('Error deleting column');
      setDeleteAlertOpen(false);
    }
  };

  const openEditDialog = () => {
    setEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setEditDialogOpen(false);
  };

  // console.log("tasks", tasks)

  return (
    <Draggable draggableId={id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className="dark:bg-gray-800 rounded-lg"
          style={{
            ...provided.draggableProps.style,
            opacity: snapshot.isDragging ? 0.5 : 1
          }}
        >
          <div className="flex-1 w-[280px] transition-all duration-200">
            <div className="bg-muted/50 rounded-lg flex flex-col  h-[calc(100vh-140px)]">
              <div
                className="px-3 py-2 bg-primary/5 rounded-t-lg border-b"
                {...provided.dragHandleProps}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-semibold truncate">{name}</h2>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 -mr-2"
                    onClick={handleAddTask}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <div data-no-dnd="true">
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 -mr-2"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={openEditDialog}>
                          <Edit className="mr-2 h-4 w-4" />
                          Rename column
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={openDeleteAlert}
                          className="text-red-600"
                          data-no-dnd
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Delete column
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
              <div className="p-2 flex-1 overflow-hidden">
                {showCreateCard && boardId && (
                  <div className="space-y-2 mb-2">
                    <TaskCardCreate
                      columnId={id}
                      boardId={boardId}
                      onCancel={onCancelCreate || (() => {})}
                    />
                  </div>
                )}
                <Droppable droppableId={id} type="task">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`space-y-2 h-full overflow-y-auto ${
                        snapshot.isDraggingOver ? 'bg-muted/30' : ''
                      }`}
                    >
                      {tasks.map((task, index) =>
                        task ? (
                          <TaskCard key={task.id} task={task} index={index} />
                        ) : null
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
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
            <EditColumnDialog
              columnId={id}
              columnName={name}
              isOpen={isEditDialogOpen}
              onClose={closeEditDialog}
            />
          </div>
        </div>
      )}
    </Draggable>
  );
}
