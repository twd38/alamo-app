"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
import { CalendarIcon, X } from "lucide-react";
import useSWR from 'swr';
import { getAllUsers, getWorkstations } from '@/lib/queries';
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Status, User, Task } from "@prisma/client";
import { ComboBox } from "@/components/combo-box";
import { createTask, deleteTask, duplicateTask, updateTask } from "src/app/actions";
import { revalidatePath } from "next/cache";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { getStatusConfig } from "@/lib/utils"

interface TaskWithRelations extends Task {
    assignees: User[];
    createdBy: User;
    files: any[];
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
    workStationId: z.string().optional(),
    files: z.array(z.object({
        id: z.string(),
        url: z.string(),
        fileName: z.string(),
        taskId: z.string(),
        jobId: z.string()
    })).optional()
})

const TaskForm = ({ task }: { task: TaskWithRelations | null }) => {
  const [activeTask, setActiveTask] = useAtom(taskModal)
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const router = useRouter()
  const { data: users } = useSWR('allUsers', getAllUsers);
  const { data: workStations } = useSWR('allWorkStations', getWorkstations);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: task?.id || "",
      name: task?.name,
      taskNumber: task?.taskNumber || "",
      status: task?.status || "Todo",
      dueDate: task?.dueDate ? new Date(task.dueDate) : undefined,
      description: task?.description || "",
      createdById: task?.createdById || "",
      assignees: task?.assignees.map(a => a.id) || [],
      workStationId: task?.workStationId || undefined,
      files: task?.files || []
    }
  })

  // Handle form submission
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    console.log('Form data before submission:', data);

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
          workStationId: data.workStationId,
          taskOrder: task.taskOrder
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
          workStationId: data.workStationId || "",
          taskOrder: 0
        });
      }

      if (!result.success) {
        console.error('Failed to save task:', result.error);
        return;
      }

      setActiveTask(null)
      router.refresh();
      console.log('Task saved successfully:', result.data);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  }

  const handleDuplicateTask = async () => {
    if (!task) return;
    
    try {
      const result = await duplicateTask(task.id);
      if (result.success) {
        setActiveTask(null);
        router.refresh();
      }
    } catch (error) {
      console.error('Error duplicating task:', error);
    }
  };

  const handleDeleteTask = async () => {
    if (!task) return;
    
    try {
      const result = await deleteTask(task.id);
      if (result.success) {
        setActiveTask(null);
        router.refresh();
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="h-full overflow-y-auto py-2">
            <div className="space-y-2">
                <div className="flex items-center justify-between px-6">
                    <Button 
                        type="submit"
                        variant="outline" 
                        size="sm" 
                        className="gap-2"
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
                            {/* <FormLabel>Task Name</FormLabel> */}
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
                        <FormField
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
                        />
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
                        <FormField
                            control={form.control}
                            name="workStationId"
                            render={({ field }) => (
                                <FormItem className="flex items-center gap-2">
                                    <FormLabel className="w-24">Work Station</FormLabel>
                                    <ComboBox field={field} defaultValues={workStations || []} />
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
                                <Textarea {...field}
                                    placeholder="What is this task about?" 
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

            

            <div className="space-y-4">
                {/* <h3 className="text-sm font-medium">Comments</h3> */}
                <div className="space-y-4">
                    {/* Comments logic will be handled in TaskDetail */}
                </div>
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