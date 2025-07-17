import React from 'react';
import { BoardViewContainer } from './components/board-view-container';
import { BoardsTopBar } from './components/top-bar';
import PageContainer from '@/components/page-container';
import { getAllTasks } from './queries/getAllTasks';
import { getKanbanSections } from './queries/getKanbanSections';
import { getBoards } from './queries/getBoards';
import { getAllViews } from './queries/getAllViews';

export const dynamic = 'force-dynamic';

type BoardPageProps = {
  params: Promise<{
    boardId: string;
  }>;
};

export default async function ProductionPage({ params }: BoardPageProps) {
  const { boardId } = await params;

  const tasks = await getAllTasks();
  const kanbanSections = await getKanbanSections(boardId);
  const views = await getAllViews(boardId);
  const boards = await getBoards();

  const activeBoard =
    boardId === 'my-tasks'
      ? 'my-tasks'
      : boards.find((board) => board.id === boardId);

  if (!activeBoard) {
    return <div>Board not found</div>;
  }

  return (
    <div>
      <BoardsTopBar activeBoard={activeBoard} boards={boards} />
      <PageContainer>
        <BoardViewContainer
          columns={kanbanSections}
          tasks={tasks}
          views={views}
          boardId={boardId}
        />
      </PageContainer>
    </div>
  );
}
