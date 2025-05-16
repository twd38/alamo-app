"use client"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Check, MoreHorizontal } from "lucide-react"
import { useForm } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
  } from "@/components/ui/form";
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, X, Paperclip, File } from "lucide-react";
import useSWR from 'swr';
import { 
    getAllUsers, 
    getKanbanSections,
    getAllTags
} from '@/lib/queries';
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Status, User, Task, TaskTag } from "@prisma/client";
import { ComboBox } from "@/components/combo-box";
import { 
    createTask, 
    deleteTask, 
    duplicateTask, 
    updateTask, 
    updateDataAndRevalidate, 
    getFileUrlFromKey, 
    createTag 
} from "@/lib/actions";
import { useRouter } from "next/navigation";
import { useAtom } from "jotai";
import { taskModal } from "./utils";
import { DeleteAlert } from "@/components/delete-alert";
import { 
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { MarkdownEditor } from "@/components/markdown-editor";
import { getStatusConfig, formatFileSize } from "@/lib/utils"
import { toast } from "react-hot-toast";
import STLViewer from "@/components/stl-viewer";
import { generateRandomColor } from "@/lib/utils";

interface TaskWithRelations extends Task {
    assignees: User[];
    createdBy: User;
    files: any[];
    tags: string[];
}

// Define the form schema using Zod
const formSchema = z.object({
    id: z.string(),
    name: z.string().min(1, { message: "Task name is required" }),
    taskNumber: z.string(),
    status: z.nativeEnum(Status),
    dueDate: z.date().optional(),
    description: z.string(),
    createdById: z.string(),
    assignees: z.array(z.string()),
    kanbanSectionId: z.string().optional(),
    files: z.array(
        z.union([
            //  or existing file records
            z.object({
                id: z.string(),
                url: z.string(),
                key: z.string(),
                name: z.string(),
                type: z.string(),
                size: z.number(),
                taskId: z.string(),
                jobId: z.string()
            }),
            // For newly uploaded files
            z.custom<File>((data) => {
                return data && 
                    typeof data === 'object' && 
                    'name' in data && 
                    'size' in data && 
                    'type' in data;
            }, {
                message: "Must be a valid file"
            })
        ])
    ).optional(),
    tags: z.array(z.string()).optional(),
    private: z.boolean().default(false)
})

const TaskForm = ({ task }: { task: TaskWithRelations | null }) => {
  const [activeTask, setActiveTask] = useAtom(taskModal)
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const router = useRouter()
  const { data: users } = useSWR('allUsers', getAllUsers);
  const { data: kanbanSections } = useSWR('allKanbanSections', getKanbanSections);
  const { data: tags } = useSWR('allTags', getAllTags);
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: task?.id || "",
      name: task?.name,
      taskNumber: task?.taskNumber || "",
      status: task?.status || "todo",
      dueDate: task?.dueDate ? new Date(task.dueDate) : undefined,
      description: task?.description || "{}",
      createdById: task?.createdById || "",
      assignees: task?.assignees.map(a => a.id) || [],
      kanbanSectionId: task?.kanbanSectionId || activeTask.kanbanSectionId || undefined,
      files: task?.files || [],
      tags: task?.tags,
      private: task?.private || false
    }
  })

  // Handle form submission
  const submitForm = async (data: z.infer<typeof formSchema>) => {
    console.log("form data", data)
    try {
      let result;
      
      if (task) {
        // Update existing task
        result = await updateTask(task.id, {
          name: data.name,
          taskNumber: data.taskNumber,
          status: data.status,
          dueDate: data.dueDate,
          description: data.description,
          assignees: data.assignees,
          kanbanSectionId: data.kanbanSectionId,
          taskOrder: task.taskOrder,
          files: data.files,
          tags: data.tags,
          private: data.private
        });
      } else {
        // Create new task
        result = await createTask({
          name: data.name,
          taskNumber: data.taskNumber,
          status: data.status,
          dueDate: data.dueDate || new Date(),
          description: data.description,
          createdById: data.createdById,
          assignees: data.assignees,
          kanbanSectionId: data.kanbanSectionId || "",
          taskOrder: 0,
          files: data.files as File[],
          tags: data.tags,
          private: data.private
        });
      }

      if (!result.success) {
        console.error('Failed to save task:', result.error);
        toast.error('Failed to save task');
        return;
      }

      toast.success('Task saved successfully');
      setActiveTask({
        type: null,
        taskId: null,
        kanbanSectionId: null,
      })
      updateDataAndRevalidate("/production")
      router.refresh();
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Error saving task');
    }
  }

  const handleDuplicateTask = async () => {
    if (!task) return;
    
    try {
      const result = await duplicateTask(task.id);
      if (result.success) {
        toast.success('Task duplicated successfully');
        setActiveTask({
            type: null,
            taskId: null,
            kanbanSectionId: null,
        })
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
            kanbanSectionId: null,
        })
        router.refresh();
      } else {
        toast.error('Failed to delete task');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Error deleting task');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const currentFiles = form.getValues('files') || [];
    
    // Validate file size (10MB limit)
    const invalidFiles = files.filter(file => file.size > 10 * 1024 * 1024);
    if (invalidFiles.length > 0) {
      toast.error('Files must be less than 10MB');
      return;
    }

    form.setValue('files', [...currentFiles, ...files]);
  };

  const handleRemoveFile = (index: number) => {
    const currentFiles = form.getValues('files') || [];
    const updatedFiles = currentFiles.filter((_, i) => i !== index);
    form.setValue('files', updatedFiles);
  };

  const handleFileDownload = async (key: string, fileName: string) => {
    console.log(key)
    try {
      const result = await getFileUrlFromKey(key);
      if (result.success && result.url) {
        // Open in new window
        window.open(result.url, '_blank');
      } else {
        toast.error('Failed to open file');
      }
    } catch (error) {
      console.error('Error opening file:', error);
      toast.error('Error opening file');
    }
  };

  const isLoading = form.formState.isSubmitting
  console.log(isLoading)

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submitForm)} className="space-y-8">
        <div className="h-full overflow-y-auto py-2">
            <div className="space-y-2">
                <div className="flex items-center justify-between px-6">
                    <Button 
                        type="submit"
                        variant="outline" 
                        size="sm" 
                        className="gap-2"
                        isLoading={isLoading}
                    >
                        <Check className="h-4 w-4" />
                        {task ? 'Save changes' : 'Create task'}
                    </Button>
                    <div className="flex gap-2">
                        {task && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={handleDuplicateTask}>
                                        Duplicate task
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
                <div className="w-full h-[1px] bg-border" />

                <div className="px-4 space-y-2">
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
                                        "mt-4 px-2 text-2xl font-semibold",
                                        "border-transparent hover:border-input focus:border-input",
                                        "transition-all duration-200"
                                    )}
                                    autoFocus
                                />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="px-2 flex flex-col gap-2">
                        <FormField
                            control={form.control}
                            name="assignees"
                            render={({ field }) => (
                                <FormItem className="flex items-center gap-2">
                                    <FormLabel className="w-24">Assignee</FormLabel>
                                    <ComboBox 
                                            field={field} 
                                            defaultValues={users} 
                                            renderOption={(user, isSelected) => (
                                            <div className="flex items-center gap-2 flex-1">
                                                <Avatar className="h-6 w-6">
                                                    <AvatarImage src={user.image || ""} />
                                                    <AvatarFallback>{user.name?.[0]}</AvatarFallback>
                                                </Avatar>
                                                <span className="flex-1">{user.name}</span>
                                                <Check
                                                    className={cn(
                                                        "ml-auto",
                                                        isSelected ? "opacity-100" : "opacity-0"
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
                                                    <AvatarImage src={user.image || ""} />
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
                        {/* <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem className="flex items-center gap-2">
                                    <FormLabel className="w-24">Status</FormLabel>
                                    <Select 
                                        onValueChange={field.onChange} 
                                        defaultValue={field.value}
                                        value={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="w-[240px]">
                                                <SelectValue>
                                                    {(() => {
                                                        const { label, variant } = getStatusConfig(field.value as Status)
                                                        return <Badge variant={variant}>{label}</Badge>
                                                    })()}
                                                </SelectValue>
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {Object.values(Status).map((status) => {
                                                const { label, variant } = getStatusConfig(status)
                                                return (
                                                    <SelectItem 
                                                        key={status} 
                                                        value={status}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <Badge variant={variant}>{label}</Badge>
                                                    </SelectItem>
                                                )
                                            })}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        /> */}
                        <FormField
                            control={form.control}
                            name="dueDate"
                            render={({ field }) => (
                                <FormItem className="flex items-center gap-2">
                                    <FormLabel className="w-24">Due date</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant="outline"
                                                    className={cn(
                                                        "w-[240px] pl-3 text-left font-normal",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    {field.value ? (
                                                        format(field.value, "PPP")
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
                                    <FormLabel className="w-24">Section</FormLabel>
                                    <ComboBox 
                                        field={field} 
                                        defaultValues={kanbanSections || []} 
                                    />
                                </FormItem>
                            )}
                        />

                        {/* tags */}
                        <FormField
                            control={form.control}
                            name="tags"
                            render={({ field }) => (
                                <FormItem className="flex items-center gap-2">
                                    <FormLabel className="w-24">Tags</FormLabel>
                                    <ComboBox 
                                        field={field} 
                                        defaultValues={tags || []} 
                                        onCreateValue={async (value) => {
                                            const color = generateRandomColor()
                                            const result = await createTag({
                                                name: value,
                                                color: color
                                            })
                                            const newTag = result.data
                                            return newTag
                                        }}
                                        renderSelected={(tag) => (
                                            <Badge 
                                                key={tag.id}
                                                className={`flex items-center gap-1 bg-${tag.color}-500`}
                                            >
                                                {tag.name}
                                            </Badge>
                                        )}
                                        renderOption={(tag, isSelected) => (
                                            <div className="flex items-center gap-2 flex-1">
                                                <Badge 
                                                    key={tag.id}
                                                    className={`bg-${tag.color}-500 hover:bg-${tag.color}-500/80`}
                                                >
                                                    {tag.name}
                                                </Badge>
                                                <Check
                                                    className={cn(
                                                        "ml-auto",
                                                        isSelected ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                            </div>
                                        )}
                                        multiSelect
                                    />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="private"
                            render={({ field }) => (
                                <FormItem className="flex items-center gap-2">
                                    <FormLabel className="w-24">Private</FormLabel>
                                    <FormControl>
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                checked={field.value}
                                                onChange={field.onChange}
                                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                            />
                                            <span className="text-sm text-muted-foreground">
                                                Only visible to creator
                                            </span>
                                        </div>
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="files"
                            render={({ field: { value, onChange, ...fieldProps } }) => (
                                <FormItem>
                                    <FormLabel className="w-24">Attachments</FormLabel>
                                    <div className="flex flex-col items-start gap-2">
                                        <Input 
                                            {...fieldProps} 
                                            type="file" 
                                            className="hidden" 
                                            multiple 
                                            ref={fileInputRef} 
                                            onChange={handleFileChange}
                                            accept=""
                                        />
                                        <Button 
                                            type="button"
                                            variant="outline" 
                                            onClick={() => fileInputRef.current?.click()} 
                                            className="gap-2"
                                        >
                                            <Paperclip className="h-4 w-4" />
                                            Attach Files
                                        </Button>
                                        <div className="flex-1 w-full gap-2">
                                            {value && value.length > 0 && (
                                                <div className="mt-2 space-y-2">
                                                    {value.map((file, index) => (
                                                        <div key={`${index}-parent`}>
                                                        <div key={index} className="flex items-center justify-between bg-muted p-2 rounded-md">
                                                            <div className="flex items-center gap-2">
                                                                <File className="h-4 w-4" />
                                                                {('url' in file) ? (
                                                                    <Button
                                                                        variant="link"
                                                                        className="p-0 h-auto"
                                                                        onClick={() => handleFileDownload(file.key, file.name)}
                                                                    >
                                                                        <span className="text-sm hover:underline">{file.name}</span>
                                                                    </Button>
                                                                ) : (
                                                                    <span className="text-sm">{file.name}</span>
                                                                )}
                                                                <span className="text-xs text-muted-foreground">({formatFileSize(file.size)})</span>
                                                            </div>
                                                            <Button 
                                                                type="button"
                                                                variant="ghost" 
                                                                size="sm" 
                                                                onClick={() => handleRemoveFile(index)} 
                                                                className="h-8 w-8 p-0"
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                        {('url' in file) ? (
                                                            <STLViewer 
                                                                fileType={"pdf"}
                                                                filePath={file.url}
                                                                key={`${index}-viewer`}
                                                            />):(<div key={`${index}-viewer`}></div>)}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </FormItem>
                            )}
                        />
                        
                    </div>

                <div className="gap-2 pt-2">
                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="w-24 px-2 align-text-top">Description</FormLabel>
                                <MarkdownEditor 
                                    {...field}
                                    initialContent={field.value} 
                                    updateContent={field.onChange} 
                                    hideSaveStatus={true}
                                    hideWordCount={true}
                                    className={cn(
                                        "mt-2 px-2 min-h-[200px]",
                                        "border-transparent hover:border-input focus:border-input",
                                        "transition-all duration-200"
                                    )}
                                />
                            </FormItem>
                        )}
                    />
                </div>
            </div>
            </div>
        </div>
      </form>

      <DeleteAlert
        isOpen={isDeleteAlertOpen}
        onCloseAction={() => setIsDeleteAlertOpen(false)}
        onConfirm={handleDeleteTask}
        resourceName="task"
      />
    </Form>
  )
}

export default TaskForm; 