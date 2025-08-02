import { ProceduresManager } from './components/procedures-manager';
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
        <ProceduresManager />
      </PageContainer>
    </div>
  );
}