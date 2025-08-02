import { OperationsManager } from './components/operations-manager';
import BasicTopBar from '@/components/layouts/basic-top-bar';
import PageContainer from '@/components/page-container';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Operations',
  description: 'Manage manufacturing operations',
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
        <OperationsManager />
      </PageContainer>
    </div>
  );
}