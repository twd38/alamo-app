import React from 'react';
import { KanbanBoard } from "@/components/kanban/kanban-board"
import { ActionPanel } from '@/components/production/action-panel';
import { getWorkstations } from '@/lib/queries';
import BasicTopBar from '@/components/layouts/basic-top-bar';
import PageContainer from '@/components/page-container';
export const dynamic = 'force-dynamic';

export default async function ProductionPage() {
  const workstations = await getWorkstations();

  return (
    <div>
      <BasicTopBar />
      <PageContainer>
        <ActionPanel />
        <KanbanBoard columns={workstations} />
      </PageContainer>
    </div>
  );
} 