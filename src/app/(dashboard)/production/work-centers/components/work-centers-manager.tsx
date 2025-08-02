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
import { WorkCenter, WorkCenterType } from '@prisma/client';
import {
  getWorkCenters,
  createWorkCenter,
  updateWorkCenter,
  deleteWorkCenter,
  GetWorkCentersParams
} from '../actions/work-centers';
import { DataTable } from '@/components/ui/data-table';
import { columns, types, statusOptions } from './columns';
import { SortingState, ColumnFiltersState } from '@tanstack/react-table';

const workCenterSchema = z.object({
  code: z
    .string()
    .min(1, 'Code is required')
    .max(20, 'Code must be less than 20 characters'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().nullable(),
  type: z.nativeEnum(WorkCenterType),
  capacity: z.coerce.number().min(0, 'Capacity must be positive'),
  efficiency: z.coerce
    .number()
    .min(0, 'Efficiency must be between 0 and 1')
    .max(1, 'Efficiency must be between 0 and 1'),
  setupTime: z.coerce.number().min(0, 'Setup time must be positive'),
  costPerHour: z.coerce.number().min(0, 'Cost per hour must be positive'),
  isActive: z.boolean().default(true)
});

type WorkCenterFormData = z.infer<typeof workCenterSchema>;

export function WorkCentersManager() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<{
    workCenters: WorkCenter[];
    pageCount: number;
  }>({
    workCenters: [],
    pageCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWorkCenter, setEditingWorkCenter] = useState<WorkCenter | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);

  const page = Number(searchParams.get('page')) || 1;
  const pageSize = Number(searchParams.get('pageSize')) || 10;
  const search = searchParams.get('search') || '';
  const sortBy = searchParams.get('sortBy') || 'code';
  const sortOrder = (searchParams.get('sortOrder') || 'asc') as 'asc' | 'desc';

  const form = useForm<WorkCenterFormData>({
    resolver: zodResolver(workCenterSchema),
    defaultValues: {
      code: '',
      name: '',
      description: '',
      type: WorkCenterType.MACHINING,
      capacity: 1,
      efficiency: 1,
      setupTime: 0,
      costPerHour: 0,
      isActive: true
    }
  });

  const fetchWorkCenters = useCallback(async () => {
    try {
      const params: GetWorkCentersParams = {
        page,
        pageSize,
        search,
        sortBy,
        sortOrder
      };
      
      const result = await getWorkCenters(params);
      setData({
        workCenters: result.data,
        pageCount: result.totalPages
      });
    } catch (error) {
      toast.error('Failed to load work centers');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, sortBy, sortOrder]);

  useEffect(() => {
    fetchWorkCenters();
  }, [fetchWorkCenters]);

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

  const onSubmit = async (data: WorkCenterFormData) => {
    setSubmitting(true);
    try {
      if (editingWorkCenter) {
        await updateWorkCenter(editingWorkCenter.id, data);
      } else {
        await createWorkCenter(data);
      }

      toast.success(
        `Work center ${editingWorkCenter ? 'updated' : 'created'} successfully`
      );

      setDialogOpen(false);
      fetchWorkCenters();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to save work center'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (workCenter: WorkCenter) => {
    setEditingWorkCenter(workCenter);
    form.reset({
      code: workCenter.code,
      name: workCenter.name,
      description: workCenter.description || '',
      type: workCenter.type,
      capacity: workCenter.capacity,
      efficiency: workCenter.efficiency,
      setupTime: workCenter.setupTime,
      costPerHour: workCenter.costPerHour,
      isActive: workCenter.isActive
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this work center?')) return;

    try {
      await deleteWorkCenter(id);
      toast.success('Work center deleted successfully');
      fetchWorkCenters();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete work center'
      );
    }
  };

  const handleNewWorkCenter = () => {
    setEditingWorkCenter(null);
    form.reset({
      code: '',
      name: '',
      description: '',
      type: WorkCenterType.MACHINING,
      capacity: 1,
      efficiency: 1,
      setupTime: 0,
      costPerHour: 0,
      isActive: true
    });
    setDialogOpen(true);
  };

  return (
    <div className="h-full flex-1 flex-col space-y-4 md:flex">
      <div className="flex items-center justify-between space-y-1">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Work Centers</h2>
          <p className="text-muted-foreground">
            Manage your production work centers
          </p>
        </div>
      </div>

      <DataTable
        loading={loading}
        columns={columns({ onEdit: handleEdit, onDelete: handleDelete })}
        data={data.workCenters}
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
        searchPlaceholder="Filter work centers..."
        filterColumns={[
          {
            id: 'type',
            title: 'Type',
            options: types,
          },
          {
            id: 'isActive',
            title: 'Status',
            options: statusOptions,
          },
        ]}
        actions={
          <Button size="sm" onClick={handleNewWorkCenter}>
            <Plus className="mr-2 h-4 w-4" />
            New Work Center
          </Button>
        }
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingWorkCenter ? 'Edit Work Center' : 'Create Work Center'}
            </DialogTitle>
            <DialogDescription>
              {editingWorkCenter
                ? 'Update the work center details below.'
                : 'Enter the details for the new work center.'}
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
                        <Input placeholder="WC001" {...field} />
                      </FormControl>
                      <FormDescription>
                        Unique identifier for the work center
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
                        <Input placeholder="CNC Machine 1" {...field} />
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
                        placeholder="Describe the work center's purpose and capabilities..."
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(WorkCenterType).map((type) => (
                            <SelectItem key={type} value={type}>
                              {type.replace('_', ' ')}
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
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacity (units/hour)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="1.0"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="efficiency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Efficiency (0-1)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="1"
                          placeholder="0.85"
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
                        <Input type="number" placeholder="30" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="costPerHour"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost per Hour ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="75.00"
                          {...field}
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
                        Enable this work center for production scheduling
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
                  {editingWorkCenter ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}