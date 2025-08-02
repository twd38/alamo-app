import { PartsLibraryManager } from './components/parts-library-manager';
import BasicTopBar from '@/components/layouts/basic-top-bar';
import PageContainer from '@/components/page-container';
import type { Metadata } from 'next';

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

export default function PartsLibraryPage() {
  const breadcrumbs = [
    { href: '/parts', label: 'Parts' },
    { href: '/parts/library', label: 'Library' }
  ];

  return (
    <div>
      <BasicTopBar breadcrumbs={breadcrumbs} />
      <PageContainer>
        <PartsLibraryManager />
      </PageContainer>
    </div>
  );
}
