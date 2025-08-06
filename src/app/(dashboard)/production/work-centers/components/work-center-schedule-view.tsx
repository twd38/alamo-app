'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { 
  Factory, 
  Clock, 
  PlayCircle, 
  PauseCircle,
  AlertCircle,
  ChevronRight,
  Users,
  Package,
  Timer
} from 'lucide-react';
import { type Prisma, OperationStatus } from '@prisma/client';
import { cn } from '@/lib/utils';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type WorkCenterWithOperations = Prisma.WorkCenterGetPayload<{
  include: {
    workOrderOperations: {
      include: {
        operation: true;
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
    };
  };
}> & {
  metrics: {
    totalOperations: number;
    runningOperations: number;
    queuedOperations: number;
    totalPlannedHours: number;
    utilizationPercent: number;
  };
};

interface WorkCenterScheduleViewProps {
  workCenters: WorkCenterWithOperations[];
}

// Sortable Operation Card Component
function SortableOperationCard({ 
  operation,
  workCenterId 
}: { 
  operation: WorkCenterWithOperations['workOrderOperations'][0];
  workCenterId: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: operation.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getStatusIcon = () => {
    switch (operation.status) {
      case OperationStatus.SETUP:
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case OperationStatus.RUNNING:
        return <PlayCircle className="h-4 w-4 text-blue-600" />;
      case OperationStatus.PAUSED:
        return <PauseCircle className="h-4 w-4 text-orange-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "p-3 border rounded-lg bg-white dark:bg-gray-800 cursor-move hover:shadow-md transition-all",
        operation.status === OperationStatus.RUNNING && "border-blue-500",
        operation.status === OperationStatus.SETUP && "border-yellow-500"
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="font-medium text-sm">
            WO-{operation.workOrderRouting.workOrder.workOrderNumber}
          </span>
        </div>
        {operation.priority > 0 && (
          <Badge variant="destructive" className="text-xs">
            Priority
          </Badge>
        )}
      </div>
      
      <p className="text-sm font-medium mb-1">{operation.operation.name}</p>
      <p className="text-xs text-muted-foreground mb-2">
        {operation.workOrderRouting.workOrder.part.name} • 
        Qty: {operation.plannedQty}
      </p>
      
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {formatTime(operation.plannedSetupTime + operation.plannedRunTime)}
        </span>
        {operation.assignedUser && (
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>{operation.assignedUser.name.split(' ')[0]}</span>
          </div>
        )}
      </div>

      {operation.workOrderRouting.workOrder.dueDate && (
        <div className="mt-2 pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            Due: {new Date(operation.workOrderRouting.workOrder.dueDate).toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  );
}

// Work Center Card Component
function WorkCenterCard({ workCenter }: { workCenter: WorkCenterWithOperations }) {
  const [operations, setOperations] = React.useState(workCenter.workOrderOperations);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setOperations((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over?.id);
        return arrayMove(items, oldIndex, newIndex);
      });
      // Here you would call an API to update the priority/sequence
    }
  };

  const getUtilizationColor = (percent: number) => {
    if (percent === 0) return 'bg-gray-200';
    if (percent < 50) return 'bg-green-500';
    if (percent < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Factory className="h-5 w-5" />
              {workCenter.name}
            </CardTitle>
            <CardDescription className="mt-1">
              {workCenter.code} • {workCenter.type}
            </CardDescription>
          </div>
          <Badge variant="outline" className="ml-2">
            {workCenter.metrics.totalOperations} ops
          </Badge>
        </div>
        
        {/* Metrics */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="text-center">
            <p className="text-2xl font-bold">{workCenter.metrics.runningOperations}</p>
            <p className="text-xs text-muted-foreground">Running</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{workCenter.metrics.queuedOperations}</p>
            <p className="text-xs text-muted-foreground">Queued</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{workCenter.metrics.totalPlannedHours}h</p>
            <p className="text-xs text-muted-foreground">Planned</p>
          </div>
        </div>
        
        {/* Utilization Bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Utilization</span>
            <span className="text-xs font-medium">{workCenter.metrics.utilizationPercent}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={cn("h-2 rounded-full transition-all", getUtilizationColor(workCenter.metrics.utilizationPercent))}
              style={{ width: `${workCenter.metrics.utilizationPercent}%` }}
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden pb-3">
        <ScrollArea className="h-full pr-3">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={operations.map(op => op.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {operations.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No operations scheduled</p>
                  </div>
                ) : (
                  operations.map((operation) => (
                    <SortableOperationCard
                      key={operation.id}
                      operation={operation}
                      workCenterId={workCenter.id}
                    />
                  ))
                )}
              </div>
            </SortableContext>
          </DndContext>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export function WorkCenterScheduleView({ workCenters }: WorkCenterScheduleViewProps) {
  const [view, setView] = React.useState<'grid' | 'list'>('grid');
  
  // Summary metrics
  const totalOperations = workCenters.reduce((acc, wc) => acc + wc.metrics.totalOperations, 0);
  const totalRunning = workCenters.reduce((acc, wc) => acc + wc.metrics.runningOperations, 0);
  const totalQueued = workCenters.reduce((acc, wc) => acc + wc.metrics.queuedOperations, 0);
  const totalPlannedHours = workCenters.reduce((acc, wc) => acc + wc.metrics.totalPlannedHours, 0);

  return (
    <div className="h-full flex flex-col">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Operations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalOperations}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Currently Running</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{totalRunning}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Queued</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">{totalQueued}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Planned Time</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalPlannedHours.toFixed(1)}h</p>
          </CardContent>
        </Card>
      </div>

      {/* View Toggle */}
      <div className="flex justify-end mb-4">
        <Tabs value={view} onValueChange={(v) => setView(v as 'grid' | 'list')}>
          <TabsList>
            <TabsTrigger value="grid">Grid View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Work Centers Grid/List */}
      <div className="flex-1 overflow-hidden">
        {view === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 h-full">
            {workCenters.map((workCenter) => (
              <WorkCenterCard key={workCenter.id} workCenter={workCenter} />
            ))}
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="space-y-4">
              {workCenters.map((workCenter) => (
                <Card key={workCenter.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Factory className="h-5 w-5" />
                        <div>
                          <CardTitle>{workCenter.name}</CardTitle>
                          <CardDescription>
                            {workCenter.code} • {workCenter.type} • 
                            {workCenter.metrics.totalOperations} operations
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {workCenter.metrics.runningOperations} running
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {workCenter.metrics.queuedOperations} queued
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}