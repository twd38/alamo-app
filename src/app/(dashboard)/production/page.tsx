import React from 'react';
import { KanbanBoard } from "src/components/kanban/kanban-board"
import { ActionPanel } from '../../../components/production/action-panel';
import { getWorkstations } from '@/lib/queries';
import JobDetail from '@/components/production/task-detail';
// export const dynamic = 'force-dynamic';

export default async function ProductionPage() {

  const workstations = await getWorkstations()
  console.log(workstations)

  return (
    <div>
      <ActionPanel />
      <KanbanBoard columns={workstations} />
    </div>
  );
} 