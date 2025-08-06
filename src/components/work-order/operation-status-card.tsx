'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  Play, 
  Pause, 
  CheckCircle, 
  Settings,
  User,
  AlertCircle,
  SkipForward
} from 'lucide-react';
import { OperationStatus, type Prisma } from '@prisma/client';
import { updateOperationStatus, updateOperationQuantity } from '@/lib/actions/work-order-routing';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type WorkOrderOperationWithRelations = Prisma.WorkOrderOperationGetPayload<{
  include: {
    operation: true;
    workCenter: true;
    assignedUser: true;
    workOrderRouting: {
      include: {
        workOrder: {
          include: {
            part: true;
          };
        };
      };
    };
  };
}>;

interface OperationStatusCardProps {
  operation: WorkOrderOperationWithRelations;
  onUpdate?: () => void;
  compact?: boolean;
}

export function OperationStatusCard({ 
  operation, 
  onUpdate,
  compact = false 
}: OperationStatusCardProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = React.useState(false);
  const [completedQty, setCompletedQty] = React.useState(operation.completedQty);
  const [scrappedQty, setScrappedQty] = React.useState(operation.scrappedQty || 0);
  const [notes, setNotes] = React.useState(operation.notes || '');

  const progress = (operation.completedQty / operation.plannedQty) * 100;
  const isComplete = operation.status === OperationStatus.COMPLETED;
  const isSkipped = operation.status === OperationStatus.SKIPPED;
  const canStart = operation.status === OperationStatus.PENDING;
  const canSetup = operation.status === OperationStatus.PENDING || operation.status === OperationStatus.SETUP;
  const canRun = operation.status === OperationStatus.SETUP || operation.status === OperationStatus.RUNNING;
  const canPause = operation.status === OperationStatus.RUNNING;
  const canComplete = operation.status === OperationStatus.RUNNING && operation.completedQty > 0;

  const handleStatusChange = async (newStatus: OperationStatus) => {
    setIsLoading(true);
    try {
      const result = await updateOperationStatus({
        operationId: operation.id,
        status: newStatus,
        notes
      });

      if (result.success) {
        toast.success(`Operation ${newStatus.toLowerCase()}`);
        onUpdate?.();
      } else {
        toast.error(result.error || 'Failed to update operation status');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuantityUpdate = async () => {
    setIsLoading(true);
    try {
      const result = await updateOperationQuantity({
        operationId: operation.id,
        completedQty,
        scrappedQty
      });

      if (result.success) {
        toast.success('Quantities updated');
        setUpdateDialogOpen(false);
        onUpdate?.();
      } else {
        toast.error(result.error || 'Failed to update quantities');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = () => {
    const statusConfig = {
      [OperationStatus.PENDING]: { label: 'Pending', className: 'bg-gray-100 text-gray-800' },
      [OperationStatus.SETUP]: { label: 'Setup', className: 'bg-yellow-100 text-yellow-800' },
      [OperationStatus.RUNNING]: { label: 'Running', className: 'bg-blue-100 text-blue-800' },
      [OperationStatus.PAUSED]: { label: 'Paused', className: 'bg-orange-100 text-orange-800' },
      [OperationStatus.COMPLETED]: { label: 'Completed', className: 'bg-green-100 text-green-800' },
      [OperationStatus.SKIPPED]: { label: 'Skipped', className: 'bg-gray-100 text-gray-500' }
    };

    const config = statusConfig[operation.status];
    return (
      <Badge className={cn('font-medium', config.className)}>
        {config.label}
      </Badge>
    );
  };

  const formatTime = (minutes: number | null | undefined) => {
    if (!minutes) return '0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (compact) {
    return (
      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
            {operation.sequenceNumber}
          </div>
          <div>
            <p className="font-medium">{operation.operation.name}</p>
            <p className="text-sm text-muted-foreground">
              {operation.workCenter.name} • {formatTime(operation.plannedSetupTime + operation.plannedRunTime)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium">{operation.completedQty}/{operation.plannedQty}</p>
            <Progress value={progress} className="w-20 h-2" />
          </div>
          {getStatusBadge()}
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold">
              {operation.sequenceNumber}
            </div>
            <div>
              <CardTitle className="text-lg">{operation.operation.name}</CardTitle>
              <CardDescription>
                {operation.workCenter.name} • WO: {operation.workOrderRouting.workOrder.workOrderNumber}
              </CardDescription>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Part Information */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Part:</span>
          <span className="font-medium">
            {operation.workOrderRouting.workOrder.part.name} ({operation.workOrderRouting.workOrder.part.partNumber})
          </span>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress:</span>
            <span className="font-medium">{operation.completedQty}/{operation.plannedQty} units</span>
          </div>
          <Progress value={progress} className="h-2" />
          {operation.scrappedQty > 0 && (
            <p className="text-xs text-destructive">
              {operation.scrappedQty} units scrapped
            </p>
          )}
        </div>

        {/* Time Tracking */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground mb-1">Setup Time:</p>
            <p className="font-medium">
              {operation.actualSetupTime ? (
                <span className={cn(
                  operation.actualSetupTime > operation.plannedSetupTime && 'text-orange-600'
                )}>
                  {formatTime(operation.actualSetupTime)} / {formatTime(operation.plannedSetupTime)}
                </span>
              ) : (
                formatTime(operation.plannedSetupTime)
              )}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Run Time:</p>
            <p className="font-medium">
              {operation.actualRunTime ? (
                <span className={cn(
                  operation.actualRunTime > operation.plannedRunTime && 'text-orange-600'
                )}>
                  {formatTime(operation.actualRunTime)} / {formatTime(operation.plannedRunTime)}
                </span>
              ) : (
                formatTime(operation.plannedRunTime)
              )}
            </p>
          </div>
        </div>

        {/* Assigned User */}
        {operation.assignedUser && (
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Assigned to:</span>
            <span className="font-medium">{operation.assignedUser.name}</span>
          </div>
        )}

        {/* Notes */}
        {operation.notes && (
          <div className="p-3 bg-muted/50 rounded-md">
            <p className="text-sm">{operation.notes}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {canSetup && operation.status === OperationStatus.PENDING && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusChange(OperationStatus.SETUP)}
                    disabled={isLoading}
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Start Setup
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Begin machine setup for this operation</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {operation.status === OperationStatus.SETUP && (
            <Button
              size="sm"
              variant="default"
              onClick={() => handleStatusChange(OperationStatus.RUNNING)}
              disabled={isLoading}
            >
              <Play className="h-4 w-4 mr-1" />
              Start Production
            </Button>
          )}

          {canPause && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatusChange(OperationStatus.PAUSED)}
              disabled={isLoading}
            >
              <Pause className="h-4 w-4 mr-1" />
              Pause
            </Button>
          )}

          {operation.status === OperationStatus.PAUSED && (
            <Button
              size="sm"
              variant="default"
              onClick={() => handleStatusChange(OperationStatus.RUNNING)}
              disabled={isLoading}
            >
              <Play className="h-4 w-4 mr-1" />
              Resume
            </Button>
          )}

          {(operation.status === OperationStatus.RUNNING || operation.status === OperationStatus.PAUSED) && (
            <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  Update Quantity
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Update Operation Quantities</DialogTitle>
                  <DialogDescription>
                    Record completed and scrapped quantities for this operation
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="completed">Completed Quantity</Label>
                    <Input
                      id="completed"
                      type="number"
                      value={completedQty}
                      onChange={(e) => setCompletedQty(parseInt(e.target.value) || 0)}
                      max={operation.plannedQty}
                      min={0}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scrapped">Scrapped Quantity</Label>
                    <Input
                      id="scrapped"
                      type="number"
                      value={scrappedQty}
                      onChange={(e) => setScrappedQty(parseInt(e.target.value) || 0)}
                      min={0}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (optional)</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add any notes about this update..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setUpdateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleQuantityUpdate}
                    disabled={isLoading}
                  >
                    Update
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {canComplete && (
            <Button
              size="sm"
              variant="default"
              onClick={() => handleStatusChange(OperationStatus.COMPLETED)}
              disabled={isLoading || operation.completedQty === 0}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Complete
            </Button>
          )}

          {operation.status === OperationStatus.PENDING && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleStatusChange(OperationStatus.SKIPPED)}
              disabled={isLoading}
            >
              <SkipForward className="h-4 w-4 mr-1" />
              Skip
            </Button>
          )}
        </div>

        {/* Timestamps */}
        {(operation.startedAt || operation.completedAt) && (
          <div className="pt-2 border-t text-xs text-muted-foreground space-y-1">
            {operation.startedAt && (
              <p>Started: {new Date(operation.startedAt).toLocaleString()}</p>
            )}
            {operation.setupCompletedAt && (
              <p>Setup completed: {new Date(operation.setupCompletedAt).toLocaleString()}</p>
            )}
            {operation.completedAt && (
              <p>Completed: {new Date(operation.completedAt).toLocaleString()}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}