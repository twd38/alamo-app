'use client';

import { useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import BasicTopBar from '@/components/layouts/basic-top-bar';
import PageContainer from '@/components/page-container';
// No Card layout here to mirror Parts Library styling
import { WorkOrdersDataTable } from './components/work-orders-datatable';
import { WorkOrderStatusTabs } from './components/work-order-status-tabs';
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

const ProductionPageContent = () => {
  const searchParams = useSearchParams();

  // Extract URL parameters
  const query = searchParams.get('query') || '';
  const currentPage = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 10;
  const sortBy = searchParams.get('sortBy') || 'dueDate';
  const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';
  const statusParam = searchParams.get('status') || 'TODO';
  const status: WorkOrderStatus | WorkOrderStatus[] =
    statusParam === 'ALL'
      ? [
          WorkOrderStatus.TODO,
          WorkOrderStatus.PAUSED,
          WorkOrderStatus.IN_PROGRESS,
          WorkOrderStatus.COMPLETED,
          WorkOrderStatus.HOLD,
          WorkOrderStatus.DRAFT
        ]
      : (statusParam as WorkOrderStatus);

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
      refetchAction={mutate}
      loading={isLoading}
    />
  );
};

const ProductionPageWrapper = () => {
  const searchParams = useSearchParams();
  const status = searchParams.get('status') || 'TODO';

  return (
    <div className="h-full">
      <BasicTopBar />
      <PageContainer>
        <div className="h-full flex-1 flex-col space-y-4 md:flex">
          <div className="flex items-center justify-between space-y-1">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Work Orders</h2>
              <p className="text-muted-foreground">
                Browse and manage work orders in the system
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <WorkOrderStatusTabs initialStatus={status} />
          </div>

          <Suspense fallback={<ProductionLoadingSkeleton />}>
            <ProductionPageContent />
          </Suspense>
        </div>
      </PageContainer>
    </div>
  );
};

const ProductionPageFullSkeleton = () => (
  <div className="h-full">
    <BasicTopBar />
    <PageContainer>
      <div className="h-full flex-1 flex-col space-y-4 md:flex">
        <div className="flex items-center justify-between space-y-1">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Work Orders</h2>
            <p className="text-muted-foreground">
              Browse and manage work orders in the system
            </p>
          </div>
        </div>
        <div className="flex items-center pb-4">
          <Skeleton className="h-10 w-64" />
        </div>
        <ProductionLoadingSkeleton />
      </div>
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
