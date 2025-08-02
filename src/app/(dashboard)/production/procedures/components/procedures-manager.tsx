'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Loader2, X, FileText, Shield, CheckSquare, Image, Video } from 'lucide-react';
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
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  getProcedures,
  createProcedure,
  updateProcedure,
  deleteProcedure,
  getOperationsForSelect,
  GetProceduresParams
} from '../actions/procedures';
import { Prisma } from '@prisma/client';

type ProcedureWithOperation = Prisma.ProcedureGetPayload<{
  include: {
    operation: {
      include: {
        workCenter: true;
      };
    };
  };
}>;

const procedureSchema = z.object({
  operationId: z.string().min(1, 'Operation is required'),
  stepNumber: z.coerce.number().min(1, 'Step number must be at least 1'),
  title: z.string().min(1, 'Title is required'),
  instructions: z.string().min(1, 'Instructions are required'),
  estimatedTime: z.coerce.number().min(1, 'Estimated time must be at least 1 minute'),
  requiredTools: z.array(z.string()).default([]),
  safetyNotes: z.string().optional().nullable(),
  qualityChecks: z.array(z.string()).default([]),
  imageUrls: z.array(z.string()).default([]),
  videoUrl: z.string().optional().nullable(),
});

type ProcedureFormData = z.infer<typeof procedureSchema>;

export function ProceduresManager() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [procedures, setProcedures] = useState<ProcedureWithOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProcedure, setEditingProcedure] = useState<ProcedureWithOperation | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [operations, setOperations] = useState<any[]>([]);
  const [selectedOperation, setSelectedOperation] = useState<string | null>(null);

  const form = useForm<ProcedureFormData>({
    resolver: zodResolver(procedureSchema),
    defaultValues: {
      operationId: '',
      stepNumber: 1,
      title: '',
      instructions: '',
      estimatedTime: 15,
      requiredTools: [],
      safetyNotes: '',
      qualityChecks: [],
      imageUrls: [],
      videoUrl: '',
    }
  });


  const fetchProcedures = useCallback(async () => {
    try {
      const params: GetProceduresParams = {
        operationId: selectedOperation || undefined,
      };
      
      const result = await getProcedures(params);
      setProcedures(result.data);
    } catch (error) {
      toast.error('Failed to load procedures');
    } finally {
      setLoading(false);
    }
  }, [selectedOperation]);

  const fetchOperations = useCallback(async () => {
    try {
      const ops = await getOperationsForSelect();
      setOperations(ops);
    } catch (error) {
      toast.error('Failed to load operations');
    }
  }, []);

  useEffect(() => {
    fetchProcedures();
    fetchOperations();
  }, [fetchProcedures, fetchOperations]);

  const onSubmit = async (data: ProcedureFormData) => {
    setSubmitting(true);
    try {
      if (editingProcedure) {
        await updateProcedure(editingProcedure.id, data);
      } else {
        await createProcedure(data);
      }

      toast.success(
        `Procedure ${editingProcedure ? 'updated' : 'created'} successfully`
      );

      setDialogOpen(false);
      fetchProcedures();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to save procedure'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (procedure: ProcedureWithOperation) => {
    setEditingProcedure(procedure);
    form.reset({
      operationId: procedure.operationId,
      stepNumber: procedure.stepNumber,
      title: procedure.title,
      instructions: procedure.instructions,
      estimatedTime: procedure.estimatedTime,
      requiredTools: procedure.requiredTools || [],
      safetyNotes: procedure.safetyNotes || '',
      qualityChecks: procedure.qualityChecks || [],
      imageUrls: procedure.imageUrls || [],
      videoUrl: procedure.videoUrl || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this procedure?')) return;

    try {
      await deleteProcedure(id);
      toast.success('Procedure deleted successfully');
      fetchProcedures();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete procedure'
      );
    }
  };

  const handleNewProcedure = () => {
    setEditingProcedure(null);
    
    // Find the next step number for the selected operation
    const operationProcedures = procedures.filter(p => p.operationId === selectedOperation);
    const nextStepNumber = operationProcedures.length > 0 
      ? Math.max(...operationProcedures.map(p => p.stepNumber)) + 1 
      : 1;

    form.reset({
      operationId: selectedOperation || '',
      stepNumber: nextStepNumber,
      title: '',
      instructions: '',
      estimatedTime: 15,
      requiredTools: [],
      safetyNotes: '',
      qualityChecks: [],
      imageUrls: [],
      videoUrl: '',
    });
    setDialogOpen(true);
  };

  // Group procedures by operation
  const proceduresByOperation = procedures.reduce((acc, procedure) => {
    const opId = procedure.operationId;
    if (!acc[opId]) {
      acc[opId] = {
        operation: procedure.operation,
        procedures: []
      };
    }
    acc[opId].procedures.push(procedure);
    return acc;
  }, {} as Record<string, { operation: any; procedures: ProcedureWithOperation[] }>);

  return (
    <div className="h-full flex-1 flex-col space-y-4 md:flex">
      <div className="flex items-center justify-between space-y-1">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Procedures</h2>
          <p className="text-muted-foreground">
            Manage step-by-step instructions for operations
          </p>
        </div>
        <Button size="sm" onClick={handleNewProcedure}>
          <Plus className="mr-2 h-4 w-4" />
          New Procedure
        </Button>
      </div>

      <div className="space-y-4">
        <Select value={selectedOperation || ''} onValueChange={setSelectedOperation}>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Filter by operation..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={''}>All Operations</SelectItem>
            {operations.map((op) => (
              <SelectItem key={op.id} value={op.id}>
                {op.name} ({op.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : Object.keys(proceduresByOperation).length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No procedures found</p>
              <Button className="mt-4" onClick={handleNewProcedure}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Procedure
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {Object.values(proceduresByOperation).map(({ operation, procedures }) => (
              <Card key={operation.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div>
                      <span>{operation.name}</span>
                      <Badge variant="outline" className="ml-2">
                        {operation.code}
                      </Badge>
                      <span className="text-sm text-muted-foreground ml-2">
                        @ {operation.workCenter.name}
                      </span>
                    </div>
                    <span className="text-sm font-normal text-muted-foreground">
                      {procedures.length} procedure{procedures.length !== 1 ? 's' : ''}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {procedures
                      .sort((a, b) => a.stepNumber - b.stepNumber)
                      .map((procedure) => (
                        <div
                          key={procedure.id}
                          className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary">
                                Step {procedure.stepNumber}
                              </Badge>
                              <h4 className="font-semibold">{procedure.title}</h4>
                              <Badge variant="outline">
                                {procedure.estimatedTime} min
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2 whitespace-pre-wrap">
                              {procedure.instructions}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {procedure.requiredTools.length > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  🔧 {procedure.requiredTools.length} tools
                                </Badge>
                              )}
                              {procedure.safetyNotes && (
                                <Badge variant="outline" className="text-xs">
                                  <Shield className="h-3 w-3 mr-1" />
                                  Safety notes
                                </Badge>
                              )}
                              {procedure.qualityChecks.length > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  <CheckSquare className="h-3 w-3 mr-1" />
                                  {procedure.qualityChecks.length} checks
                                </Badge>
                              )}
                              {procedure.imageUrls.length > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  <Image className="h-3 w-3 mr-1" />
                                  {procedure.imageUrls.length} images
                                </Badge>
                              )}
                              {procedure.videoUrl && (
                                <Badge variant="outline" className="text-xs">
                                  <Video className="h-3 w-3 mr-1" />
                                  Video
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(procedure)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(procedure.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {editingProcedure ? 'Edit Procedure' : 'Create Procedure'}
            </DialogTitle>
            <DialogDescription>
              {editingProcedure
                ? 'Update the procedure details below.'
                : 'Enter the details for the new procedure.'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <ScrollArea className="h-[60vh] pr-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="operationId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Operation</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
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
                              placeholder="1"
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
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Set up workpiece" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="instructions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instructions</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Detailed step-by-step instructions..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="estimatedTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estimated Time (minutes)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            placeholder="15"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div>
                    <FormLabel>Required Tools</FormLabel>
                    <div className="space-y-2 mt-2">
                      {(form.watch('requiredTools') || []).map((tool, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            {...form.register(`requiredTools.${index}`)}
                            placeholder="Tool name"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              const currentTools = form.getValues('requiredTools') || [];
                              form.setValue('requiredTools', currentTools.filter((_, i) => i !== index));
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const currentTools = form.getValues('requiredTools') || [];
                          form.setValue('requiredTools', [...currentTools, '']);
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Tool
                      </Button>
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="safetyNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Safety Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Important safety considerations..."
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div>
                    <FormLabel>Quality Checks</FormLabel>
                    <div className="space-y-2 mt-2">
                      {(form.watch('qualityChecks') || []).map((check, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            {...form.register(`qualityChecks.${index}`)}
                            placeholder="Quality check item"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              const currentChecks = form.getValues('qualityChecks') || [];
                              form.setValue('qualityChecks', currentChecks.filter((_, i) => i !== index));
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const currentChecks = form.getValues('qualityChecks') || [];
                          form.setValue('qualityChecks', [...currentChecks, '']);
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Quality Check
                      </Button>
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="videoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Video URL (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://..."
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </ScrollArea>

              <DialogFooter className="mt-4">
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
                  {editingProcedure ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}