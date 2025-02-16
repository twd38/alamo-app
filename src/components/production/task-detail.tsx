"use client"

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import TaskForm from './task-form';
import { taskModal } from './utils';
import { useAtom } from 'jotai';


// Mock data for team members
export default function TaskDetail() {
  const [activeTask, setActiveTask] = useAtom(taskModal)

  return (
    <Sheet open={activeTask ? true : false} onOpenChange={() => setActiveTask(null)} >
      <SheetContent onOpenAutoFocus={(e) => e.preventDefault()} className="w-full max-w-[90vw] sm:max-w-[700px] overflow-y-auto p-0" >
        <SheetTitle className="hidden">Task</SheetTitle>
        <TaskForm task={null} />
      </SheetContent>
    </Sheet>
  )
}

