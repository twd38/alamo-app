import { Suspense } from 'react';
import { WorkCentersManager } from './components/work-centers-manager';
import BasicTopBar from '@/components/layouts/basic-top-bar';
import PageContainer from '@/components/page-container';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Work Centers',
  description: 'Manage production work centers',
};

export default function WorkCentersPage() {
  const breadcrumbs = [
    { href: '/production', label: 'Production' },
    { href: '/production/work-centers', label: 'Work Centers' }
  ];

  return (
    <div>
      <BasicTopBar breadcrumbs={breadcrumbs} />
      <PageContainer>
        <Suspense fallback={<div className="flex items-center justify-center h-96">Loading...</div>}>
          <WorkCentersManager />
        </Suspense>
      </PageContainer>
    </div>
  );
}