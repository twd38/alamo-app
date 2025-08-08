'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Loader2, 
  Plus, 
  Edit, 
  Trash2, 
  Link, 
  Unlink,
  FileText,
  Settings
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  getOperationsForSelect,
  assignProcedureToOperation,
  getProceduresForSelect
} from '../../procedures/actions/procedures';

interface Operation {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  defaultDuration?: number;
  setupTime?: number;
  requiresSkill?: string | null;
  isActive?: boolean;
  procedureId?: string | null;
  workCenter: {
    id: string;
    name: string;
  };
  procedure?: {
    id: string;
    code?: string | null;
    title: string;
  } | null;
}

interface Procedure {
  id: string;
  code?: string | null;
  title: string;
  description?: string | null;
  operations?: {
    id: string;
    code: string;
    name: string;
  }[];
}

export function OperationsList() {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<Operation | null>(null);
  const [selectedProcedureId, setSelectedProcedureId] = useState<string>('none');
  const [submitting, setSubmitting] = useState(false);

  const fetchOperations = useCallback(async () => {
    try {
      const ops = await getOperationsForSelect();
      setOperations(ops);
    } catch (error) {
      toast.error('Failed to load operations');
      console.error('Error fetching operations:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProcedures = useCallback(async () => {
    try {
      const procs = await getProceduresForSelect();
      setProcedures(procs);
    } catch (error) {
      console.error('Error fetching procedures:', error);
    }
  }, []);

  useEffect(() => {
    fetchOperations();
    fetchProcedures();
  }, [fetchOperations, fetchProcedures]);

  const handleOpenAssignDialog = (operation: Operation) => {
    setSelectedOperation(operation);
    setSelectedProcedureId(operation.procedureId || 'none');
    setAssignDialogOpen(true);
  };

  const handleAssignProcedure = async () => {
    if (!selectedOperation) return;

    setSubmitting(true);
    try {
      await assignProcedureToOperation(
        selectedOperation.id,
        selectedProcedureId === 'none' ? null : selectedProcedureId
      );
      toast.success(
        selectedProcedureId !== 'none'
          ? 'Procedure assigned successfully' 
          : 'Procedure unassigned successfully'
      );
      setAssignDialogOpen(false);
      fetchOperations();
    } catch (error) {
      toast.error('Failed to assign procedure');
      console.error('Error assigning procedure:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Group operations by work center
  const operationsByWorkCenter = operations.reduce((acc, operation) => {
    const wcId = operation.workCenter.id;
    if (!acc[wcId]) {
      acc[wcId] = {
        workCenter: operation.workCenter,
        operations: []
      };
    }
    acc[wcId].operations.push(operation);
    return acc;
  }, {} as Record<string, { workCenter: any; operations: Operation[] }>);

  return (
    <div className="h-full flex-1 flex-col space-y-4 md:flex">
      <div className="flex items-center justify-between space-y-1">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Operations</h2>
          <p className="text-muted-foreground">
            Manage operations and assign procedures
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : operations.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64">
              <Settings className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No operations found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {Object.entries(operationsByWorkCenter).map(([wcId, { workCenter, operations }]) => (
              <Card key={wcId}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{workCenter.name}</span>
                    <span className="text-sm font-normal text-muted-foreground">
                      {operations.length} operation{operations.length !== 1 ? 's' : ''}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {operations.map((operation) => (
                      <div
                        key={operation.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="font-mono">
                              {operation.code}
                            </Badge>
                            <span className="font-medium">{operation.name}</span>
                          </div>
                          {operation.description && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {operation.description}
                            </p>
                          )}
                          {operation.procedure ? (
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                Procedure: 
                                <Badge variant="secondary" className="ml-2">
                                  {operation.procedure.code || operation.procedure.title}
                                </Badge>
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Unlink className="h-4 w-4" />
                              <span className="text-sm">No procedure assigned</span>
                            </div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenAssignDialog(operation)}
                        >
                          {operation.procedure ? (
                            <span className="flex items-center">
                              <Edit className="h-4 w-4 mr-2" />
                              Change
                            </span>
                          ) : (
                            <span className="flex items-center">
                              <Link className="h-4 w-4 mr-2" />
                              Assign
                            </span>
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Procedure to Operation</DialogTitle>
            <DialogDescription>
              Select a procedure to assign to {selectedOperation?.name} ({selectedOperation?.code})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Procedure</label>
              <Select
                value={selectedProcedureId}
                onValueChange={setSelectedProcedureId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a procedure (or leave empty to unassign)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Unassign)</SelectItem>
                  {procedures.map((proc) => (
                    <SelectItem key={proc.id} value={proc.id}>
                      {proc.code ? `${proc.code} - ` : ''}{proc.title}
                      {proc.operations && proc.operations.length > 0 && 
                        ` (used by ${proc.operations.length} operation${proc.operations.length !== 1 ? 's' : ''})`
                      }
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedProcedureId && selectedProcedureId !== 'none' && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {procedures.find(p => p.id === selectedProcedureId)?.description || 'No description available'}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAssignDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleAssignProcedure} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {selectedProcedureId !== 'none' ? 'Assign' : 'Unassign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}