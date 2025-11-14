'use client';

import { useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WorkOrderStatus } from '@prisma/client';

interface WorkOrderStatusTabsProps {
  initialStatus: string;
}

export function WorkOrderStatusTabs({
  initialStatus
}: WorkOrderStatusTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleStatusFilterChange = useCallback(
    (value: string) => {
      const current = new URLSearchParams(searchParams.toString());
      current.set('status', value);
      // Reset to first page when changing status
      current.set('page', '1');
      router.push(`${pathname}?${current.toString()}`);
    },
    [router, pathname, searchParams]
  );

  return (
    <Tabs
      value={initialStatus}
      className="mr-auto"
      onValueChange={(value) => handleStatusFilterChange(value)}
    >
      <TabsList>
        <TabsTrigger value={'ALL'}>All</TabsTrigger>
        <TabsTrigger value={WorkOrderStatus.TODO}>Todo</TabsTrigger>
        <TabsTrigger value={WorkOrderStatus.MANUFACTURING}>
          Manufacturing
        </TabsTrigger>
        <TabsTrigger value={WorkOrderStatus.QUALITY_CONTROL}>
          Quality Control
        </TabsTrigger>
        <TabsTrigger value={WorkOrderStatus.SHIP}>Ship</TabsTrigger>
        <TabsTrigger value={WorkOrderStatus.COMPLETED}>Completed</TabsTrigger>
        {/* <TabsTrigger value={WorkOrderStatus.PAUSED}>Paused</TabsTrigger> */}
        {/* <TabsTrigger value={WorkOrderStatus.IN_PROGRESS}>
          In Progress
        </TabsTrigger> */}
        {/* <TabsTrigger value={WorkOrderStatus.HOLD}>Hold</TabsTrigger>
        <TabsTrigger value={WorkOrderStatus.DRAFT}>Draft</TabsTrigger> */}
      </TabsList>
    </Tabs>
  );
}
