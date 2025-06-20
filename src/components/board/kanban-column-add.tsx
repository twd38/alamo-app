'use client';

import { Plus } from 'lucide-react';
import { Button } from 'src/components/ui/button';

interface KanbanColumnNewProps {
  onAddColumn: () => void;
}

export function KanbanColumnNew({ onAddColumn }: KanbanColumnNewProps) {
  return (
    <div className="dark:bg-gray-800 rounded-lg">
      <div className="flex-1 min-w-[280px] max-w-[350px] transition-all duration-200">
        <Button
          onClick={onAddColumn}
          variant="ghost"
          className="bg-muted/20 rounded-lg flex flex-col h-[calc(100vh-200px)] w-full justify-center items-center border border-dashed border-muted-foreground/30 hover:bg-muted/50"
        >
          <Plus className="h-6 w-6 mb-1 text-muted-foreground" />
          <span className="text-muted-foreground font-medium">Add section</span>
        </Button>
      </div>
    </div>
  );
}
