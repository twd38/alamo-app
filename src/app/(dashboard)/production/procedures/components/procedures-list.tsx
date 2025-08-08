'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Loader2,
  FileText,
  Edit,
  Trash2,
  ChevronRight
} from 'lucide-react';
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
import {
  getProcedures,
  createProcedure,
  updateProcedure,
  deleteProcedure,
  getOperationsForSelect,
  GetProceduresParams
} from '../actions/procedures';
import { Prisma } from '@prisma/client';

type ProcedureWithOperationsAndSteps = Prisma.ProcedureGetPayload<{
  include: {
    operations: {
      include: {
        workCenter: true;
      };
    };
    steps: {
      include: {
        actions: true;
        files: true;
      };
    };
  };
}>;

const procedureSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional()
});

type ProcedureFormData = z.infer<typeof procedureSchema>;

export function ProceduresList() {
  const router = useRouter();
  const [procedures, setProcedures] = useState<ProcedureWithOperationsAndSteps[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProcedure, setEditingProcedure] = useState<ProcedureWithOperationsAndSteps | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ProcedureFormData>({
    resolver: zodResolver(procedureSchema),
    defaultValues: {
      code: '',
      title: '',
      description: ''
    }
  });

  const fetchProcedures = useCallback(async () => {
    try {
      const params: GetProceduresParams = {};
      const result = await getProcedures(params);
      setProcedures(result.data);
    } catch (error) {
      toast.error('Failed to load procedures');
      console.error('Error fetching procedures:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProcedures();
  }, [fetchProcedures]);

  const onSubmit = async (data: ProcedureFormData) => {
    setSubmitting(true);
    try {
      if (editingProcedure) {
        await updateProcedure(editingProcedure.id, data);
        toast.success('Procedure updated successfully');
      } else {
        await createProcedure({ ...data, status: 'DRAFT' });
        toast.success('Procedure created successfully');
      }

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

  const handleEdit = (procedure: ProcedureWithOperationsAndSteps) => {
    setEditingProcedure(procedure);
    form.reset({
      code: procedure.code || '',
      title: procedure.title,
      description: procedure.description || ''
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
    form.reset({
      code: '',
      title: '',
      description: ''
    });
    setDialogOpen(true);
  };

  const handleOpenProcedure = (procedureId: string) => {
    router.push(`/production/procedures/${procedureId}`);
  };

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
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : procedures.length === 0 ? (
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
          <div className="grid gap-4">
            {procedures.map((procedure) => (
              <Card 
                key={procedure.id}
                className="hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => handleOpenProcedure(procedure.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {procedure.code && (
                          <Badge variant="outline" className="font-mono">
                            {procedure.code}
                          </Badge>
                        )}
                        <h3 className="font-semibold text-lg">{procedure.title}</h3>
                        <Badge variant={procedure.status === 'DRAFT' ? 'secondary' : procedure.status === 'APPROVED' ? 'default' : 'outline'}>
                          {procedure.status}
                        </Badge>
                        <Badge variant="outline">
                          v{procedure.version}
                        </Badge>
                      </div>
                      
                      {procedure.description && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {procedure.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-6 text-sm text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          {procedure.steps?.length || 0} steps
                        </span>
                        {procedure.steps && procedure.steps.length > 0 && (
                          <span>
                            {procedure.steps.reduce((acc, step) => acc + step.estimatedTime, 0)} min total
                          </span>
                        )}
                      </div>

                      {procedure.operations && procedure.operations.length > 0 && (
                        <div className="border-t pt-3">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Used by operations:</p>
                          <div className="flex flex-wrap gap-2">
                            {procedure.operations.map((op) => (
                              <Badge key={op.id} variant="secondary" className="text-xs">
                                {op.name} ({op.code})
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(procedure);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(procedure.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Procedure Code</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., PROC-001" 
                        {...field} 
                        disabled={!!editingProcedure}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Assembly Procedure" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief description of the procedure..."
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
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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