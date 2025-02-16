"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Check } from "lucide-react"
import { useForm } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
    Form,
    FormControl,
    FormDescription,
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
import { getAllUsers, getAllWorkStations } from '@/lib/queries';
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Status, User as PrismaUser, Task } from "@prisma/client";
import { ComboBox } from "@/components/combo-box";
import { createTask } from "src/app/actions";

// Define the form schema using Zod
const formSchema = z.object({
    id: z.string(),
    name: z.string(),
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

interface TaskWithRelations extends Task {
    assignees: string[];
    files: {
        id: string;
        url: string;
        fileName: string;
        taskId: string;
        jobId: string;
    }[];
}

const TaskForm = ({ task }: { task: TaskWithRelations | null }) => {
  const { data: users } = useSWR('allUsers', getAllUsers);
  const { data: workStations } = useSWR('allWorkStations', getAllWorkStations);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: task?.id || "",
      name: task?.name || "",
      taskNumber: task?.taskNumber || "",
      status: task?.status || "Todo",
      dueDate: task?.dueDate ? new Date(task.dueDate) : undefined,
      description: task?.description || "",
      createdById: task?.createdById || "",
      assignees: task?.assignees || [],
      workStationId: task?.workStationId || undefined,
      files: task?.files || []
    }
  })

  // Handle form submission
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    console.log('Form data before submission:', data);

    try {
      const result = await createTask({
        name: data.name,
        taskNumber: data.taskNumber,
        status: data.status,
        dueDate: data.dueDate || new Date(),
        description: data.description,
        createdById: data.createdById,
        assignees: data.assignees,
        workStationId: data.workStationId,
      });

      if (!result.success) {
        // Handle error case
        console.error('Failed to create task:', result.error);
        return;
      }

      // Handle success (e.g., show a success message, redirect, etc.)
      console.log('Task created successfully:', result.data);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  }

  const values = form.getValues()

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="h-full overflow-y-auto py-2">
            <div className="space-y-2">
                <div className="flex items-center justify-between px-6">
                    <Button variant="outline" size="sm" className="gap-2" >
                        <Check className="h-4 w-4" />
                        Mark complete
                    </Button>
                    <div className="flex gap-2">{/* Action buttons would go here */}</div>
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
                                        "mt-2 px-2",
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
    </Form>
  )
}

export default TaskForm; 