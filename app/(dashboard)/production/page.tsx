import React from 'react';
import { KanbanBoard } from "@/components/kanban/kanban-board"
import { ActionPanel } from '@/components/production/action-panel';
import { getWorkstations } from '@/lib/queries';
import TaskDetail from '@/components/production/task-detail';

export default async function ProductionPage() {
  const workstations = await getWorkstations();

  return (
    <div>
      <ActionPanel />
      <KanbanBoard columns={workstations} />
      {/* <TaskDetail task={task} /> */}
    </div>
  );
} 