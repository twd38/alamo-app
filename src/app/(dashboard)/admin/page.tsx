import TopBar from '@/components/layouts/basic-top-bar';
import PageContainer from '@/components/page-container';
import { AdminTabs } from './components/tabs';

export default function AdminPage() {
  return (
    <div className="flex flex-col">
      {/* Admin Top Bar - Using same structure as BoardsTopBar */}
      <TopBar />

      <PageContainer>
        <AdminTabs />
      </PageContainer>
    </div>
  );
}
