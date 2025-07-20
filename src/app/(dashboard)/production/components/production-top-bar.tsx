'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlayIcon, PauseIcon, ChevronLeft } from 'lucide-react';
import { Timer } from './timer';
import { getWorkOrder } from '../queries';
import { WorkOrderStatus } from '@prisma/client';
import { cn } from '@/lib/utils';
import { ClockInModal } from './clock-in-modal';
import { ProductionStatusBadge } from './production-status-badge';
import {
  startWorkOrderProduction,
  pauseWorkOrderProduction
} from '@/lib/actions';
import { useRouter } from 'next/navigation';
type WorkOrder = Awaited<ReturnType<typeof getWorkOrder>>;

interface WorkOrderExecutionProps {
  workOrder: WorkOrder;
}

export function ProductionTopBar({ workOrder }: WorkOrderExecutionProps) {
  // All hooks must be called before any conditional logic
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(
    workOrder?.status === 'IN_PROGRESS'
  );
  const [isLoading, setIsLoading] = useState(false);

  // Early return after all hooks are called
  if (!workOrder) return null;

  const elapsedTimeSoFar = () => {
    // if the work order is not in progress, return the time taken
    if (workOrder.status !== 'IN_PROGRESS') return workOrder.timeTaken || 0;

    // if the work order is in progress, base time taken on the work order from .timeTaken + the difference between the current time and the most recent time entry
    const baseTimeTaken = workOrder.timeTaken || 0;
    const timeEntries = workOrder.timeEntries;
    const timeEntriesWithoutStop = timeEntries.filter(
      (entry) => entry.stopTime === null
    );

    const mostRecentTimeEntry = timeEntriesWithoutStop.sort(
      (a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    )[0];

    if (!mostRecentTimeEntry) return baseTimeTaken;

    const timeTaken =
      baseTimeTaken +
      (new Date().getTime() - mostRecentTimeEntry.startTime.getTime());
    return timeTaken;
  };

  const steps = workOrder.workInstruction?.steps || [];

  const workOrderStatus = workOrder.status;

  // Get clocked-in users from the work order
  const clockedInUsers =
    workOrder.clockInEntries?.map((entry) => entry.user) || [];

  // Get the total time estimate for the work order by summing the time estimate for each step
  const timeEstimate = steps.reduce(
    (acc, step) => acc + step.estimatedLabourTime,
    0
  );

  const getTimeStatus = () => {
    const elapsedTime = elapsedTimeSoFar();
    const percentage = (elapsedTime / (timeEstimate * 60 * 1000)) * 100; // Convert minutes to milliseconds
    if (percentage < 80) return 'on-time';
    if (percentage < 100) return 'warning';
    return 'overdue';
  };

  const getTimeStatusColor = () => {
    const status = getTimeStatus();
    if (workOrderStatus !== WorkOrderStatus.IN_PROGRESS) return 'bg-gray-700';
    switch (status) {
      case 'on-time':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'overdue':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const handleStartStop = async () => {
    setIsLoading(true);
    try {
      if (workOrderStatus === WorkOrderStatus.IN_PROGRESS) {
        // Pause the work order
        const result = await pauseWorkOrderProduction(workOrder.id);
        if (result.success) {
          setIsRunning(false);
        }
      } else {
        // Start the work order
        const result = await startWorkOrderProduction(workOrder.id);
        if (result.success) {
          setIsRunning(true);
        }
      }
    } catch (error) {
      console.error('Error toggling work order:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const StartStopButton = () => {
    const hasUsers = clockedInUsers.length > 0;
    const isDisabled = !hasUsers || isLoading;

    if (
      workOrderStatus === WorkOrderStatus.PAUSED ||
      workOrderStatus === WorkOrderStatus.TODO
    ) {
      return (
        <Button
          variant="secondary"
          className="flex items-center w-24"
          onClick={handleStartStop}
          disabled={isDisabled}
        >
          <PlayIcon className="w-4 h-4 mr-2" />
          Start
        </Button>
      );
    }

    if (workOrderStatus === WorkOrderStatus.IN_PROGRESS) {
      return (
        <Button
          variant="secondary"
          className="flex items-center w-24"
          onClick={handleStartStop}
          disabled={isLoading}
        >
          <PauseIcon className="w-4 h-4 mr-2" />
          Pause
        </Button>
      );
    }

    return <></>;
  };

  return (
    <div
      className={cn(
        'px-4 text-white space-y-4 h-20 content-center',
        getTimeStatusColor()
      )}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          {/* Return Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/production')}
            className="text-white hover:bg-white/20 p-2 mr-2 h-8 w-8"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          {/* Part Info */}
          <div>
            <h1 className="text-xl font-bold mb-1">{workOrder.part.name}</h1>
            <div className="flex items-center gap-4">
              <p className="text-sm opacity-90">{workOrder.part.partNumber}</p>
              <p className="text-sm opacity-90">Qty: {workOrder.partQty}</p>
              <ProductionStatusBadge
                status={workOrderStatus}
                className="text-[10px]"
              />
            </div>
          </div>

          <div className="flex items-center ml-8 py-2 px-4 rounded-md border border-red-500">
            <h1 className="text-xl font-bold text-red-500 ">
              Qty: {workOrder.partQty}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Time Tracking */}
          <Timer
            initialElapsedTime={elapsedTimeSoFar()}
            isRunning={isRunning}
          />

          {/* Start/Stop Button */}
          <StartStopButton />

          {/* Clocked in Users */}
          <ClockInModal
            workOrderId={workOrder.id}
            clockedInUsers={clockedInUsers}
            disabled={workOrderStatus === WorkOrderStatus.IN_PROGRESS}
          />
        </div>
      </div>
    </div>
  );
}
