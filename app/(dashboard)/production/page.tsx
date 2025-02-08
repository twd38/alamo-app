import React from 'react';
import { KanbanBoard } from "components/kanban/kanban-board"
import { ActionPanel } from './ActionPanel';
import { prisma } from '@/lib/db';
// export const dynamic = 'force-dynamic';

const getWorkstations = async () => {
  return await prisma.workStation.findMany({
    include: {
      jobs: true
    }
  })
}

export default async function ProductionPage() {

  const workstations = await getWorkstations()

  return (
    <div>
      <ActionPanel />
      <KanbanBoard columns={workstations} />
      <div>
        {workstations.map((workstation) => (
          <div key={workstation.id}>
            {workstation.name}
          </div>
        ))  }
      </div>
    </div>
  );
} 