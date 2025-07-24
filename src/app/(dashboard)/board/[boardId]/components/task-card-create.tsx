'use client';

import { useState, useRef } from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { createTask } from '../actions';
import { revalidatePath } from 'next/cache';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Status } from '@prisma/client';
import type { FocusEvent } from 'react';
import { Calendar } from 'lucide-react';

interface TaskCardCreateProps {
  columnId: string;
  boardId: string;
  onCancel: () => void;
}

/**
 * Temporary task card displayed when the user clicks the "add task" button.
 * It renders an input for the task title. When the input loses focus, the task
 * is created in the database if a non-empty title was entered; otherwise the
 * card is dismissed without creating anything.
 */
export function TaskCardCreate({
  columnId,
  boardId,
  onCancel
}: TaskCardCreateProps) {
  const [title, setTitle] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);

  const reset = () => {
    setTitle('');
    onCancel();
  };

  const createNewTask = async () => {
    const trimmed = title.trim();
    if (!trimmed) {
      reset();
      return;
    }

    try {
      const result = await createTask({
        name: trimmed,
        taskNumber: '', // generated elsewhere if needed
        status: 'TODO',
        priority: 0,
        dueDate: new Date(),
        description: '{}', // empty serialized markdown
        createdById: '', // server will infer the user from the session
        assignees: [],
        kanbanSectionId: columnId,
        boardId,
        taskOrder: 0,
        files: [],
        tags: []
      });

      if (!result?.success) {
        toast.error('Failed to create task');
      } else {
        toast.success('Task created');
      }
    } catch (err) {
      console.error('Error creating task', err);
      toast.error('Error creating task');
    } finally {
      // Ensure UI stays in sync
      reset();
    }
  };

  /**
   * Run when the input loses focus.  We defer the check by one tick to allow
   * React to move focus to another element _inside_ the card (for example if
   * the input is remounted). Only when the newly-focused element is outside
   * the temporary card do we commit the task creation.
   */
  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    // Defer so document.activeElement is updated.
    setTimeout(() => {
      const activeEl = document.activeElement as HTMLElement | null;
      if (!cardRef.current?.contains(activeEl)) {
        createNewTask();
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // Prevent form submission inside DnD context.
      e.preventDefault();
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      reset();
    }
  };

  return (
    <Card ref={cardRef} className="cursor-default ">
      <CardHeader className="p-4">
        <Input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title"
          autoFocus
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          data-no-dnd="true"
          className="border-none"
        />

        {/* Due date */}
        {/* <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <Input type="date" />
        </div> */}
      </CardHeader>
    </Card>
  );
}
