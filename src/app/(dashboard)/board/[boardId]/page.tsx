import React from 'react';
import { KanbanBoard } from "@/components/board/kanban-board"
import { ActionPanel } from '@/components/board/action-panel';
import { getKanbanSections, getAllTasks, getAllViews, getBoards } from '@/lib/queries';
import { BoardsTopBar } from '@/components/board/top-bar'
import PageContainer from '@/components/page-container';
export const dynamic = 'force-dynamic';

export default async function ProductionPage({params}: {params: {boardId: string}}) {
  const { boardId } = await params;
  const [tasks, kanbanSections, views, boards] = await Promise.all([
    getAllTasks(),
    getKanbanSections(boardId),
    getAllViews(),
    getBoards(),
  ]);

  const activeBoardName = boards.find((board) => board.id === boardId)?.name || boardId

  return (
    <div>
      <BoardsTopBar activeBoardName={activeBoardName} boards={boards} />
      <PageContainer>
        <ActionPanel views={views} boardId={boardId} />
        <KanbanBoard columns={kanbanSections} tasks={tasks} boardId={boardId} />
      </PageContainer>
    </div>
  );
} 