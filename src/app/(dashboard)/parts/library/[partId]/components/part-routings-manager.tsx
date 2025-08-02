'use client';

import { useState, useEffect } from 'react';
import { Plus, Loader2, Trash2, Star, StarOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  getPartRoutings,
  getAvailableRoutings,
  assignRoutingToPart,
  removeRoutingFromPart,
  setDefaultRouting
} from '../actions/part-routings';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { Prisma } from '@prisma/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';

type PartRoutingWithRelations = Prisma.PartRoutingGetPayload<{
  include: {
    routing: {
      include: {
        steps: {
          include: {
            operation: true;
            workCenter: true;
          };
        };
      };
    };
  };
}>;

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

const partRoutingSchema = z.object({
  routingId: z.string().min(1, 'Routing is required'),
  isDefault: z.boolean().default(false)
});

type PartRoutingFormData = z.infer<typeof partRoutingSchema>;

interface PartRoutingsManagerProps {
  partId: string;
}


export function PartRoutingsManager({ partId }: PartRoutingsManagerProps) {
  const [partRoutings, setPartRoutings] = useState<PartRoutingWithRelations[]>([]);
  const [availableRoutings, setAvailableRoutings] = useState<RoutingWithSteps[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const form = useForm<PartRoutingFormData>({
    resolver: zodResolver(partRoutingSchema),
    defaultValues: {
      routingId: '',
      isDefault: false
    }
  });

  const loadPartRoutings = async () => {
    try {
      const data = await getPartRoutings(partId);
      setPartRoutings(data);
    } catch (error) {
      console.error('Error loading part routings:', error);
      toast.error('Failed to load part routings');
    }
  };

  const loadAvailableRoutings = async () => {
    try {
      const data = await getAvailableRoutings();
      setAvailableRoutings(data);
    } catch (error) {
      console.error('Error loading available routings:', error);
      toast.error('Failed to load available routings');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadPartRoutings(), loadAvailableRoutings()]);
      setLoading(false);
    };
    loadData();
  }, [partId]);

  const onSubmit = async (data: PartRoutingFormData) => {
    setSubmitting(true);
    try {
      await assignRoutingToPart({
        partId,
        routingId: data.routingId,
        isDefault: data.isDefault
      });
      
      toast.success('Routing assigned successfully');
      setDialogOpen(false);
      form.reset();
      await loadPartRoutings();
    } catch (error: any) {
      toast.error(error.message || 'Failed to assign routing');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    
    try {
      await removeRoutingFromPart(deletingId);
      toast.success('Routing removed successfully');
      await loadPartRoutings();
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove routing');
    } finally {
      setDeleteDialogOpen(false);
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (partRoutingId: string) => {
    try {
      await setDefaultRouting(partRoutingId);
      toast.success('Default routing updated');
      await loadPartRoutings();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update default routing');
    }
  };

  const calculateTotalTime = (steps: RoutingWithSteps['steps']) => {
    return steps.reduce((total, step) => {
      return total + step.setupTime + step.runTime + step.queueTime + step.moveTime;
    }, 0);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Part Routings</h2>
          <p className="text-muted-foreground">
            Manage manufacturing routings for this part
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Assign Routing
        </Button>
      </div>

      {partRoutings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">
              No routings assigned to this part
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Assign First Routing
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {partRoutings.map((partRouting) => (
            <Card key={partRouting.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">
                      {partRouting.routing.routingNumber} v{partRouting.routing.version}
                    </CardTitle>
                    {partRouting.isDefault && (
                      <Badge variant="secondary">Default</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!partRouting.isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSetDefault(partRouting.id)}
                      >
                        <Star className="h-4 w-4" />
                        Set as Default
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDeletingId(partRouting.id);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {partRouting.routing.notes && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {partRouting.routing.notes}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Effective Date:</span>
                      <span className="ml-2 font-medium">
                        {format(new Date(partRouting.routing.effectiveDate), 'PP')}
                      </span>
                    </div>
                    {partRouting.routing.expiryDate && (
                      <div>
                        <span className="text-muted-foreground">Expiry Date:</span>
                        <span className="ml-2 font-medium">
                          {format(new Date(partRouting.routing.expiryDate), 'PP')}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Total Steps:</span>
                      <span className="ml-2 font-medium">
                        {partRouting.routing.steps.length}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total Time:</span>
                      <span className="ml-2 font-medium">
                        {calculateTotalTime(partRouting.routing.steps)} min
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Routing Steps</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">Step</TableHead>
                          <TableHead>Operation</TableHead>
                          <TableHead>Work Center</TableHead>
                          <TableHead className="text-right">Run Time</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {partRouting.routing.steps.map((step: typeof partRouting.routing.steps[0]) => (
                          <TableRow key={step.id}>
                            <TableCell>{step.stepNumber}</TableCell>
                            <TableCell>{step.operation.name}</TableCell>
                            <TableCell>{step.workCenter.name}</TableCell>
                            <TableCell className="text-right">
                              {step.runTime} min
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Routing to Part</DialogTitle>
            <DialogDescription>
              Select a routing to assign to this part. You can optionally set it as the default routing.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                        {availableRoutings
                          .filter(
                            (r) =>
                              !partRoutings.some(
                                (pr) => pr.routing.id === r.id
                              )
                          )
                          .map((routing) => (
                            <SelectItem key={routing.id} value={routing.id}>
                              {routing.routingNumber} v{routing.version} - {routing.steps.length} steps
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Only routings not already assigned are shown
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isDefault"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Set as Default
                      </FormLabel>
                      <FormDescription>
                        This routing will be used by default for new work orders
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
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Assign Routing
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Routing Assignment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this routing from the part? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </div>
  );
}