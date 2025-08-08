import { Suspense } from 'react';
import { OperationsManager } from './components/operations-manager';
import BasicTopBar from '@/components/layouts/basic-top-bar';
import PageContainer from '@/components/page-container';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Operations',
  description: 'Manage production operations and procedures',
};

export default function OperationsPage() {
  const breadcrumbs = [
    { href: '/production', label: 'Production' },
    { href: '/production/operations', label: 'Operations' }
  ];

  return (
    <div>
      <BasicTopBar breadcrumbs={breadcrumbs} />
      <PageContainer>
        <Suspense fallback={<div className="flex items-center justify-center h-96">Loading...</div>}>
          <OperationsManager />
        </Suspense>
      </PageContainer>
    </div>
  );
}