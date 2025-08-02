'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { DataTable } from '@/components/ui/data-table';
import { columns, statusOptions } from './columns';
import { SortingState, ColumnFiltersState } from '@tanstack/react-table';
import {
  getOperations,
  createOperation,
  updateOperation,
  deleteOperation,
  getWorkCentersForSelect,
  GetOperationsParams
} from '../actions/operations';
import { Prisma } from '@prisma/client';

type OperationWithWorkCenter = Prisma.OperationGetPayload<{
  include: {
    workCenter: true;
  };
}>;

const operationSchema = z.object({
  code: z
    .string()
    .min(1, 'Code is required')
    .max(20, 'Code must be less than 20 characters'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().nullable(),
  workCenterId: z.string().min(1, 'Work center is required'),
  defaultDuration: z.coerce.number().min(1, 'Duration must be at least 1 minute'),
  setupTime: z.coerce.number().min(0, 'Setup time must be positive'),
  requiresSkill: z.string().optional().nullable(),
  isActive: z.boolean().default(true)
});

type OperationFormData = z.infer<typeof operationSchema>;

export function OperationsManager() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<{
    operations: OperationWithWorkCenter[];
    pageCount: number;
  }>({
    operations: [],
    pageCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOperation, setEditingOperation] = useState<OperationWithWorkCenter | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);
  const [workCenters, setWorkCenters] = useState<{ id: string; code: string; name: string }[]>([]);

  const page = Number(searchParams.get('page')) || 1;
  const pageSize = Number(searchParams.get('pageSize')) || 10;
  const search = searchParams.get('search') || '';
  const sortBy = searchParams.get('sortBy') || 'code';
  const sortOrder = (searchParams.get('sortOrder') || 'asc') as 'asc' | 'desc';

  const form = useForm<OperationFormData>({
    resolver: zodResolver(operationSchema),
    defaultValues: {
      code: '',
      name: '',
      description: '',
      workCenterId: '',
      defaultDuration: 30,
      setupTime: 0,
      requiresSkill: '',
      isActive: true
    }
  });

  const fetchOperations = useCallback(async () => {
    try {
      const params: GetOperationsParams = {
        page,
        pageSize,
        search,
        sortBy,
        sortOrder
      };
      
      const result = await getOperations(params);
      setData({
        operations: result.data,
        pageCount: result.totalPages
      });
    } catch (error) {
      toast.error('Failed to load operations');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, sortBy, sortOrder]);

  const fetchWorkCenters = useCallback(async () => {
    try {
      const centers = await getWorkCentersForSelect();
      setWorkCenters(centers);
    } catch (error) {
      toast.error('Failed to load work centers');
    }
  }, []);

  useEffect(() => {
    fetchOperations();
    fetchWorkCenters();
  }, [fetchOperations, fetchWorkCenters]);

  const updateSearchParams = (params: Record<string, string | number | null>) => {
    const current = new URLSearchParams(searchParams.toString());
    
    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === '') {
        current.delete(key);
      } else {
        current.set(key, String(value));
      }
    });

    router.push(`?${current.toString()}`);
  };

  const handlePaginationChange = (pagination: { pageIndex: number; pageSize: number }) => {
    updateSearchParams({
      page: pagination.pageIndex + 1,
      pageSize: pagination.pageSize
    });
  };

  const handleSortingChange = (sorting: SortingState) => {
    if (sorting.length > 0) {
      updateSearchParams({
        sortBy: sorting[0].id,
        sortOrder: sorting[0].desc ? 'desc' : 'asc'
      });
    }
  };

  const handleFilterChange = (filters: ColumnFiltersState) => {
    const searchFilter = filters.find(f => f.id === 'name');
    updateSearchParams({
      search: searchFilter?.value as string || null,
      page: 1
    });
  };

  const onSubmit = async (data: OperationFormData) => {
    setSubmitting(true);
    try {
      if (editingOperation) {
        await updateOperation(editingOperation.id, data);
      } else {
        await createOperation(data);
      }

      toast.success(
        `Operation ${editingOperation ? 'updated' : 'created'} successfully`
      );

      setDialogOpen(false);
      fetchOperations();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to save operation'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (operation: OperationWithWorkCenter) => {
    setEditingOperation(operation);
    form.reset({
      code: operation.code,
      name: operation.name,
      description: operation.description || '',
      workCenterId: operation.workCenterId,
      defaultDuration: operation.defaultDuration,
      setupTime: operation.setupTime,
      requiresSkill: operation.requiresSkill || '',
      isActive: operation.isActive
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this operation?')) return;

    try {
      await deleteOperation(id);
      toast.success('Operation deleted successfully');
      fetchOperations();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete operation'
      );
    }
  };

  const handleNewOperation = () => {
    setEditingOperation(null);
    form.reset({
      code: '',
      name: '',
      description: '',
      workCenterId: '',
      defaultDuration: 30,
      setupTime: 0,
      requiresSkill: '',
      isActive: true
    });
    setDialogOpen(true);
  };

  // Get unique work centers for filtering
  const workCenterOptions = workCenters.map(wc => ({
    value: wc.id,
    label: wc.name,
  }));

  return (
    <div className="h-full flex-1 flex-col space-y-4 md:flex">
      <div className="flex items-center justify-between space-y-1">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Operations</h2>
          <p className="text-muted-foreground">
            Manage your manufacturing operations
          </p>
        </div>
      </div>

      <DataTable
        loading={loading}
        columns={columns({ onEdit: handleEdit, onDelete: handleDelete })}
        data={data.operations}
        pageCount={data.pageCount}
        pagination={{
          pageIndex: page - 1,
          pageSize
        }}
        onPaginationChange={handlePaginationChange}
        sorting={sortBy ? [{ id: sortBy, desc: sortOrder === 'desc' }] : []}
        onSortingChange={handleSortingChange}
        columnFilters={search ? [{ id: 'name', value: search }] : []}
        onColumnFiltersChange={handleFilterChange}
        searchKey="name"
        searchPlaceholder="Filter operations..."
        filterColumns={[
          {
            id: 'workCenter',
            title: 'Work Center',
            options: workCenterOptions,
          },
          {
            id: 'isActive',
            title: 'Status',
            options: statusOptions,
          },
        ]}
        actions={
          <Button size="sm" onClick={handleNewOperation}>
            <Plus className="mr-2 h-4 w-4" />
            New Operation
          </Button>
        }
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingOperation ? 'Edit Operation' : 'Create Operation'}
            </DialogTitle>
            <DialogDescription>
              {editingOperation
                ? 'Update the operation details below.'
                : 'Enter the details for the new operation.'}
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
                      <FormLabel>Code</FormLabel>
                      <FormControl>
                        <Input placeholder="OP001" {...field} />
                      </FormControl>
                      <FormDescription>
                        Unique identifier for the operation
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
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Drilling Operation" {...field} />
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
                        placeholder="Describe the operation details..."
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="workCenterId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Work Center</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a work center" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {workCenters.map((wc) => (
                          <SelectItem key={wc.id} value={wc.id}>
                            {wc.name} ({wc.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="defaultDuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (minutes)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="30"
                          {...field}
                        />
                      </FormControl>
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
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="requiresSkill"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Required Skill</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., CNC Operator"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active</FormLabel>
                      <FormDescription>
                        Enable this operation for use in production
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
                  onClick={() => setDialogOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingOperation ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}