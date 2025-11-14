'use client';

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { List, KanbanSquare } from 'lucide-react';

export function WorkOrderViewToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentView = searchParams.get('view') === 'kanban' ? 'kanban' : 'list';

  const handleViewChange = useCallback(
    (nextView: 'list' | 'kanban') => {
      if (!nextView || nextView === currentView) return;

      const params = new URLSearchParams(searchParams.toString());
      if (nextView === 'list') {
        params.delete('view');
      } else {
        params.set('view', nextView);
      }

      const queryString = params.toString();
      router.push(queryString ? `${pathname}?${queryString}` : pathname);
    },
    [currentView, pathname, router, searchParams]
  );

  const buttonVariant = (view: 'list' | 'kanban') =>
    currentView === view ? 'default' : 'outline';

  return (
    <ButtonGroup className="shrink-0">
      <Button
        type="button"
        size="sm"
        variant={buttonVariant('list')}
        aria-pressed={currentView === 'list'}
        onClick={() => handleViewChange('list')}
        className="flex items-center gap-2"
      >
        <List className="h-4 w-4" />
        List
      </Button>
      <Button
        type="button"
        size="sm"
        variant={buttonVariant('kanban')}
        aria-pressed={currentView === 'kanban'}
        onClick={() => handleViewChange('kanban')}
        className="flex items-center gap-2"
      >
        <KanbanSquare className="h-4 w-4" />
        Kanban
      </Button>
    </ButtonGroup>
  );
}
