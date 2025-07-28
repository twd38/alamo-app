'use client';

import { useMemo, Suspense, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import BasicTopBar from '@/components/layouts/basic-top-bar';
import PageContainer from '@/components/page-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WorkOrdersDataTable } from './components/work-orders-datatable';
import { WorkOrderStatusTabs } from './components/work-order-status-tabs';
import { WorkOrderColumnVisibility } from './components/work-order-column-visibility';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getWorkOrders } from './queries';
import { WorkOrderStatus } from '@prisma/client';

const ProductionLoadingSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-64 w-full" />
    <div className="flex justify-between">
      <Skeleton className="h-8 w-32" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  </div>
);

const ProductionPageContent = ({
  onTableReady
}: {
  onTableReady?: (table: any) => void;
}) => {
  const searchParams = useSearchParams();

  // Extract URL parameters
  const query = searchParams.get('query') || '';
  const currentPage = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 10;
  const sortBy = searchParams.get('sortBy') || 'dueDate';
  const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';
  const status =
    (searchParams.get('status') as WorkOrderStatus) || WorkOrderStatus.TODO;

  // Create SWR key that updates when params change
  const swrKey = useMemo(
    () => ['work-orders', query, currentPage, limit, sortBy, sortOrder, status],
    [query, currentPage, limit, sortBy, sortOrder, status]
  );

  // Fetch data with SWR
  const { data, error, isLoading, mutate } = useSWR(
    swrKey,
    () =>
      getWorkOrders({
        query,
        status,
        page: currentPage,
        limit,
        sortBy,
        sortOrder
      }),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true, // Refresh when connection restored
      dedupingInterval: 5000, // Dedupe requests within 5 seconds
      focusThrottleInterval: 10000, // Throttle focus revalidation
      errorRetryCount: 3, // Retry failed requests
      errorRetryInterval: 1000, // Wait 1s between retries
      keepPreviousData: true, // Keep showing stale data while fetching new
      onError: (err) => {
        console.error('Error fetching work orders:', err);
      }
    }
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
        <div className="flex justify-between">
          <Skeleton className="h-8 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load work orders. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <WorkOrdersDataTable
      workOrders={data?.workOrders || []}
      totalCount={data?.totalCount || 0}
      refetch={mutate}
      onTableReady={onTableReady}
    />
  );
};

const ProductionPageWrapper = () => {
  const searchParams = useSearchParams();
  const [table, setTable] = useState<any>(null);
  const status =
    (searchParams.get('status') as WorkOrderStatus) || WorkOrderStatus.TODO;

  const handleTableReady = useCallback((tableInstance: any) => {
    setTable(tableInstance);
  }, []);

  return (
    <div className="h-full bg-zinc-50 dark:bg-zinc-900">
      <BasicTopBar />
      <PageContainer>
        <Card>
          <CardHeader>
            <CardTitle>Work Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between pb-4">
              <WorkOrderStatusTabs initialStatus={status} />
              {table && <WorkOrderColumnVisibility table={table} />}
            </div>
            <Suspense fallback={<ProductionLoadingSkeleton />}>
              <ProductionPageContent onTableReady={handleTableReady} />
            </Suspense>
          </CardContent>
        </Card>
      </PageContainer>
    </div>
  );
};

const ProductionPageFullSkeleton = () => (
  <div className="h-full bg-zinc-50 dark:bg-zinc-900">
    <BasicTopBar />
    <PageContainer>
      <Card>
        <CardHeader>
          <CardTitle>Work Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center pb-4">
            <Skeleton className="h-10 w-64" />
          </div>
          <ProductionLoadingSkeleton />
        </CardContent>
      </Card>
    </PageContainer>
  </div>
);

const ProductionPage = () => {
  return (
    <Suspense fallback={<ProductionPageFullSkeleton />}>
      <ProductionPageWrapper />
    </Suspense>
  );
};

export default ProductionPage;
