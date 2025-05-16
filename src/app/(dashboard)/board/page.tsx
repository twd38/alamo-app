import React from 'react';
import { KanbanBoard } from "@/components/kanban/kanban-board"
import { ActionPanel } from '@/components/board/action-panel';
import { getKanbanSections, getAllTasks, getAllViews } from '@/lib/queries';
import BasicTopBar from '@/components/layouts/basic-top-bar';
import PageContainer from '@/components/page-container';

export const dynamic = 'force-dynamic';

export default async function ProductionPage() {
  const [tasks, kanbanSections, views] = await Promise.all([
    getAllTasks(),
    getKanbanSections(),
    getAllViews(),
  ]);

  return (
    <div>
      <BasicTopBar />
      <PageContainer>
        <ActionPanel views={views} />
        <KanbanBoard columns={kanbanSections} tasks={tasks} />
      </PageContainer>
    </div>
  );
} 