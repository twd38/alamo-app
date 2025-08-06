'use client';

import React from 'react';
import { OperationStatusCard } from './operation-status-card';
import { type Prisma } from '@prisma/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { OperationStatus } from '@prisma/client';

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

interface OperationsListProps {
  operations: WorkOrderOperationWithRelations[];
  onUpdate?: () => void;
  view?: 'list' | 'kanban';
}

export function OperationsList({ 
  operations, 
  onUpdate,
  view = 'list' 
}: OperationsListProps) {
  const [selectedTab, setSelectedTab] = React.useState('all');

  // Group operations by status
  const operationsByStatus = React.useMemo(() => {
    const groups: Record<string, WorkOrderOperationWithRelations[]> = {
      all: operations,
      pending: [],
      'in-progress': [],
      completed: []
    };

    operations.forEach(op => {
      if (op.status === OperationStatus.PENDING) {
        groups.pending.push(op);
      } else if (
        op.status === OperationStatus.SETUP || 
        op.status === OperationStatus.RUNNING || 
        op.status === OperationStatus.PAUSED
      ) {
        groups['in-progress'].push(op);
      } else if (
        op.status === OperationStatus.COMPLETED || 
        op.status === OperationStatus.SKIPPED
      ) {
        groups.completed.push(op);
      }
    });

    return groups;
  }, [operations]);

  const getTabBadgeCount = (status: string) => {
    const count = operationsByStatus[status]?.length || 0;
    if (count === 0) return null;
    
    return (
      <Badge variant="secondary" className="ml-2 h-5 px-1.5">
        {count}
      </Badge>
    );
  };

  if (view === 'kanban') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
        {/* Pending Column */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between p-3 border-b bg-gray-50 dark:bg-gray-800">
            <h3 className="font-medium">Pending</h3>
            <Badge variant="secondary">{operationsByStatus.pending.length}</Badge>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-3">
              {operationsByStatus.pending.map(operation => (
                <OperationStatusCard
                  key={operation.id}
                  operation={operation}
                  onUpdate={onUpdate}
                  compact
                />
              ))}
              {operationsByStatus.pending.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No pending operations
                </p>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* In Progress Column */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between p-3 border-b bg-blue-50 dark:bg-blue-900/20">
            <h3 className="font-medium">In Progress</h3>
            <Badge variant="secondary">{operationsByStatus['in-progress'].length}</Badge>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-3">
              {operationsByStatus['in-progress'].map(operation => (
                <OperationStatusCard
                  key={operation.id}
                  operation={operation}
                  onUpdate={onUpdate}
                  compact
                />
              ))}
              {operationsByStatus['in-progress'].length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No operations in progress
                </p>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Completed Column */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between p-3 border-b bg-green-50 dark:bg-green-900/20">
            <h3 className="font-medium">Completed</h3>
            <Badge variant="secondary">{operationsByStatus.completed.length}</Badge>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-3">
              {operationsByStatus.completed.map(operation => (
                <OperationStatusCard
                  key={operation.id}
                  operation={operation}
                  onUpdate={onUpdate}
                  compact
                />
              ))}
              {operationsByStatus.completed.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No completed operations
                </p>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    );
  }

  return (
    <Tabs value={selectedTab} onValueChange={setSelectedTab} className="h-full flex flex-col">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="all" className="flex items-center">
          All{getTabBadgeCount('all')}
        </TabsTrigger>
        <TabsTrigger value="pending" className="flex items-center">
          Pending{getTabBadgeCount('pending')}
        </TabsTrigger>
        <TabsTrigger value="in-progress" className="flex items-center">
          In Progress{getTabBadgeCount('in-progress')}
        </TabsTrigger>
        <TabsTrigger value="completed" className="flex items-center">
          Completed{getTabBadgeCount('completed')}
        </TabsTrigger>
      </TabsList>

      <div className="flex-1 overflow-hidden">
        {Object.entries(operationsByStatus).map(([status, ops]) => (
          <TabsContent 
            key={status} 
            value={status} 
            className="h-full mt-4"
          >
            <ScrollArea className="h-full">
              <div className="space-y-4 pr-4">
                {ops.map(operation => (
                  <OperationStatusCard
                    key={operation.id}
                    operation={operation}
                    onUpdate={onUpdate}
                  />
                ))}
                {ops.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">
                      No {status === 'all' ? '' : status} operations
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
}