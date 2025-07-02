'use client';

import { useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import BasicTopBar from '@/components/layouts/basic-top-bar';
import { getWorkOrdersWithCount } from '@/lib/queries';
import PageContainer from '@/components/page-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WorkOrdersDataTable } from '@/components/production/work-orders-datatable';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const ProductionLoadingSkeleton = () => (
  <div className="h-full bg-zinc-50 dark:bg-zinc-900">
    <BasicTopBar />
    <PageContainer>
      <Card>
        <CardHeader>
          <CardTitle>Work Orders</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </PageContainer>
  </div>
);

const ProductionPageContent = () => {
  const searchParams = useSearchParams();

  // Extract URL parameters
  const query = searchParams.get('query') || '';
  const currentPage = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 10;
  const sortBy = searchParams.get('sortBy') || 'dueDate';
  const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc';

  // Create SWR key that updates when params change
  const swrKey = useMemo(
    () => ['work-orders', query, currentPage, limit, sortBy, sortOrder],
    [query, currentPage, limit, sortBy, sortOrder]
  );

  // Fetch data with SWR
  const { data, error, isLoading, mutate } = useSWR(
    swrKey,
    () =>
      getWorkOrdersWithCount({
        query,
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
      <div className="h-full bg-zinc-50 dark:bg-zinc-900">
        <BasicTopBar />
        <PageContainer>
          <Card>
            <CardHeader>
              <CardTitle>Work Orders</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </PageContainer>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-full bg-zinc-50 dark:bg-zinc-900">
        <BasicTopBar />
        <PageContainer>
          <Card>
            <CardHeader>
              <CardTitle>Work Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Failed to load work orders. Please try refreshing the page.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="h-full bg-zinc-50 dark:bg-zinc-900">
      <BasicTopBar />
      <PageContainer>
        <Card>
          <CardHeader>
            <CardTitle>Work Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <WorkOrdersDataTable
              workOrders={data?.workOrders || []}
              totalCount={data?.totalCount || 0}
            />
          </CardContent>
        </Card>
      </PageContainer>
    </div>
  );
};

const ProductionPage = () => {
  return (
    <Suspense fallback={<ProductionLoadingSkeleton />}>
      <ProductionPageContent />
    </Suspense>
  );
};

export default ProductionPage;
