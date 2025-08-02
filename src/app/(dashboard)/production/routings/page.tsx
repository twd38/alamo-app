import { RoutingsManager } from './components/routings-manager';
import BasicTopBar from '@/components/layouts/basic-top-bar';
import PageContainer from '@/components/page-container';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Routings',
  description: 'Manage manufacturing routings and process flows',
};

export default function RoutingsPage() {
  const breadcrumbs = [
    { href: '/production', label: 'Production' },
    { href: '/production/routings', label: 'Routings' }
  ];

  return (
    <div>
      <BasicTopBar breadcrumbs={breadcrumbs} />
      <PageContainer>
        <RoutingsManager />
      </PageContainer>
    </div>
  );
}