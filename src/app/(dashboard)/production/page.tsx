import BasicTopBar from '@/components/layouts/basic-top-bar';
import { getWorkOrdersPaginated, getWorkOrdersCount } from '@/lib/queries';
import PageContainer from '@/components/page-container';
import { WorkOrdersDataTable } from '@/components/production/work-orders-datatable';

interface ProductionPageProps {
  searchParams: Promise<{
    query?: string;
    page?: string;
    limit?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }>;
}

const ProductionPage = async (props: ProductionPageProps) => {
  const searchParams = await props.searchParams;
  const query = searchParams?.query || '';
  const currentPage = Number(searchParams?.page) || 1;
  const limit = Number(searchParams?.limit) || 10;
  const sortBy = searchParams?.sortBy || 'dueDate';
  const sortOrder = (searchParams?.sortOrder as 'asc' | 'desc') || 'asc';

  const workOrders = await getWorkOrdersPaginated({
    query,
    page: currentPage,
    limit,
    sortBy,
    sortOrder
  });

  const totalCount = await getWorkOrdersCount({ query });

  return (
    <div className="h-full bg-zinc-50 dark:bg-zinc-900">
      <BasicTopBar />
      <PageContainer>
        <WorkOrdersDataTable workOrders={workOrders} totalCount={totalCount} />
      </PageContainer>
    </div>
  );
};

export default ProductionPage;
