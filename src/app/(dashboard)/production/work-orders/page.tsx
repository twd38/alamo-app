'use client';

import { useMemo, Suspense, useCallback } from 'react';
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
import { getWorkOrdersKanban } from './queries/getWorkOrdersKanban';
import { WorkOrderStatus } from '@prisma/client';
import { WorkOrdersKanban } from './components/work-orders-kanban';
import { WorkOrderViewToggle } from './components/view-toggle';
import { cn } from '@/lib/utils';

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
  const viewParam = searchParams.get('view');
  const view: 'list' | 'kanban' = viewParam === 'kanban' ? 'kanban' : 'list';
  const status: WorkOrderStatus | WorkOrderStatus[] =
    statusParam === 'ALL'
      ? [
          WorkOrderStatus.TODO,
          WorkOrderStatus.PAUSED,
          WorkOrderStatus.COMPLETED,
          WorkOrderStatus.MANUFACTURING,
          WorkOrderStatus.QUALITY_CONTROL,
          WorkOrderStatus.SHIP
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

  const {
    data: kanbanData,
    error: kanbanError,
    isLoading: kanbanLoading,
    mutate: mutateKanban
  } = useSWR(
    view === 'kanban' ? ['work-orders-kanban', query] : null,
    () =>
      getWorkOrdersKanban({
        query
      }),
    {
      revalidateOnFocus: false,
      keepPreviousData: true
    }
  );

  const handleStatusUpdate = useCallback(() => {
    mutate();
    mutateKanban?.();
  }, [mutate, mutateKanban]);

  // Error state
  if (view === 'list' && error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load work orders. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  if (view === 'kanban') {
    if (kanbanError) {
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
      <WorkOrdersKanban
        workOrders={kanbanData?.workOrders || []}
        loading={kanbanLoading && !kanbanData}
        onStatusChange={handleStatusUpdate}
        onArchive={handleStatusUpdate}
      />
    );
  }

  return (
    <div className="w-full space-y-4">
      <WorkOrderStatusTabs initialStatus={status as string} />
      <WorkOrdersDataTable
        workOrders={data?.workOrders || []}
        totalCount={data?.totalCount || 0}
        refetchAction={mutate}
        loading={isLoading}
      />
    </div>
  );
};

const ProductionPageWrapper = () => {
  const searchParams = useSearchParams();
  const view = searchParams.get('view') === 'kanban' ? 'kanban' : 'list';

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <BasicTopBar />
      <PageContainer className="flex flex-1 flex-col gap-4 overflow-hidden">
        <div className="flex items-center justify-between space-y-1">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Work Orders</h2>
            <p className="text-muted-foreground">
              View and manage all work orders
            </p>
          </div>

          <WorkOrderViewToggle />
        </div>

        <div
          className={cn(
            'flex-1',
            view === 'kanban' ? 'overflow-hidden' : 'overflow-auto'
          )}
        >
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
