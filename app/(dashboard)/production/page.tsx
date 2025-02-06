import React from 'react';
import { KanbanBoard } from "components/kanban/kanban-board"
import { ActionPanel } from './ActionPanel';
import { Column } from "app/types/kanban";
import { cache } from 'react';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers'
// export const dynamic = 'force-dynamic';

const getWorkstations = async () => {
  return await prisma.workStation.findMany({
    include: {
      jobs: true
    }
  })
}

export default async function ProductionPage() {
  const cookieStore = await cookies()

  const workstations = await getWorkstations()
  console.log(workstations)

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