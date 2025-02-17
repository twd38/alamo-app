"use client"

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import TaskForm from './task-form';
import { taskModal } from './utils';
import { useAtom } from 'jotai';
import { Task, User } from '@prisma/client';

interface TaskWithRelations extends Task {
    assignees: User[];
    createdBy: User;
    files: any[];
}

// Mock data for team members
export default function TaskDetail({task}: {task: TaskWithRelations | null}) {
  const [activeTask, setActiveTask] = useAtom(taskModal)
  const handleOpenChange = () => {
    setActiveTask({
      type: null,
      taskId: null,
      workstationId: null,
    })
  }

  const isOpen = activeTask.type !== null;

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange} >
      <SheetContent onOpenAutoFocus={(e) => e.preventDefault()} className="w-full max-w-[90vw] sm:max-w-[700px] overflow-y-auto p-0" >
        <SheetTitle className="hidden">Task</SheetTitle>
        <TaskForm task={task} />
      </SheetContent>
    </Sheet>
  )
}

