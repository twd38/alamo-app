import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { WorkCenterQueue } from '../components/work-center-queue';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, Clock, Package, TrendingUp, Users, Wrench } from 'lucide-react';
import { OperationStatus } from '@prisma/client';

interface WorkCenterPageProps {
  params: Promise<{
    workCenterId: string;
  }>;
}

export default async function WorkCenterPage({ params }: WorkCenterPageProps) {
  const { workCenterId } = await params;
  
  const workCenter = await prisma.workCenter.findUnique({
    where: { id: workCenterId },
    include: {
      operations: {
        where: { isActive: true }
      },
      workOrderOperations: {
        where: {
          status: {
            in: [OperationStatus.SETUP, OperationStatus.RUNNING, OperationStatus.PAUSED]
          }
        },
        include: {
          workOrderRouting: {
            include: {
              workOrder: {
                include: {
                  part: true
                }
              }
            }
          },
          assignedUser: true
        }
      },
      queueEntries: {
        include: {
          operation: {
            include: {
              operation: true,
              workOrderRouting: {
                include: {
                  workOrder: {
                    include: {
                      part: true
                    }
                  }
                }
              },
              assignedUser: true,
              readiness: true
            }
          }
        },
        orderBy: { queuePosition: 'asc' }
      }
    }
  });

  if (!workCenter) {
    notFound();
  }

  // Calculate statistics
  const activeOperations = workCenter.workOrderOperations.filter(
    op => op.status === OperationStatus.RUNNING
  );
  const setupOperations = workCenter.workOrderOperations.filter(
    op => op.status === OperationStatus.SETUP
  );
  const pausedOperations = workCenter.workOrderOperations.filter(
    op => op.status === OperationStatus.PAUSED
  );

  const queuedCount = workCenter.queueEntries.length;
  const totalWaitTime = workCenter.queueEntries.reduce(
    (sum, entry) => sum + (entry.estimatedWaitTime || 0),
    0
  );

  // Get completed operations today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const completedToday = await prisma.workOrderOperation.count({
    where: {
      workCenterId,
      status: OperationStatus.COMPLETED,
      completedAt: {
        gte: today
      }
    }
  });

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/production">Production</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/production/work-centers">Work Centers</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{workCenter.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{workCenter.name}</h1>
          <p className="text-muted-foreground mt-1">
            {workCenter.code} • {workCenter.type.replace('_', ' ')}
          </p>
        </div>
        <Badge variant={workCenter.isActive ? 'default' : 'secondary'}>
          {workCenter.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Operations</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeOperations.length}</div>
            <p className="text-xs text-muted-foreground">
              {setupOperations.length} in setup, {pausedOperations.length} paused
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Queue Length</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{queuedCount}</div>
            <p className="text-xs text-muted-foreground">
              ~{formatDuration(totalWaitTime)} total wait
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efficiency</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(workCenter.efficiency * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {workCenter.capacity} units/hour capacity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedToday}</div>
            <p className="text-xs text-muted-foreground">
              ${workCenter.costPerHour}/hour
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="queue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="queue">Operation Queue</TabsTrigger>
          <TabsTrigger value="active">Active Operations</TabsTrigger>
          <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="space-y-4">
          <WorkCenterQueue
            workCenterId={workCenter.id}
            workCenterName={workCenter.name}
            queueEntries={workCenter.queueEntries}
          />
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Currently Running Operations</CardTitle>
              <CardDescription>
                Operations currently being executed at this work center
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeOperations.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No operations currently running
                </p>
              ) : (
                <div className="space-y-4">
                  {activeOperations.map((operation) => {
                    const workOrder = operation.workOrderRouting?.workOrder;
                    const part = workOrder?.part;
                    
                    return (
                      <Card key={operation.id}>
                        <CardContent className="flex items-center justify-between p-4">
                          <div>
                            <div className="font-medium">
                              WO: {workOrder?.workOrderNumber}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {part?.partNumber} - {part?.name}
                            </div>
                            {operation.assignedUser && (
                              <div className="text-sm text-muted-foreground mt-1">
                                Operator: {operation.assignedUser.name}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="default">
                              {operation.status}
                            </Badge>
                            {operation.startedAt && (
                              <Badge variant="outline">
                                <Clock className="h-3 w-3 mr-1" />
                                {Math.round(
                                  (Date.now() - new Date(operation.startedAt).getTime()) / 60000
                                )} min elapsed
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="capabilities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Work Center Capabilities</CardTitle>
              <CardDescription>
                Operations that can be performed at this work center
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Setup Time</h4>
                  <p className="text-muted-foreground">
                    {formatDuration(workCenter.setupTime)}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Operations</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {workCenter.operations.map((operation) => (
                      <div
                        key={operation.id}
                        className="flex items-center justify-between p-2 border rounded"
                      >
                        <span className="text-sm">{operation.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {operation.code}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  {workCenter.operations.length === 0 && (
                    <p className="text-muted-foreground text-sm">
                      No operations configured for this work center
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>
                Historical performance and utilization data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Performance metrics coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}