'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  ChevronDown,
  Tag,
  User,
  Calendar,
  CheckCircle,
  Plus,
  Lock,
  BarChart,
  List
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import NewSectionDialog from './new-section-dialog';
import CreateViewDialog from './create-view';
import { useAtom } from 'jotai';
import { taskModal } from './utils';
import {
  FilterPopover,
  FilterOption,
  FilterItem
} from '@/components/filter-popover';
import { getAllUsers } from '@/lib/queries';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFilterAtom } from '@/components/filter-popover';
import useSWR from 'swr';
import { BoardView } from '@prisma/client';
import UpdateViewDialog from './update-view-dialog';
import SortDropdown from './sort-dropdown';

const operatorOptions = [
  { label: 'is', value: 'is' },
  { label: 'is not', value: 'is_not' },
  { label: 'contains', value: 'contains' },
  { label: 'does not contain', value: 'does_not_contain' }
];

type ActionPanelProps = {
  views: BoardView[];
  boardId: string;
  onViewTypeChange?: (viewType: string) => void;
};

export function ActionPanel({
  views,
  boardId,
  onViewTypeChange
}: ActionPanelProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreateViewDialogOpen, setIsCreateViewDialogOpen] = useState(false);
  const [isUpdateViewDialogOpen, setIsUpdateViewDialogOpen] = useState(false);
  const [activeTask, setActiveTask] = useAtom(taskModal);
  const [filterState, setFilterState] = useFilterAtom('kanban-board');
  const [activeView, setActiveView] = useState<BoardView | null>(null);
  const [currentViewType, setCurrentViewType] = useState<string>('kanban');

  // use swr to get all users
  const { data: allUsers, isLoading } = useSWR('all-users', getAllUsers);

  const openNewSectionDialog = () => {
    setIsDialogOpen(true);
  };

  const closeNewSectionDialog = () => {
    setIsDialogOpen(false);
  };

  const openCreateViewDialog = () => {
    setIsCreateViewDialogOpen(true);
  };

  const closeCreateViewDialog = () => {
    setIsCreateViewDialogOpen(false);
  };

  const openUpdateViewDialog = () => {
    setIsUpdateViewDialogOpen(true);
  };

  const closeUpdateViewDialog = () => {
    setIsUpdateViewDialogOpen(false);
  };

  const createNewTask = () => {
    setActiveTask({
      type: 'new',
      taskId: null,
      kanbanSectionId: null
    });
  };

  const handleApplyFilters = (filters: FilterItem[]) => {
    setIsUpdateViewDialogOpen(true);
  };

  const handleViewChange = (viewId: string) => {
    const viewFilter: any = views?.find((view) => view.id === viewId)?.filters;
    // // set the filter state to the view filters
    setFilterState({
      filters: viewFilter || []
    });
    setActiveView(views?.find((view) => view.id === viewId) || null);
  };

  const handleViewTypeChange = (viewType: string) => {
    setCurrentViewType(viewType);
    onViewTypeChange?.(viewType);
  };

  const filterOptions: FilterOption[] = [
    {
      label: 'Assignee',
      value: 'assignee',
      icon: <User className="h-4 w-4 mr-2" />,
      inputType: 'user',
      userOptions: allUsers || []
    },
    { label: 'Tag', value: 'tag', icon: <Tag className="h-4 w-4 mr-2" /> },
    {
      label: 'Due date',
      value: 'due_date',
      icon: <Calendar className="h-4 w-4 mr-2" />
    },
    {
      label: 'Created by',
      value: 'created_by',
      icon: <User className="h-4 w-4 mr-2" />
    },
    {
      label: 'Completed on',
      value: 'completed_on',
      icon: <CheckCircle className="h-4 w-4 mr-2" />
    },
    {
      label: 'Private',
      value: 'private',
      icon: <Lock className="h-4 w-4 mr-2" />,
      inputType: 'boolean'
    }
  ];

  const tabs = [
    {
      label: 'Kanban',
      value: 'kanban',
      icon: <BarChart className="h-4 w-4 mr-2" />
    },
    {
      label: 'List',
      value: 'list',
      icon: <List className="h-4 w-4 mr-2" />
    },
    {
      label: 'Timeline',
      value: 'timeline',
      icon: <Calendar className="h-4 w-4 mr-2" />
    }
  ];

  // on mount, set filter state to empty
  useEffect(() => {
    setFilterState({ filters: [] });
  }, [setFilterState]);

  return (
    <div>
      <div className="flex items-center justify-between">
        {/* WORK IN PROGRESS */}
        {/* <Tabs value={currentViewType} onValueChange={handleViewTypeChange}>
          <TabsList>
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                <div className="flex items-center">
                  {tab.icon}
                  {tab.label}
                </div>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs> */}
        <div className="flex items-center gap-2 ml-auto">
          <SortDropdown />
          <FilterPopover
            filterOptions={filterOptions}
            operatorOptions={operatorOptions}
            onSaveFilters={activeView?.id ? handleApplyFilters : undefined}
            storageKey="kanban-board"
            initialFilters={
              filterState.filters || [
                {
                  id: '0',
                  type: filterOptions[0]?.label || '',
                  operator: operatorOptions[0]?.label || '',
                  value: ''
                }
              ]
            }
            buttonText="Filter"
          />
          <div className="flex items-center">
            <Button
              variant="outline"
              size="sm"
              className={'rounded-r-none'}
              onClick={createNewTask}
            >
              + Add Task
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={'rounded-l-none border-l-0 px-2'}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={createNewTask}>
                  Task
                </DropdownMenuItem>
                <DropdownMenuItem onClick={openNewSectionDialog}>
                  Section
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      <NewSectionDialog
        boardId={boardId}
        isOpen={isDialogOpen}
        onClose={closeNewSectionDialog}
      />
      <CreateViewDialog
        boardId={boardId}
        isOpen={isCreateViewDialogOpen}
        onClose={closeCreateViewDialog}
      />
      <UpdateViewDialog
        boardViewId={activeView?.id || ''}
        isOpen={isUpdateViewDialogOpen}
        onClose={closeUpdateViewDialog}
        initialViewName={activeView?.name || ''}
        initialFilters={filterState.filters || []}
      />
    </div>
  );
}
