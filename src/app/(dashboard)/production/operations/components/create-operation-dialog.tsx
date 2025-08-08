'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { createOperationWithProcedure } from '../actions/operations';

interface WorkCenter {
  id: string;
  code: string;
  name: string;
}

interface Procedure {
  id: string;
  code?: string | null;
  title: string;
  description?: string | null;
}

interface CreateOperationDialogProps {
  workCenters: WorkCenter[];
  procedures: Procedure[];
  onSuccess?: () => void;
}

const operationSchema = z.object({
  code: z.string().min(1, 'Code is required').max(20, 'Code must be less than 20 characters'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  workCenterId: z.string().min(1, 'Work center is required'),
  procedureId: z.string().optional(),
  defaultDuration: z.coerce.number().min(1, 'Duration must be at least 1 minute'),
  setupTime: z.coerce.number().min(0, 'Setup time must be positive'),
  requiresSkill: z.string().optional(),
  isActive: z.boolean().default(true),
});

type OperationFormData = z.infer<typeof operationSchema>;

export function CreateOperationDialog({
  workCenters,
  procedures,
  onSuccess
}: CreateOperationDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm<OperationFormData>({
    resolver: zodResolver(operationSchema),
    defaultValues: {
      code: '',
      name: '',
      description: '',
      workCenterId: '',
      procedureId: 'none',
      defaultDuration: 30,
      setupTime: 0,
      requiresSkill: '',
      isActive: true,
    },
  });

  const onSubmit = async (data: OperationFormData) => {
    setIsSubmitting(true);
    try {
      // Prepare data for submission
      const submitData = {
        ...data,
        procedureId: (data.procedureId && data.procedureId !== 'none') ? data.procedureId : null,
        requiresSkill: data.requiresSkill || null,
        description: data.description || null,
      };

      await createOperationWithProcedure(submitData);
      
      toast.success('Operation created successfully');
      setOpen(false);
      form.reset();
      onSuccess?.();
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create operation');
      console.error('Error creating operation:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedProcedure = form.watch('procedureId');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Operation
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Operation</DialogTitle>
          <DialogDescription>
            Define a new operation that can be used in production routings.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Operation Code</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., CUT-100" {...field} />
                    </FormControl>
                    <FormDescription>
                      Unique identifier for this operation
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Operation Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Cut to Length" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what this operation does..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="workCenterId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Work Center</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a work center" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {workCenters.map((wc) => (
                          <SelectItem key={wc.id} value={wc.id}>
                            {wc.code} - {wc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="procedureId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Procedure (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a procedure" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {procedures.map((proc) => (
                          <SelectItem key={proc.id} value={proc.id}>
                            {proc.code ? `${proc.code} - ` : ''}{proc.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Assign a procedure to guide operators
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {selectedProcedure && selectedProcedure !== 'none' && procedures.find(p => p.id === selectedProcedure) && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {procedures.find(p => p.id === selectedProcedure)?.description || 'No description available'}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="defaultDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Duration (minutes)</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormDescription>
                      Standard time to complete this operation
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="setupTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Setup Time (minutes)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormDescription>
                      Time required to prepare for this operation
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="requiresSkill"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Required Skill (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., CNC Operator, Welder" {...field} />
                  </FormControl>
                  <FormDescription>
                    Specific skill or certification required
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Active</FormLabel>
                    <FormDescription>
                      Operation is available for use in routings
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Operation
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}