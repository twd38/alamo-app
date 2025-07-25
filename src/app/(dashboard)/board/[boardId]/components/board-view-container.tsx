'use client';

import { useState } from 'react';
import { KanbanBoard } from './kanban-board';
import { ListView } from './list-view';
import { TimelineView } from './timeline-view';
import { ActionPanel } from './action-panel';
import type { BoardView } from '@prisma/client';

interface BoardViewContainerProps {
  columns: any[];
  tasks: any[];
  views: BoardView[];
  boardId: string;
}

export function BoardViewContainer({
  columns,
  tasks,
  views,
  boardId
}: BoardViewContainerProps) {
  const [currentView, setCurrentView] = useState<string>('kanban');

  const handleViewTypeChange = (viewType: string) => {
    setCurrentView(viewType);
  };

  const renderView = () => {
    switch (currentView) {
      case 'list':
        return <ListView columns={columns} tasks={tasks} boardId={boardId} />;
      case 'timeline':
        return (
          <TimelineView columns={columns} tasks={tasks} boardId={boardId} />
        );
      case 'kanban':
      default:
        return (
          <KanbanBoard columns={columns} tasks={tasks} boardId={boardId} />
        );
    }
  };

  return (
    <div className="">
      <ActionPanel
        views={views}
        boardId={boardId}
        onViewTypeChange={handleViewTypeChange}
      />
      <div className="max-h-[calc(100vh-120px)] overflow-clip">
      {renderView()}
      </div>
    </div>
  );
}
