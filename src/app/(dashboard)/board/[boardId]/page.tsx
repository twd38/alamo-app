import React from 'react';
import { KanbanBoard } from "@/components/board/kanban-board"
import { ActionPanel } from '@/components/board/action-panel';
import { getKanbanSections, getAllTasks, getAllViews, getBoards } from '@/lib/queries';
import { BoardsTopBar } from '@/components/board/top-bar'
import PageContainer from '@/components/page-container';
export const dynamic = 'force-dynamic';

type BoardPageProps = {
  params: Promise<{
    boardId: string;
  }>
}

export default async function ProductionPage({params}: BoardPageProps) {
  const { boardId } = await params;
  const [tasks, kanbanSections, views, boards] = await Promise.all([
    getAllTasks(),
    getKanbanSections(boardId),
    getAllViews(boardId),
    getBoards(),
  ]);

  const activeBoard = boards.find((board) => board.id === boardId)

  if(!activeBoard) {
    return <div>Board not found</div>
  }

  return (
    <div>
      <BoardsTopBar activeBoard={activeBoard} boards={boards} />
      <PageContainer>
        <ActionPanel views={views} boardId={boardId} />
        <KanbanBoard columns={kanbanSections} tasks={tasks} boardId={boardId} />
      </PageContainer>
    </div>
  );
} 