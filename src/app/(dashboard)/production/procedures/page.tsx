import { Suspense } from 'react';
import { ProceduresList } from './components/procedures-list';
import BasicTopBar from '@/components/layouts/basic-top-bar';
import PageContainer from '@/components/page-container';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Procedures',
  description: 'Manage operation procedures and work instructions',
};

export default function ProceduresPage() {
  const breadcrumbs = [
    { href: '/production', label: 'Production' },
    { href: '/production/procedures', label: 'Procedures' }
  ];

  return (
    <div>
      <BasicTopBar breadcrumbs={breadcrumbs} />
      <PageContainer>
        <Suspense fallback={<div className="flex items-center justify-center h-96">Loading...</div>}>
          <ProceduresList />
        </Suspense>
      </PageContainer>
    </div>
  );
}