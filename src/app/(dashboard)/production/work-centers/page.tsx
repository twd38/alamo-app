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
        <WorkCentersManager />
      </PageContainer>
    </div>
  );
}