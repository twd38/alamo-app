'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { CalendarIcon, MinusIcon, PlusIcon } from 'lucide-react';
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
  FormMessage
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
import { ComboBox, type BaseComboBoxItem } from '@/components/ui/combo-box';
import { getAllUsers } from '@/lib/queries';
import { getWorkOrderTags } from '../queries';
import { WorkOrderStatus, type User, type WorkOrderTag } from '@prisma/client';
import { createWorkOrder, createWorkOrderTag } from '@/lib/actions';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Prisma } from '@prisma/client';

// -----------------------------------------------------------------------------
// Validation schema & types
// -----------------------------------------------------------------------------

const formSchema = z.object({
  partQty: z.number().int().min(1, { message: 'Quantity must be at least 1' }),
  operation: z.string().min(1, { message: 'Operation is required' }),
  timeEstimate: z.string().optional(),
  dueDate: z.date({ required_error: 'Due date is required' }),
  assigneeIds: z
    .array(z.string())
    .min(1, { message: 'Select at least one assignee' }),
  status: z.nativeEnum(WorkOrderStatus),
  notes: z.string().optional(),
  tagIds: z.array(z.string()).optional()
});

type FormValues = z.infer<typeof formSchema>;

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------
interface CreateWorkOrderDialogProps {
  part: Prisma.PartGetPayload<{
    include: {
      partImage: true;
    };
  }>;
}

export function CreateWorkOrderDialog({ part }: CreateWorkOrderDialogProps) {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [workOrderTags, setWorkOrderTags] = useState<WorkOrderTag[]>([]);

  // ---------------------------------------------------------------------------
  // Fetch users and tags when dialog opens
  // ---------------------------------------------------------------------------

  const fetchWorkOrderTags = async () => {
    try {
      const data = await getWorkOrderTags();
      setWorkOrderTags(data);
    } catch (error) {
      console.error('Failed to load work order tags', error);
      setWorkOrderTags([]); // Fallback to empty array
    }
  };

  const handleCreateWorkOrderTag = async (
    name: string
  ): Promise<WorkOrderTag> => {
    try {
      const result = await createWorkOrderTag(name);

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to create tag');
      }

      const newTag = result.data as WorkOrderTag;
      setWorkOrderTags((prev) => [...prev, newTag]);
      return newTag;
    } catch (error) {
      console.error('Failed to create work order tag', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to create tag'
      );
      throw error;
    }
  };

  useEffect(() => {
    if (!open) {
      return;
    }
    const fetchData = async () => {
      try {
        await Promise.all([
          (async () => {
            const userData = await getAllUsers();
            setUsers(userData as User[]);
          })(),
          fetchWorkOrderTags()
        ]);
      } catch (error) {
        console.error('Failed to load data', error);
      }
    };
    fetchData();
  }, [open]);

  // ---------------------------------------------------------------------------
  // Form setup
  // ---------------------------------------------------------------------------
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      partQty: 1,
      operation: 'Manufacture', // reasonable default
      dueDate: new Date(), // filled by user
      assigneeIds: [],
      status: WorkOrderStatus.TODO,
      timeEstimate: '',
      notes: '',
      tagIds: []
    }
  });

  const { watch, setValue, handleSubmit, formState } = form;
  const quantity = watch('partQty');
  const dueDate = watch('dueDate');
  const assigneeIds = watch('assigneeIds');

  //--------------------------------------------------------------------------
  // Handler
  //--------------------------------------------------------------------------
  const onSubmit = useCallback(
    async (data: FormValues) => {
      try {
        const result = await createWorkOrder({
          partId: part.id,
          partQty: data.partQty,
          operation: data.operation,
          status: data.status as WorkOrderStatus,
          timeEstimate: data.timeEstimate ?? '',
          dueDate: data.dueDate,
          assigneeIds: data.assigneeIds,
          notes: data.notes ?? '',
          tagIds: data.tagIds ?? []
        });

        if (result?.success) {
          // eslint-disable-next-line no-console
          console.log('Work order created', result.data);
          form.reset();
          setOpen(false);
          toast.success('Work order created', {
            action: {
              label: 'View Work Order',
              onClick: () => {
                window.open(`/production/${result.data.id}/edit`, '_blank');
              }
            }
          });
        } else {
          console.error(result?.error);
          toast.error(result?.error ?? 'Failed to create work order');
        }
      } catch (err) {
        console.error('Failed to create work order', err);
      }
    },
    [form, part.id]
  );

  //--------------------------------------------------------------------------
  // Render
  //--------------------------------------------------------------------------
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm">
          Create Work Order
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[650px]">
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <DialogHeader>
              <DialogTitle>Create Work Order</DialogTitle>
              <DialogDescription>
                Fill in the details below to create a new work order for this
                part.
              </DialogDescription>
            </DialogHeader>

            {/* -----------------------------------------------------------------
                 Grid layout – image preview & form fields
               ----------------------------------------------------------------- */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Part preview */}
              <div className="space-y-4 border rounded-lg p-4">
                <div className="relative w-full aspect-square">
                  <Image
                    src={part.partImage?.key || '/images/placeholder.svg'}
                    alt={part.description}
                    fill
                    className="rounded-md object-cover"
                  />
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium pr-2">Part Name:</span>
                    {part.name}
                  </div>
                  <div>
                    <span className="font-medium pr-2">Part Number:</span>
                    {`${part.partNumber} / ${part.partRevision}`}
                  </div>
                  <div>
                    <span className="font-medium pr-2">Description:</span>{' '}
                    {part.description || '–'}
                  </div>
                </div>
              </div>

              {/* Form fields */}
              <div className="space-y-4">
                {/* Quantity */}
                <FormField
                  control={form.control}
                  name="partQty"
                  render={() => (
                    <FormItem>
                      <FormLabel>Quantity *</FormLabel>
                      <div className="flex items-center">
                        <FormControl>
                          <Input
                            type="number"
                            value={quantity}
                            onChange={(e) =>
                              setValue(
                                'partQty',
                                Number.parseInt(e.target.value)
                              )
                            }
                            min={1}
                            className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Operation */}
                {/* <FormField
                  control={form.control}
                  name="operation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Operation *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. CNC Machining" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                /> */}

                {/* Time estimate */}
                {/* <FormField
                  control={form.control}
                  name="timeEstimate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time Estimate</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 4h" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                /> */}

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
                              !dueDate && 'text-muted-foreground'
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dueDate ? format(dueDate, 'PPP') : 'Select date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={dueDate}
                            onSelect={(d) => field.onChange(d)}
                            initialFocus
                            disabled={(d) =>
                              d < new Date(new Date().setHours(0, 0, 0, 0))
                            }
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
                  render={() => (
                    <FormItem>
                      <FormLabel>Assignees *</FormLabel>
                      <UserSelect
                        users={users}
                        value={assigneeIds}
                        onChange={(value) =>
                          setValue(
                            'assigneeIds',
                            Array.isArray(value) ? value : [value]
                          )
                        }
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
                      <FormLabel>Status *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={WorkOrderStatus.TODO}>
                            To Do
                          </SelectItem>
                          <SelectItem value={WorkOrderStatus.PAUSED}>
                            Paused
                          </SelectItem>
                          <SelectItem value={WorkOrderStatus.MANUFACTURING}>
                            Manufacturing
                          </SelectItem>
                          <SelectItem value={WorkOrderStatus.QUALITY_CONTROL}>
                            Quality Control
                          </SelectItem>
                          <SelectItem value={WorkOrderStatus.COMPLETED}>
                            Completed
                          </SelectItem>
                          <SelectItem value={WorkOrderStatus.SHIP}>
                            Ship
                          </SelectItem>
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
