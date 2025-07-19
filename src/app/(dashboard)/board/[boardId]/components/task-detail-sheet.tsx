'use client';

import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import TaskForm from './task-form';
import { taskModal } from './utils';
import { useAtom } from 'jotai';
import { Task, User, TaskTag } from '@prisma/client';
import { useRouter, useSearchParams } from 'next/navigation';

interface TaskWithRelations extends Task {
  assignees: User[];
  createdBy: User;
  files: any[];
  tags: string[];
}

// Mock data for team members
export default function TaskDetailSheet({
  task,
  boardId
}: {
  task: TaskWithRelations | null;
  boardId: string;
}) {
  const [activeTask, setActiveTask] = useAtom(taskModal);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleOpenChange = () => {
    // Remove taskId from the URL query params and update the URL without
    // triggering a full page navigation.
    const params = new URLSearchParams(searchParams.toString());
    params.delete('taskId');
    router.replace(`?${params.toString()}`, { scroll: false });

    setActiveTask({
      type: null,
      taskId: null,
      kanbanSectionId: null
    });
  };

  const isOpen = activeTask.type === 'edit';

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="w-full max-w-[90vw] md:max-w-[700px] p-0"
      >
        <SheetTitle className="hidden">Task</SheetTitle>
        <TaskForm task={task} boardId={boardId} />
      </SheetContent>
    </Sheet>
  );
}
