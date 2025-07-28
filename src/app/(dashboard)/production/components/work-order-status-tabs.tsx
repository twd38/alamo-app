'use client';

import { useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WorkOrderStatus } from '@prisma/client';

interface WorkOrderStatusTabsProps {
  initialStatus: WorkOrderStatus;
}

export function WorkOrderStatusTabs({
  initialStatus
}: WorkOrderStatusTabsProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleStatusFilterChange = useCallback(
    (value: string) => {
      router.push(`${pathname}?status=${value}`);
    },
    [router, pathname]
  );

  return (
    <Tabs
      defaultValue={initialStatus}
      className="mr-auto"
      onValueChange={(value) => handleStatusFilterChange(value)}
    >
      <TabsList>
        <TabsTrigger value={WorkOrderStatus.TODO}>Todo</TabsTrigger>
        <TabsTrigger value={WorkOrderStatus.IN_PROGRESS}>
          In Progress
        </TabsTrigger>
        <TabsTrigger value={WorkOrderStatus.COMPLETED}>Completed</TabsTrigger>
        <TabsTrigger value={WorkOrderStatus.HOLD}>Hold</TabsTrigger>
        <TabsTrigger value={WorkOrderStatus.SCRAPPED}>Scrapped</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
