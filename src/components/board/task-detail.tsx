"use client"

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import TaskForm from './task-form';
import { taskModal } from './utils';
import { useAtom } from 'jotai';
import { Task, User, TaskTag } from '@prisma/client';

interface TaskWithRelations extends Task {
    assignees: User[];
    createdBy: User;
    files: any[];
    tags: string[];
}

// Mock data for team members
export default function TaskDetail({task, boardId}: {task: TaskWithRelations | null, boardId: string}) {
  const [activeTask, setActiveTask] = useAtom(taskModal)
  const handleOpenChange = () => {
    setActiveTask({
      type: null,
      taskId: null,
      kanbanSectionId: null,
    })
  }

  const isOpen = activeTask.type !== null;

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange} modal={false} >
      <SheetContent onOpenAutoFocus={(e) => e.preventDefault()} onInteractOutside={event => event.preventDefault()} className="w-full max-w-[90vw] md:max-w-[700px] overflow-y-auto p-0" >
        <SheetTitle className="hidden">Task</SheetTitle>
        <TaskForm task={task} boardId={boardId} />
      </SheetContent>
    </Sheet>
  )
}

