'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// Dynamically import the schedule view with no SSR to avoid hydration issues
const WorkCenterScheduleView = dynamic(
  () => import('../../work-centers/components/work-center-schedule-view').then(mod => mod.WorkCenterScheduleView),
  { 
    ssr: false,
    loading: () => (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[400px]" />
        ))}
      </div>
    )
  }
);

interface ClientScheduleWrapperProps {
  workCenters: any[];
}

export function ClientScheduleWrapper({ workCenters }: ClientScheduleWrapperProps) {
  return <WorkCenterScheduleView workCenters={workCenters} />;
}