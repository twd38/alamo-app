'use client';

import { useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, MoreHorizontal } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent
} from '@/components/ui/tooltip';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, X, File, Link as LinkIcon } from 'lucide-react';
import useSWR from 'swr';
import { getAllUsers } from '@/lib/queries';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Prisma, Status, User, Task } from '@prisma/client';
import { ComboBox } from '@/components/ui/combo-box';
import {
  deleteTask,
  duplicateTask,
  updateTask,
  createTaskTag
} from '../actions';
import { useRouter, useParams } from 'next/navigation';
import { useAtom } from 'jotai';
import { taskModal } from './utils';
import { DeleteAlert } from '@/components/delete-alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';
import { MarkdownEditor } from '@/components/markdown-editor';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { generateRandomColor } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  PRIORITY_CONFIG,
  PRIORITY_VALUE_TO_ENUM
} from '@/lib/constants/priority';
import { MoveTaskDialog } from './move-task-dialog';
import { SavingBadge } from '@/components/ui/saving-badge';
import { useDebouncedCallback } from 'use-debounce';
import { copyToClipboard } from '@/lib/utils';
import { FileList } from '@/components/files/file-list';
import Link from 'next/link';
import { getKanbanSections } from '../queries/getKanbanSections';
import { getBoards } from '../queries/getBoards';
import { getTags } from '../queries/getTags';

interface TaskWithRelations extends Task {
  assignees: User[];
  createdBy: User;
  files: any[];
  tags: string[];
}

// Define the form schema using Zod
const formSchema = z.object({
  id: z.string(),
  name: z.string().min(1, { message: 'Task name is required' }),
  taskNumber: z.string(),
  status: z.nativeEnum(Status),
  priority: z.number().int().min(0).max(3),
  epicId: z.string().optional(),
  dueDate: z.date().optional(),
  description: z.string(),
  createdById: z.string(),
  assignees: z.array(z.string()),
  kanbanSectionId: z.string().optional(),
  files: z.array(z.any()),
  tags: z.array(z.string()).optional(),
  private: z.boolean().default(false)
});

const TaskForm = ({
  task,
  boardId
}: {
  task: TaskWithRelations | null;
  boardId: string;
}) => {
  const [activeTask, setActiveTask] = useAtom(taskModal);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isMoveTaskDialogOpen, setIsMoveTaskDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const { data: users } = useSWR('allUsers', getAllUsers);
  const { data: kanbanSections } = useSWR('allKanbanSections', () =>
    getKanbanSections(boardId)
  );
  const { data: tags } = useSWR('allTags', () => getTags(boardId));
  const { data: boards } = useSWR('allBoards', getBoards);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: task?.id || '',
      name: task?.name,
      taskNumber: task?.taskNumber || '',
      priority: typeof task?.priority === 'number' ? task.priority : 0,
      dueDate: task?.dueDate ? new Date(task.dueDate) : undefined,
      description: task?.description || '{}',
      createdById: task?.createdById || '',
      assignees: task?.assignees.map((a) => a.id) || [],
      kanbanSectionId:
        task?.kanbanSectionId || activeTask.kanbanSectionId || undefined,
      files: task?.files || [],
      tags: task?.tags
    }
  });

  const handleDuplicateTask = async () => {
    if (!task) return;

    try {
      const result = await duplicateTask(task.id);
      if (result.success) {
        toast.success('Task duplicated successfully');
        setActiveTask({
          type: null,
          taskId: null,
          kanbanSectionId: null
        });
        router.refresh();
      } else {
        toast.error('Failed to duplicate task');
      }
    } catch (error) {
      console.error('Error duplicating task:', error);
      toast.error('Error duplicating task');
    }
  };

  const handleDeleteTask = async () => {
    if (!task) return;

    try {
      const result = await deleteTask(task.id);
      if (result.success) {
        toast.success('Task deleted successfully');
        setActiveTask({
          type: null,
          taskId: null,
          kanbanSectionId: null
        });
        router.refresh();
      } else {
        toast.error('Failed to delete task');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Error deleting task');
    }
  };

  const isLoading = form.formState.isSubmitting || isSaving;

  /*
   * ---------------------------------------------------------------------
   * Auto-save (debounced) implementation
   * ---------------------------------------------------------------------
   * When the component is editing an existing task, we automatically
   * persist any changes after the user stops interacting for a short
   * period (1 second). This mimics the behaviour of modern editors and
   * avoids the need for the user to press the save button manually.
   */

  const debouncedSubmit = useDebouncedCallback(
    async (values: z.infer<typeof formSchema>) => {
      // Guard clauses – only auto-save when editing (task exists) and the
      // form has unsaved changes.

      if (!task) return;
      // if (!form.formState.isDirty) return;
      if (isSaving) return;

      setIsSaving(true);

      // Reset the form immediately to prevent race conditions
      // This marks the form as clean while we save the current values
      form.reset(values);

      try {
        // Update existing task
        const result = await updateTask(task.id, {
          name: values.name,
          taskNumber: values.taskNumber,
          priority: values.priority,
          epicId: values.epicId,
          dueDate: values.dueDate,
          description: values.description,
          assignees: values.assignees,
          kanbanSectionId: values.kanbanSectionId,
          taskOrder: task.taskOrder,
          files: values.files,
          tags: values.tags
        });

        if (!result.success) {
          console.error('Failed to save task:', result.error);
          toast.error('Failed to save task');
          return;
        }
      } catch (error) {
        console.error('Error submitting form:', error);
        toast.error('Error saving task');
      } finally {
        setIsSaving(false);
      }
    },
    300
  );

  useEffect(() => {
    console.log('task', task);
    if (!task) return;

    // Subscribe to all form value changes.
    const subscription = form.watch((values) => {
      debouncedSubmit(values as z.infer<typeof formSchema>);
    });

    return () => {
      subscription.unsubscribe();
      debouncedSubmit.cancel();
    };
  }, [debouncedSubmit, form, task]);

  return (
    <Form {...form}>
      <form>
        <div className="h-full">
          {/* header */}
          <div className="flex items-center justify-end pr-10 border-b h-12 gap-1">
            <SavingBadge status={isLoading ? 'saving' : 'saved'} />
            {/* copy link to task */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  type="button"
                  onClick={() =>
                    copyToClipboard(`/board/${boardId}/?taskId=${task?.id}`)
                  }
                >
                  <LinkIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy task link</TooltipContent>
            </Tooltip>
            <div className="flex gap-2">
              {task && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleDuplicateTask}>
                      Duplicate task
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setIsMoveTaskDialogOpen(true)}
                    >
                      Move task
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setIsDeleteAlertOpen(true)}
                      className="text-red-600"
                    >
                      Delete task
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
          {/* <div className="w-full h-[1px] bg-border" /> */}
          <ScrollArea className="h-[calc(100vh-3rem)]">
            <div className="px-4 pb-12">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="New Task"
                        className={cn(
                          'mt-4 px-2 text-2xl font-semibold',
                          'border-transparent hover:border-input focus:border-input',
                          'transition-all duration-200'
                        )}
                        autoFocus
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="px-2 flex flex-col pt-2 gap-1">
                <FormField
                  control={form.control}
                  name="assignees"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormLabel className="w-28">Assignee</FormLabel>
                      <ComboBox
                        field={field}
                        defaultValues={users}
                        renderOption={(user, isSelected) => (
                          <div className="flex items-center gap-2 flex-1">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={user.image || ''} />
                              <AvatarFallback>{user.name?.[0]}</AvatarFallback>
                            </Avatar>
                            <span className="flex-1">{user.name}</span>
                            <Check
                              className={cn(
                                'ml-auto',
                                isSelected ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                          </div>
                        )}
                        renderSelected={(user) => (
                          <Badge
                            variant="secondary"
                            key={user.id}
                            className="flex items-center gap-1"
                          >
                            <Avatar className="h-4 w-4">
                              <AvatarImage src={user.image || ''} />
                              <AvatarFallback>{user.name?.[0]}</AvatarFallback>
                            </Avatar>
                            {user.name}
                          </Badge>
                        )}
                        multiSelect
                      />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormLabel className="w-28">Due date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              size="sm"
                              className={cn(
                                'w-[240px] pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? (
                                format(field.value, 'PPP')
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* section */}
                <FormField
                  control={form.control}
                  name="kanbanSectionId"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormLabel className="w-28">Section</FormLabel>
                      <ComboBox
                        field={field}
                        defaultValues={kanbanSections || []}
                      />
                    </FormItem>
                  )}
                />

                {/* priority */}
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormLabel className="w-28">Priority</FormLabel>
                      {/* priority select */}
                      <Select
                        onValueChange={(val) => field.onChange(parseInt(val))}
                        defaultValue={field.value.toString()}
                        value={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger className="w-[240px]">
                            <SelectValue>
                              <Badge color={PRIORITY_CONFIG[field.value].color}>
                                {PRIORITY_CONFIG[field.value].label}
                              </Badge>
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(PRIORITY_CONFIG).map(
                            ([value, priority]) => (
                              <SelectItem key={value} value={value}>
                                <Badge color={priority.color}>
                                  {priority.label}
                                </Badge>
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                {/* tags */}
                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormLabel className="w-28">Tags</FormLabel>
                      <ComboBox
                        field={field}
                        defaultValues={tags || []}
                        onCreateValue={async (value) => {
                          const color = generateRandomColor();
                          const result = await createTaskTag({
                            name: value,
                            color,
                            boardId
                          });
                          const newTag = result.data;
                          return newTag;
                        }}
                        renderSelected={(tag) => (
                          <Badge
                            key={tag.id}
                            className={`flex items-center gap-1`}
                            color={tag.color}
                          >
                            {tag.name}
                          </Badge>
                        )}
                        renderOption={(tag, isSelected) => (
                          <div className="flex items-center gap-2 flex-1">
                            <Badge
                              key={tag.id}
                              className={`flex items-center gap-1 bg-${tag.color}-200 text-${tag.color}-900`}
                            >
                              {tag.name}
                            </Badge>
                            <Check
                              className={cn(
                                'ml-auto',
                                isSelected ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                          </div>
                        )}
                        multiSelect
                      />
                    </FormItem>
                  )}
                />

                {/* description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="w-24">Description</FormLabel>
                      <MarkdownEditor
                        {...field}
                        initialContent={field.value}
                        updateContent={field.onChange}
                        hideSaveStatus={true}
                        hideWordCount={true}
                        size="sm"
                        className={cn(
                          'py-2 px-2 min-h-[200px] border rounded-md',
                          'border-transparent hover:border-input focus:border-input',
                          'transition-all duration-200'
                        )}
                      />
                    </FormItem>
                  )}
                />

                {/* attachments */}
                <FormField
                  control={form.control}
                  name="files"
                  render={({ field: { value, onChange, ...fieldProps } }) => (
                    <FormItem className="mt-2">
                      <FormLabel>Attachments</FormLabel>
                      <FileList
                        files={
                          value?.filter((file): file is any => 'url' in file) ||
                          []
                        }
                        uploadPath="tasks"
                        onUpload={(files) => {
                          const currentFiles = value || [];
                          onChange([...currentFiles, ...files]);
                        }}
                        onDelete={(fileToDelete) => {
                          const currentFiles = value || [];
                          const updatedFiles = currentFiles.filter(
                            (file: any) => file.id !== fileToDelete.id
                          );
                          onChange(updatedFiles);
                        }}
                      />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </ScrollArea>
        </div>
      </form>

      <DeleteAlert
        isOpen={isDeleteAlertOpen}
        onCloseAction={() => setIsDeleteAlertOpen(false)}
        onConfirm={handleDeleteTask}
        resourceName="task"
      />
      {/* 
      {task && boards && (
        <MoveTaskDialog
          isOpen={isMoveTaskDialogOpen}
          onClose={() => setIsMoveTaskDialogOpen(false)}
          taskId={task.id}
          task={task}
          currentBoardId={boardId}
          boards={boards}
        />
      )} */}
    </Form>
  );
};

export default TaskForm;
