'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { ComboBox } from '@/components/combo-box';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { updateTask } from '@/lib/actions';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useAtom } from 'jotai';
import { taskModal } from './utils';
import { getKanbanSections } from '@/lib/queries';
import useSWR from 'swr';
import { Task } from '@prisma/client';

const formSchema = z.object({
  boardId: z.string(),
  kanbanSectionId: z.string()
});

interface MoveTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  task: Task;
  currentBoardId: string;
  boards: { id: string; name: string }[];
}

export function MoveTaskDialog({
  isOpen,
  onClose,
  taskId,
  task,
  currentBoardId,
  boards
}: MoveTaskDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [activeTask, setActiveTask] = useAtom(taskModal);

  const handleClose = () => {
    setActiveTask({
      type: null,
      taskId: null,
      kanbanSectionId: null
    });
    onClose();
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      boardId: '',
      kanbanSectionId: ''
    }
  });

  const selectedBoardId = form.watch('boardId');
  const selectedKanbanSectionId = form.watch('kanbanSectionId');

  const { data: kanbanSections } = useSWR(
    selectedBoardId ? `kanbanSections-${selectedBoardId}` : null,
    () => getKanbanSections(selectedBoardId)
  );

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);
      const result = await updateTask(taskId, {
        boardId: data.boardId,
        kanbanSectionId: data.kanbanSectionId,
        taskOrder: 0,
        tags: []
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      toast.success('Task moved successfully');
      setActiveTask({
        type: null,
        taskId: null,
        kanbanSectionId: null
      });
      router.refresh();
      handleClose();
    } catch (error) {
      console.error('Error moving task:', error);
      toast.error('Failed to move task');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move Task</DialogTitle>
          <DialogDescription>
            Select the board and column where you want to move this task.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="boardId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Board</FormLabel>
                  <FormControl>
                    <ComboBox
                      field={field}
                      defaultValues={boards}
                      placeholder="Select a board..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {selectedBoardId && (
              <FormField
                control={form.control}
                name="kanbanSectionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Column</FormLabel>
                    <FormControl>
                      <ComboBox
                        field={field}
                        defaultValues={kanbanSections}
                        placeholder="Select a column..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  isLoading || !selectedBoardId || !selectedKanbanSectionId
                }
                isLoading={isLoading}
              >
                Move Task
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
