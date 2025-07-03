import { LibraryDataTable } from '@/components/library/library-datatable';
import { getParts, getPartsCount } from '@/lib/queries';
import BasicTopBar from '@/components/layouts/basic-top-bar';
import PageContainer from '@/components/page-container';
import type { Metadata } from 'next';

interface InventoryPageProps {
  searchParams: Promise<{
    query?: string;
    page?: string;
    limit?: string;
    sortBy?: string;
    sortOrder?: string;
    totalCount?: number;
  }>;
  params: Promise<{
    id: string;
  }>;
}

export const metadata: Metadata = {
  title: 'Parts Library',
  description: 'Browse and manage parts in the Alamo system.',
  keywords: ['parts', 'inventory', 'manufacturing', 'library'],
  openGraph: {
    title: 'Parts Library | Alamo',
    description: 'Browse and manage parts in the Alamo system.',
    url: '/parts/library'
  }
};

export default async function InventoryPage(props: InventoryPageProps) {
  const searchParams = await props.searchParams;
  const query = searchParams?.query || '';
  const currentPage = Number(searchParams?.page) || 1;
  const limit = Number(searchParams?.limit) || 10;
  // const totalPages = await fetchInvoicesPages(query);

  const parts = await getParts({
    query,
    page: currentPage,
    limit,
    sortBy: 'description',
    sortOrder: 'asc'
  });

  const totalParts = await getPartsCount({
    query
  });

  return (
    <div>
      <BasicTopBar />
      <PageContainer>
        <LibraryDataTable parts={parts} totalCount={totalParts} />
      </PageContainer>
    </div>
  );
}
