import React from 'react';
import { KanbanBoard } from "@/components/kanban/kanban-board"
import { ActionPanel } from '@/components/production/action-panel';
import { getWorkstations } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function ProductionPage() {
  const workstations = await getWorkstations();

  return (
    <div>
      <ActionPanel />
      <KanbanBoard columns={workstations} />
    </div>
  );
} 