import { prisma } from '@/lib/db';
import { WorkCenterScheduleView } from '../components/work-center-schedule-view';
import BasicTopBar from '@/components/layouts/basic-top-bar';
import { BreadcrumbConfig } from '@/components/breadcrumbs';
import { OperationStatus } from '@prisma/client';

export const revalidate = 30; // Revalidate every 30 seconds

export default async function WorkCenterSchedulePage() {
  const breadcrumbs: BreadcrumbConfig[] = [
    { label: 'Production', href: '/production' },
    { label: 'Work Centers', href: '/production/work-centers' },
    { label: 'Schedule', href: '/production/work-centers/schedule' }
  ];

  // Fetch all work centers with their queued operations
  const workCenters = await prisma.workCenter.findMany({
    where: { isActive: true },
    include: {
      workOrderOperations: {
        where: {
          status: {
            notIn: [OperationStatus.COMPLETED, OperationStatus.SKIPPED]
          }
        },
        include: {
          operation: true,
          assignedUser: true,
          workOrderRouting: {
            include: {
              workOrder: {
                include: {
                  part: true
                }
              }
            }
          }
        },
        orderBy: [
          { priority: 'desc' },
          { workOrderRouting: { workOrder: { dueDate: 'asc' } } },
          { sequenceNumber: 'asc' }
        ]
      }
    },
    orderBy: { name: 'asc' }
  });

  // Calculate capacity utilization for each work center
  const workCentersWithMetrics = workCenters.map(wc => {
    const totalPlannedTime = wc.workOrderOperations.reduce((acc, op) => {
      return acc + op.plannedSetupTime + op.plannedRunTime;
    }, 0);
    
    const runningOps = wc.workOrderOperations.filter(
      op => op.status === OperationStatus.RUNNING || op.status === OperationStatus.SETUP
    );
    
    const queuedOps = wc.workOrderOperations.filter(
      op => op.status === OperationStatus.PENDING
    );

    return {
      ...wc,
      metrics: {
        totalOperations: wc.workOrderOperations.length,
        runningOperations: runningOps.length,
        queuedOperations: queuedOps.length,
        totalPlannedHours: Math.round(totalPlannedTime / 60 * 10) / 10,
        utilizationPercent: runningOps.length > 0 ? 100 : 0
      }
    };
  });

  return (
    <div className="flex flex-col h-screen">
      <BasicTopBar breadcrumbs={breadcrumbs} />
      
      <div className="flex-1 p-6 overflow-hidden">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Work Center Schedule</h1>
          <p className="text-muted-foreground">
            View and manage operations across all work centers
          </p>
        </div>

        <WorkCenterScheduleView workCenters={workCentersWithMetrics} />
      </div>
    </div>
  );
}