'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Package,
  User,
  Wrench,
  RefreshCw,
  Play,
  AlertTriangle,
  WifiOff,
  Wifi
} from 'lucide-react';
import { type Prisma } from '@prisma/client';
import { BlockedReason, OperationStatus } from '@prisma/client';
import { getReadyOperationsForWorkCenter, updateWorkCenterQueue } from '../actions/operation-readiness';
import { updateOperationStatus } from '@/app/(dashboard)/production/work-orders/actions';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useWorkCenterQueue } from '@/hooks/use-work-center-queue';

type WorkCenterQueueEntry = Prisma.WorkCenterQueueGetPayload<{
  include: {
    operation: {
      include: {
        operation: true;
        workOrderRouting: {
          include: {
            workOrder: {
              include: {
                part: true;
              };
            };
          };
        };
        assignedUser: true;
        readiness: true;
      };
    };
  };
}>;

interface WorkCenterQueueProps {
  workCenterId: string;
  workCenterName: string;
  queueEntries?: WorkCenterQueueEntry[];
}

const BlockedReasonIcon: React.FC<{ reason: BlockedReason }> = ({ reason }) => {
  switch (reason) {
    case BlockedReason.WAITING_PREDECESSOR:
      return <AlertCircle className="h-4 w-4 text-orange-500" />;
    case BlockedReason.MATERIAL_UNAVAILABLE:
      return <Package className="h-4 w-4 text-red-500" />;
    case BlockedReason.WORK_CENTER_BUSY:
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case BlockedReason.OPERATOR_UNAVAILABLE:
      return <User className="h-4 w-4 text-purple-500" />;
    case BlockedReason.TOOL_UNAVAILABLE:
      return <Wrench className="h-4 w-4 text-gray-500" />;
    case BlockedReason.SETUP_REQUIRED:
      return <Wrench className="h-4 w-4 text-blue-500" />;
    default:
      return <AlertTriangle className="h-4 w-4 text-gray-500" />;
  }
};

const BlockedReasonLabel: Record<BlockedReason, string> = {
  [BlockedReason.WAITING_PREDECESSOR]: 'Waiting for dependencies',
  [BlockedReason.MATERIAL_UNAVAILABLE]: 'Materials not available',
  [BlockedReason.WORK_CENTER_BUSY]: 'Work center busy',
  [BlockedReason.OPERATOR_UNAVAILABLE]: 'No operator assigned',
  [BlockedReason.TOOL_UNAVAILABLE]: 'Tooling unavailable',
  [BlockedReason.QUALITY_HOLD]: 'Quality hold',
  [BlockedReason.SETUP_REQUIRED]: 'Setup required'
};

export function WorkCenterQueue({ 
  workCenterId, 
  workCenterName,
  queueEntries: initialQueueEntries = [] 
}: WorkCenterQueueProps) {
  const [loading, setLoading] = React.useState(false);
  const [readyOperations, setReadyOperations] = React.useState<any[]>([]);
  const [blockedOperations, setBlockedOperations] = React.useState<any[]>([]);
  const [useRealtime, setUseRealtime] = React.useState(true);
  const router = useRouter();
  
  // Use real-time queue updates
  const { queueData, isConnected, error: sseError } = useWorkCenterQueue(workCenterId);

  const loadQueueData = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await getReadyOperationsForWorkCenter(workCenterId);
      if (result.success && result.data) {
        // Separate ready and blocked operations
        const ready = result.data.filter(op => op.readiness?.isReady === true);
        const blocked = result.data.filter(op => op.readiness?.isReady === false);
        
        setReadyOperations(ready);
        setBlockedOperations(blocked);
      }
    } catch (error) {
      console.error('Error loading queue data:', error);
      toast.error('Failed to load queue data');
    } finally {
      setLoading(false);
    }
  }, [workCenterId]);

  React.useEffect(() => {
    if (useRealtime && queueData?.queueEntries) {
      // Process real-time data
      const ready = queueData.queueEntries.filter(
        (entry: any) => entry.operation.readiness?.isReady === true
      ).map((entry: any) => entry.operation);
      
      const blocked = queueData.queueEntries.filter(
        (entry: any) => entry.operation.readiness?.isReady === false
      ).map((entry: any) => entry.operation);
      
      setReadyOperations(ready);
      setBlockedOperations(blocked);
    } else {
      // Fall back to manual loading
      loadQueueData();
    }
  }, [queueData, useRealtime, loadQueueData]);

  const handleRefreshQueue = async () => {
    setLoading(true);
    try {
      const result = await updateWorkCenterQueue(workCenterId);
      if (result.success) {
        toast.success('Queue updated successfully');
        await loadQueueData();
      } else {
        toast.error(result.error || 'Failed to update queue');
      }
    } catch (error) {
      console.error('Error refreshing queue:', error);
      toast.error('Failed to refresh queue');
    } finally {
      setLoading(false);
    }
  };

  const handleStartOperation = async (operationId: string) => {
    try {
      const result = await updateOperationStatus(operationId, OperationStatus.SETUP);
      if (result.success) {
        toast.success('Operation started');
        router.push(`/production/work-orders/${result.data?.workOrderRouting?.workOrderId}`);
      } else {
        toast.error(result.error || 'Failed to start operation');
      }
    } catch (error) {
      console.error('Error starting operation:', error);
      toast.error('Failed to start operation');
    }
  };

  const formatDuration = (minutes?: number | null) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const OperationCard: React.FC<{ operation: any; isReady: boolean }> = ({ operation, isReady }) => {
    const workOrder = operation.workOrderRouting?.workOrder;
    const part = workOrder?.part;
    
    return (
      <Card className={`mb-3 ${isReady ? 'border-green-500' : 'border-gray-300'}`}>
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">{operation.operation?.name}</span>
                {isReady ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                WO: {workOrder?.workOrderNumber} | {part?.partNumber} - {part?.name}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              {operation.priority > 0 && (
                <Badge variant="destructive">Priority: {operation.priority}</Badge>
              )}
              <Badge variant="outline">
                <Clock className="h-3 w-3 mr-1" />
                {formatDuration(operation.estimatedDuration)}
              </Badge>
            </div>
          </div>

          {/* Blocked reasons */}
          {!isReady && operation.readiness?.blockedReasons && (
            <div className="mt-3 space-y-1">
              {operation.readiness.blockedReasons.map((reason: BlockedReason, idx: number) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <BlockedReasonIcon reason={reason} />
                  <span className="text-muted-foreground">
                    {BlockedReasonLabel[reason]}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Assigned user */}
          {operation.assignedUser && (
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-3 w-3" />
              <span>Assigned to: {operation.assignedUser.name}</span>
            </div>
          )}

          {/* Actions */}
          {isReady && (
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                onClick={() => handleStartOperation(operation.id)}
                disabled={loading}
              >
                <Play className="h-3 w-3 mr-1" />
                Start Operation
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push(`/production/work-orders/${workOrder?.id}`)}
              >
                View Details
              </Button>
            </div>
          )}

          {/* Estimated wait time */}
          {operation.readiness?.estimatedWaitTime && (
            <div className="mt-2 text-sm text-muted-foreground">
              Estimated wait: {formatDuration(operation.readiness.estimatedWaitTime)}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle className="text-xl">
            {workCenterName} Queue
          </CardTitle>
          {useRealtime && (
            <Badge variant={isConnected ? 'default' : 'secondary'} className="gap-1">
              {isConnected ? (
                <><Wifi className="h-3 w-3" /> Live</>
              ) : (
                <><WifiOff className="h-3 w-3" /> Offline</>
              )}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setUseRealtime(!useRealtime)}
          >
            {useRealtime ? 'Disable' : 'Enable'} Live Updates
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefreshQueue}
            disabled={loading || (useRealtime && isConnected)}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden">
        <Tabs defaultValue="ready" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ready" className="flex items-center gap-2">
              Ready
              <Badge variant="secondary" className="ml-1">
                {readyOperations.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="blocked" className="flex items-center gap-2">
              Blocked
              <Badge variant="secondary" className="ml-1">
                {blockedOperations.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden mt-4">
            <TabsContent value="ready" className="h-full">
              <ScrollArea className="h-full">
                {readyOperations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No operations ready for this work center
                  </div>
                ) : (
                  <div className="pr-4">
                    {readyOperations.map((operation, index) => (
                      <div key={operation.id}>
                        <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                          <Badge variant="outline">#{index + 1}</Badge>
                          <span>in queue</span>
                        </div>
                        <OperationCard operation={operation} isReady={true} />
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="blocked" className="h-full">
              <ScrollArea className="h-full">
                {blockedOperations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No blocked operations for this work center
                  </div>
                ) : (
                  <div className="pr-4">
                    {blockedOperations.map((operation) => (
                      <OperationCard 
                        key={operation.id} 
                        operation={operation} 
                        isReady={false} 
                      />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}