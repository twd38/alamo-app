'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { CalendarIcon, Settings, Clock, Package } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { UserSelect } from '@/components/user-select';
import { ComboBox } from '@/components/ui/combo-box';
import { getAllUsers } from '@/lib/queries';
import { getWorkOrderTags } from '../queries';
import { WorkOrderStatus, type User, type WorkOrderTag, type Prisma } from '@prisma/client';
import { createWorkOrderWithRouting } from '@/lib/actions/work-order-routing';
import { createWorkOrderTag } from '@/lib/actions';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

// Types for routing data
type RoutingWithSteps = Prisma.RoutingGetPayload<{
  include: {
    steps: {
      include: {
        operation: true;
        workCenter: true;
      };
    };
  };
}>;

// Validation schema
const formSchema = z.object({
  partQty: z.number().int().min(1, { message: 'Quantity must be at least 1' }),
  routingId: z.string().optional(),
  useRouting: z.boolean().default(false),
  dueDate: z.date({ required_error: 'Due date is required' }),
  assigneeIds: z
    .array(z.string())
    .min(1, { message: 'Select at least one assignee' }),
  status: z.nativeEnum(WorkOrderStatus),
  notes: z.string().optional(),
  tagIds: z.array(z.string()).optional(),
  operationAssignments: z.record(z.string()).optional()
});

type FormValues = z.infer<typeof formSchema>;

interface CreateWorkOrderWithRoutingDialogProps {
  part: Prisma.PartGetPayload<{
    include: {
      partImage: true;
      routings: {
        include: {
          steps: {
            include: {
              operation: true;
              workCenter: true;
            };
          };
        };
      };
      workInstructions: true;
    };
  }>;
}

export function CreateWorkOrderWithRoutingDialog({ part }: CreateWorkOrderWithRoutingDialogProps) {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [workOrderTags, setWorkOrderTags] = useState<WorkOrderTag[]>([]);
  const [selectedRouting, setSelectedRouting] = useState<RoutingWithSteps | null>(null);

  // Find active routing
  const activeRouting = part.routings?.find(r => r.isActive);
  const hasRoutings = part.routings && part.routings.length > 0;
  const hasWorkInstructions = part.workInstructions && part.workInstructions.length > 0;

  // Form setup
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      partQty: 1,
      useRouting: hasRoutings,
      routingId: activeRouting?.id,
      dueDate: undefined,
      assigneeIds: [],
      status: WorkOrderStatus.DRAFT,
      notes: '',
      tagIds: [],
      operationAssignments: {}
    }
  });

  const { watch, setValue, handleSubmit, formState } = form;
  const quantity = watch('partQty');
  const useRouting = watch('useRouting');
  const routingId = watch('routingId');

  // Fetch data when dialog opens
  useEffect(() => {
    if (!open) return;
    
    const fetchData = async () => {
      try {
        const [userData, tagData] = await Promise.all([
          getAllUsers(),
          getWorkOrderTags()
        ]);
        setUsers(userData as User[]);
        setWorkOrderTags(tagData);
      } catch (error) {
        console.error('Failed to load data', error);
      }
    };
    fetchData();
  }, [open]);

  // Update selected routing when routingId changes
  useEffect(() => {
    if (routingId && part.routings) {
      const routing = part.routings.find(r => r.id === routingId);
      setSelectedRouting(routing || null);
    } else {
      setSelectedRouting(null);
    }
  }, [routingId, part.routings]);

  // Calculate total time estimate
  const calculateTotalTime = () => {
    if (!selectedRouting) return 0;
    
    return selectedRouting.steps.reduce((total, step) => {
      return total + step.setupTime + (step.runTime * quantity);
    }, 0);
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Handle tag creation
  const handleCreateWorkOrderTag = async (name: string): Promise<WorkOrderTag> => {
    try {
      const result = await createWorkOrderTag(name);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to create tag');
      }
      const newTag = result.data as WorkOrderTag;
      setWorkOrderTags(prev => [...prev, newTag]);
      return newTag;
    } catch (error) {
      console.error('Failed to create work order tag', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create tag');
      throw error;
    }
  };

  // Submit handler
  const onSubmit = useCallback(
    async (data: FormValues) => {
      try {
        const result = await createWorkOrderWithRouting({
          partId: part.id,
          partQty: data.partQty,
          routingId: data.useRouting ? data.routingId : undefined,
          status: data.status,
          dueDate: data.dueDate,
          assigneeIds: data.assigneeIds,
          notes: data.notes ?? '',
          tagIds: data.tagIds ?? [],
          operationAssignments: data.operationAssignments || {}
        });

        if (result?.success && result.data) {
          form.reset();
          setOpen(false);
          toast.success('Work order created', {
            action: {
              label: 'View Work Order',
              onClick: () => {
                window.open(`/production/${result.data.workOrder.id}/edit`, '_blank');
              }
            }
          });
        } else {
          toast.error(result?.error ?? 'Failed to create work order');
        }
      } catch (err) {
        console.error('Failed to create work order', err);
        toast.error('An unexpected error occurred');
      }
    },
    [form, part.id]
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm">
          Create Work Order
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <DialogHeader>
              <DialogTitle>Create Work Order</DialogTitle>
              <DialogDescription>
                Create a new work order for {part.name}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Part preview */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Part Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative w-full aspect-square">
                    <Image
                      src={part.partImage?.key || '/images/placeholder.svg'}
                      alt={part.description}
                      fill
                      className="rounded-md object-cover"
                    />
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">Part Number:</span>
                      <span>{`${part.partNumber} / ${part.partRevision}`}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Name:</span>
                      <span>{part.name}</span>
                    </div>
                    {part.description && (
                      <div>
                        <span className="font-medium">Description:</span>
                        <p className="text-muted-foreground mt-1">{part.description}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Form fields */}
              <div className="space-y-4">
                {/* Quantity */}
                <FormField
                  control={form.control}
                  name="partQty"
                  render={() => (
                    <FormItem>
                      <FormLabel>Quantity *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          value={quantity}
                          onChange={(e) => setValue('partQty', parseInt(e.target.value))}
                          min={1}
                          className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Manufacturing Method Selection */}
                {hasRoutings && hasWorkInstructions && (
                  <FormField
                    control={form.control}
                    name="useRouting"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Manufacturing Method</FormLabel>
                        <FormControl>
                          <RadioGroup
                            value={field.value ? 'routing' : 'instructions'}
                            onValueChange={(value) => field.onChange(value === 'routing')}
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="routing" id="routing" />
                              <Label htmlFor="routing" className="font-normal">
                                Use Routing System (Operation-based)
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="instructions" id="instructions" />
                              <Label htmlFor="instructions" className="font-normal">
                                Use Work Instructions (Legacy)
                              </Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}

                {/* Routing Selection */}
                {useRouting && hasRoutings && (
                  <FormField
                    control={form.control}
                    name="routingId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Routing</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a routing" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {part.routings?.map((routing) => (
                              <SelectItem key={routing.id} value={routing.id}>
                                {routing.routingNumber} - Version {routing.version}
                                {routing.isActive && ' (Active)'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Due date */}
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full justify-start text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, 'PPP') : 'Select date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                            disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Assignees */}
                <FormField
                  control={form.control}
                  name="assigneeIds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assignees *</FormLabel>
                      <UserSelect
                        users={users}
                        value={field.value}
                        onChange={(value) => field.onChange(Array.isArray(value) ? value : [value])}
                        multiSelect
                        placeholder="Select assignees"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Status */}
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Initial Status *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={WorkOrderStatus.DRAFT}>Draft</SelectItem>
                          <SelectItem value={WorkOrderStatus.TODO}>To Do</SelectItem>
                          <SelectItem value={WorkOrderStatus.IN_PROGRESS}>In Progress</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Tags */}
                <FormField
                  control={form.control}
                  name="tagIds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags</FormLabel>
                      <ComboBox<WorkOrderTag, FormValues, 'tagIds'>
                        field={field}
                        defaultValues={workOrderTags}
                        placeholder="Select or create tags"
                        multiSelect
                        onCreateValue={handleCreateWorkOrderTag}
                        renderSelected={(tag) => (
                          <Badge key={tag.id} color={tag.color}>
                            {tag.name}
                          </Badge>
                        )}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Routing Operations Preview */}
            {selectedRouting && useRouting && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Routing Operations</CardTitle>
                  <CardDescription>
                    {selectedRouting.steps.length} operations • 
                    Total estimated time: {formatTime(calculateTotalTime())}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedRouting.steps.map((step, index) => (
                      <div key={step.id} className="flex items-center gap-4 p-3 border rounded-lg">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                          {step.stepNumber}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{step.operation.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {step.workCenter.name} • 
                            Setup: {formatTime(step.setupTime)} • 
                            Run: {formatTime(step.runTime * quantity)}
                          </p>
                        </div>
                        <FormField
                          control={form.control}
                          name={`operationAssignments.${step.stepNumber}`}
                          render={({ field }) => (
                            <FormItem className="w-48">
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="Assign operator" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="unassigned">Unassigned</SelectItem>
                                  {users.map((user) => (
                                    <SelectItem key={user.id} value={user.id}>
                                      {user.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any special instructions or notes"
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  form.reset();
                }}
                disabled={formState.isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={formState.isSubmitting}
                isLoading={formState.isSubmitting}
              >
                {formState.isSubmitting ? 'Creating…' : 'Create Work Order'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}