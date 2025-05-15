import React from 'react';
import { KanbanBoard } from "@/components/kanban/kanban-board"
import { ActionPanel } from '@/components/board/action-panel';
import { getKanbanSections, getAllTasks } from '@/lib/queries';
import BasicTopBar from '@/components/layouts/basic-top-bar';
import PageContainer from '@/components/page-container';

export const dynamic = 'force-dynamic';

export default async function ProductionPage() {
  const [tasks, kanbanSections] = await Promise.all([
    getAllTasks(),
    getKanbanSections(),
  ]);

  return (
    <div>
      <BasicTopBar />
      <PageContainer>
        <ActionPanel />
        <KanbanBoard columns={kanbanSections} tasks={tasks} />
      </PageContainer>
    </div>
  );
} 