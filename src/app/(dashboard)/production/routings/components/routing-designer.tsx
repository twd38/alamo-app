'use client';

import { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from './sortable-item';
import { Plus, Save, X, Clock, DollarSign } from 'lucide-react';
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Form,
  FormControl,
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  createRoutingStep,
  updateRoutingStep,
  deleteRoutingStep,
} from '../actions/routings';
import { getOperations } from '../../operations/actions/operations';
import { getWorkCenters } from '../../work-centers/actions/work-centers';
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

type RoutingStepWithRelations = Prisma.RoutingStepGetPayload<{
  include: {
    operation: true;
    workCenter: true;
  };
}>;

const routingStepSchema = z.object({
  stepNumber: z.coerce.number().min(1, 'Step number must be at least 1'),
  operationId: z.string().min(1, 'Operation is required'),
  workCenterId: z.string().min(1, 'Work center is required'),
  setupTime: z.coerce.number().min(0, 'Setup time must be positive'),
  runTime: z.coerce.number().min(0, 'Run time must be positive'),
  queueTime: z.coerce.number().min(0, 'Queue time must be positive'),
  moveTime: z.coerce.number().min(0, 'Move time must be positive'),
  notes: z.string().optional().nullable(),
});

type RoutingStepFormData = z.infer<typeof routingStepSchema>;

interface RoutingDesignerProps {
  routing: RoutingWithRelations;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function RoutingDesigner({ routing, open, onOpenChange, onUpdate }: RoutingDesignerProps) {
  const [steps, setSteps] = useState<RoutingStepWithRelations[]>([]);
  const [operations, setOperations] = useState<any[]>([]);
  const [workCenters, setWorkCenters] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<RoutingStepWithRelations | null>(null);
  const [selectedOperation, setSelectedOperation] = useState<any | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const form = useForm<RoutingStepFormData>({
    resolver: zodResolver(routingStepSchema),
    defaultValues: {
      stepNumber: 1,
      operationId: '',
      workCenterId: '',
      setupTime: 0,
      runTime: 0,
      queueTime: 0,
      moveTime: 0,
      notes: '',
    }
  });

  useEffect(() => {
    if (routing) {
      setSteps([...routing.steps].sort((a, b) => a.stepNumber - b.stepNumber));
    }
  }, [routing]);

  useEffect(() => {
    fetchOperations();
    fetchWorkCenters();
  }, []);

  const fetchOperations = async () => {
    try {
      const result = await getOperations({ pageSize: 100, isActive: true });
      setOperations(result.data);
    } catch (error) {
      toast.error('Failed to load operations');
    }
  };

  const fetchWorkCenters = async () => {
    try {
      const result = await getWorkCenters({ pageSize: 100, isActive: true });
      setWorkCenters(result.data);
    } catch (error) {
      toast.error('Failed to load work centers');
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = steps.findIndex((step) => step.id === active.id);
      const newIndex = steps.findIndex((step) => step.id === over?.id);

      const newSteps = arrayMove(steps, oldIndex, newIndex);
      
      // Update step numbers
      const updatedSteps = newSteps.map((step, index) => ({
        ...step,
        stepNumber: index + 1,
      }));

      setSteps(updatedSteps);

      // Update in database
      try {
        await Promise.all(
          updatedSteps.map((step) =>
            updateRoutingStep(step.id, {
              stepNumber: step.stepNumber,
              operationId: step.operationId,
              workCenterId: step.workCenterId,
              setupTime: step.setupTime,
              runTime: step.runTime,
              queueTime: step.queueTime,
              moveTime: step.moveTime,
              notes: step.notes,
            })
          )
        );
        toast.success('Step order updated');
        onUpdate();
      } catch (error) {
        toast.error('Failed to update step order');
      }
    }
  };

  const onSubmit = async (data: RoutingStepFormData) => {
    try {
      if (editingStep) {
        await updateRoutingStep(editingStep.id, data);
        toast.success('Step updated successfully');
      } else {
        await createRoutingStep(routing.id, data);
        toast.success('Step added successfully');
      }

      setDialogOpen(false);
      onUpdate();
      
      // Refresh local steps
      const updatedRouting = await getOperations({ pageSize: 1 }); // This is a hack, need proper refresh
      window.location.reload(); // Temporary solution
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save step');
    }
  };

  const handleAddStep = () => {
    setEditingStep(null);
    const nextStepNumber = steps.length > 0 ? Math.max(...steps.map(s => s.stepNumber)) + 1 : 1;
    form.reset({
      stepNumber: nextStepNumber,
      operationId: '',
      workCenterId: '',
      setupTime: 0,
      runTime: 0,
      queueTime: 0,
      moveTime: 0,
      notes: '',
    });
    setDialogOpen(true);
  };

  const handleEditStep = (step: RoutingStepWithRelations) => {
    setEditingStep(step);
    form.reset({
      stepNumber: step.stepNumber,
      operationId: step.operationId,
      workCenterId: step.workCenterId,
      setupTime: step.setupTime,
      runTime: step.runTime,
      queueTime: step.queueTime,
      moveTime: step.moveTime,
      notes: step.notes || '',
    });
    setDialogOpen(true);
  };

  const handleDeleteStep = async (stepId: string) => {
    if (!confirm('Are you sure you want to delete this step?')) return;

    try {
      await deleteRoutingStep(stepId);
      toast.success('Step deleted successfully');
      onUpdate();
      window.location.reload(); // Temporary solution
    } catch (error) {
      toast.error('Failed to delete step');
    }
  };

  const calculateTotalTime = () => {
    return steps.reduce((total, step) => {
      return total + step.setupTime + step.runTime + step.queueTime + step.moveTime;
    }, 0);
  };

  const calculateTotalCost = () => {
    return steps.reduce((total, step) => {
      const hourlyRate = step.workCenter.costPerHour || 0;
      const totalMinutes = step.setupTime + step.runTime + step.queueTime + step.moveTime;
      return total + (totalMinutes / 60) * hourlyRate;
    }, 0);
  };

  // Watch for operation selection to auto-populate work center
  useEffect(() => {
    const operationId = form.watch('operationId');
    if (operationId) {
      const operation = operations.find(op => op.id === operationId);
      if (operation) {
        setSelectedOperation(operation);
        form.setValue('workCenterId', operation.workCenterId);
        form.setValue('setupTime', operation.setupTime || 0);
        form.setValue('runTime', operation.defaultDuration || 0);
      }
    }
  }, [form.watch('operationId')]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-4xl">
        <SheetHeader>
          <SheetTitle>Routing Designer</SheetTitle>
          <SheetDescription>
            {routing.part.name} - {routing.routingNumber} v{routing.version}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Steps</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{steps.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Total Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{calculateTotalTime()} min</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <DollarSign className="h-4 w-4 mr-1" />
                  Est. Cost
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">${calculateTotalCost().toFixed(2)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Steps List */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Routing Steps</h3>
              <Button size="sm" onClick={handleAddStep}>
                <Plus className="h-4 w-4 mr-2" />
                Add Step
              </Button>
            </div>

            {steps.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No steps defined yet</p>
                  <Button onClick={handleAddStep}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Step
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={steps.map(s => s.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {steps.map((step) => (
                        <SortableItem
                          key={step.id}
                          id={step.id}
                          step={step}
                          onEdit={handleEditStep}
                          onDelete={handleDeleteStep}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </ScrollArea>
            )}
          </div>
        </div>

        {/* Step Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingStep ? 'Edit Step' : 'Add Step'}
              </DialogTitle>
              <DialogDescription>
                {editingStep
                  ? 'Update the step details below.'
                  : 'Select an operation and configure the step.'}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="stepNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Step Number</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="operationId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Operation</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an operation" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {operations.map((op) => (
                              <SelectItem key={op.id} value={op.id}>
                                {op.name} ({op.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="workCenterId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Work Center</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
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

                <div className="grid grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="setupTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Setup Time (min)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="runTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Run Time (min)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="queueTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Queue Time (min)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="moveTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Move Time (min)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
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
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Additional notes for this step..."
                          {...field}
                          value={field.value || ''}
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
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingStep ? 'Update' : 'Add'} Step
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </SheetContent>
    </Sheet>
  );
}