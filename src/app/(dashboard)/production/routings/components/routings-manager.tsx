'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Loader2, ChevronRight, Clock, Copy, Edit2, Trash2 } from 'lucide-react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import {
  getRoutings,
  createRouting,
  updateRouting,
  deleteRouting,
  getPartsForSelect,
  cloneRouting,
  GetRoutingsParams
} from '../actions/routings';
import { RoutingDesigner } from './routing-designer';
import { Prisma } from '@prisma/client';

type RoutingWithRelations = Prisma.RoutingGetPayload<{
  include: {
    part: true;
    steps: {
      include: {
        operation: true;
        workCenter: true;
      };
    };
  };
}>;

const routingSchema = z.object({
  partId: z.string().min(1, 'Part is required'),
  routingNumber: z.string().min(1, 'Routing number is required'),
  version: z.coerce.number().min(1, 'Version must be at least 1'),
  isActive: z.boolean().default(true),
  effectiveDate: z.coerce.date(),
  expiryDate: z.coerce.date().optional().nullable(),
  notes: z.string().optional().nullable(),
});

type RoutingFormData = z.infer<typeof routingSchema>;

export function RoutingsManager() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [routings, setRoutings] = useState<RoutingWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [designerOpen, setDesignerOpen] = useState(false);
  const [editingRouting, setEditingRouting] = useState<RoutingWithRelations | null>(null);
  const [selectedRouting, setSelectedRouting] = useState<RoutingWithRelations | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [parts, setParts] = useState<any[]>([]);
  const [expandedRoutings, setExpandedRoutings] = useState<Set<string>>(new Set());

  const page = Number(searchParams.get('page')) || 1;
  const pageSize = Number(searchParams.get('pageSize')) || 10;
  const search = searchParams.get('search') || '';
  const sortBy = searchParams.get('sortBy') || 'routingNumber';
  const sortOrder = (searchParams.get('sortOrder') || 'asc') as 'asc' | 'desc';

  const form = useForm<RoutingFormData>({
    resolver: zodResolver(routingSchema),
    defaultValues: {
      partId: '',
      routingNumber: '',
      version: 1,
      isActive: true,
      effectiveDate: new Date(),
      expiryDate: null,
      notes: '',
    }
  });

  const fetchRoutings = useCallback(async () => {
    try {
      const params: GetRoutingsParams = {
        page,
        pageSize,
        search,
        sortBy,
        sortOrder
      };
      
      const result = await getRoutings(params);
      setRoutings(result.data);
    } catch (error) {
      toast.error('Failed to load routings');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, sortBy, sortOrder]);

  const fetchParts = useCallback(async () => {
    try {
      const partsData = await getPartsForSelect();
      setParts(partsData);
    } catch (error) {
      toast.error('Failed to load parts');
    }
  }, []);

  useEffect(() => {
    fetchRoutings();
    fetchParts();
  }, [fetchRoutings, fetchParts]);

  const onSubmit = async (data: RoutingFormData) => {
    setSubmitting(true);
    try {
      if (editingRouting) {
        await updateRouting(editingRouting.id, data);
      } else {
        await createRouting(data);
      }

      toast.success(
        `Routing ${editingRouting ? 'updated' : 'created'} successfully`
      );

      setDialogOpen(false);
      fetchRoutings();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to save routing'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (routing: RoutingWithRelations) => {
    setEditingRouting(routing);
    form.reset({
      partId: routing.partId,
      routingNumber: routing.routingNumber,
      version: routing.version,
      isActive: routing.isActive,
      effectiveDate: new Date(routing.effectiveDate),
      expiryDate: routing.expiryDate ? new Date(routing.expiryDate) : null,
      notes: routing.notes || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this routing and all its steps?')) return;

    try {
      await deleteRouting(id);
      toast.success('Routing deleted successfully');
      fetchRoutings();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete routing'
      );
    }
  };

  const handleClone = async (routing: RoutingWithRelations) => {
    const partId = prompt('Select part ID for cloned routing:', routing.partId);
    if (!partId) return;

    const routingNumber = prompt('Enter routing number for cloned routing:', `${routing.routingNumber}-COPY`);
    if (!routingNumber) return;

    try {
      await cloneRouting(routing.id, partId, routingNumber);
      toast.success('Routing cloned successfully');
      fetchRoutings();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to clone routing'
      );
    }
  };

  const handleNewRouting = () => {
    setEditingRouting(null);
    form.reset({
      partId: '',
      routingNumber: '',
      version: 1,
      isActive: true,
      effectiveDate: new Date(),
      expiryDate: null,
      notes: '',
    });
    setDialogOpen(true);
  };

  const handleDesignRouting = (routing: RoutingWithRelations) => {
    setSelectedRouting(routing);
    setDesignerOpen(true);
  };

  const toggleExpanded = (routingId: string) => {
    const newExpanded = new Set(expandedRoutings);
    if (newExpanded.has(routingId)) {
      newExpanded.delete(routingId);
    } else {
      newExpanded.add(routingId);
    }
    setExpandedRoutings(newExpanded);
  };

  const calculateTotalTime = (routing: RoutingWithRelations) => {
    return routing.steps.reduce((total, step) => {
      return total + step.setupTime + step.runTime + step.queueTime + step.moveTime;
    }, 0);
  };

  return (
    <div className="h-full flex-1 flex-col space-y-4 md:flex">
      <div className="flex items-center justify-between space-y-1">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Routings</h2>
          <p className="text-muted-foreground">
            Define manufacturing process flows
          </p>
        </div>
        <Button size="sm" onClick={handleNewRouting}>
          <Plus className="mr-2 h-4 w-4" />
          New Routing
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : routings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <p className="text-muted-foreground mb-4">No routings found</p>
            <Button onClick={handleNewRouting}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Routing
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {routings.map((routing) => (
            <Card key={routing.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => toggleExpanded(routing.id)}
                    >
                      <ChevronRight
                        className={`h-4 w-4 transition-transform ${
                          expandedRoutings.has(routing.id) ? 'rotate-90' : ''
                        }`}
                      />
                    </Button>
                    <CardTitle className="text-lg">
                      {routing.part.name} - {routing.routingNumber} v{routing.version}
                    </CardTitle>
                    <Badge variant={routing.isActive ? 'default' : 'secondary'}>
                      {routing.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="outline">
                      <Clock className="h-3 w-3 mr-1" />
                      {calculateTotalTime(routing)} min total
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDesignRouting(routing)}
                    >
                      Design
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleClone(routing)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(routing)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(routing.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Part: {routing.part.partNumber} | 
                  Effective: {format(new Date(routing.effectiveDate), 'MMM dd, yyyy')}
                  {routing.expiryDate && ` | Expires: ${format(new Date(routing.expiryDate), 'MMM dd, yyyy')}`}
                </div>
              </CardHeader>
              
              {expandedRoutings.has(routing.id) && (
                <CardContent>
                  {routing.steps.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No steps defined. Click "Design" to add operations.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {routing.steps.map((step) => (
                        <div
                          key={step.id}
                          className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                        >
                          <div className="flex items-center gap-4">
                            <Badge variant="outline">Step {step.stepNumber}</Badge>
                            <div>
                              <p className="font-medium">{step.operation.name}</p>
                              <p className="text-sm text-muted-foreground">
                                @ {step.workCenter.name} | 
                                Setup: {step.setupTime}min | 
                                Run: {step.runTime}min/unit
                              </p>
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Total: {step.setupTime + step.runTime + step.queueTime + step.moveTime} min
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingRouting ? 'Edit Routing' : 'Create Routing'}
            </DialogTitle>
            <DialogDescription>
              {editingRouting
                ? 'Update the routing details below.'
                : 'Enter the details for the new routing.'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="partId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Part</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a part" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {parts.map((part) => (
                          <SelectItem key={part.id} value={part.id}>
                            {part.name} ({part.partNumber})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="routingNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Routing Number</FormLabel>
                      <FormControl>
                        <Input placeholder="RT001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="version"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Version</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="1"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="effectiveDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Effective Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expiryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiry Date (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional notes about this routing..."
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
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active</FormLabel>
                      <FormDescription>
                        Make this routing available for work orders
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
                  {editingRouting ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {selectedRouting && (
        <RoutingDesigner
          routing={selectedRouting}
          open={designerOpen}
          onOpenChange={setDesignerOpen}
          onUpdate={fetchRoutings}
        />
      )}
    </div>
  );
}