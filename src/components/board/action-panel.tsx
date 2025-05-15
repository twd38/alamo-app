'use client'
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input"
import { ChevronDown, Filter, Search, Tag, User, Calendar, CheckCircle, Plus } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import NewSectionDialog from './new-section-dialog';
import CreateViewDialog from './create-view';
import { useRouter } from 'next/navigation'
import { useAtom } from 'jotai';
import { taskModal } from './utils';
import { FilterPopover, FilterOption, FilterItem } from '@/components/filter-popover';
import { getAllUsers, getAllViews } from '@/lib/queries';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useFilterAtom } from '@/components/filter-popover';
import useSWR from 'swr';

  const operatorOptions = [
    { label: "is", value: "is"},
    { label: "is not", value: "is_not" },
    { label: "contains", value: "contains" },
    { label: "does not contain", value: "does_not_contain" },
  ]

export function ActionPanel() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isCreateViewDialogOpen, setIsCreateViewDialogOpen] = useState(false);
    const [activeTask, setActiveTask] = useAtom(taskModal)
    const [filterState, setFilterState] = useFilterAtom("kanban-board")

    // use swr to get all users
    const { data: allUsers, isLoading } = useSWR('all-users', getAllUsers);
    const { data: allViews, isLoading: isLoadingViews } = useSWR('all-views', getAllViews);

    console.log(allViews)

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

    const createNewTask = () => {
        setActiveTask({
            type: "new",
            taskId: null,
            kanbanSectionId: null,
        });
    }

    const handleApplyFilters = (filters: FilterItem[]) => {
        console.log(filters)
    };

    const handleViewChange = (viewId: string) => {
        console.log(viewId)
        const viewFilter: any = allViews?.find((view) => view.id === viewId)?.filters
        console.log(viewFilter)
        // // set the filter state to the view filters
        setFilterState({
            filters: viewFilter || [],
        })
    }

    const filterOptions: FilterOption[] = [
        { label: "Assignee", value: "assignee", icon: <User className="h-4 w-4 mr-2" />, inputType: "user", userOptions: allUsers || []},
        { label: "Tag", value: "tag", icon: <Tag className="h-4 w-4 mr-2" /> },
        { label: "Due date", value: "due_date", icon: <Calendar className="h-4 w-4 mr-2" /> },
        { label: "Created by", value: "created_by", icon: <User className="h-4 w-4 mr-2" /> },
        { label: "Completed on", value: "completed_on", icon: <CheckCircle className="h-4 w-4 mr-2" /> },
    ]

    return (
        <div>
            <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                {/* <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search" className="pl-8 w-[250px]" />
                </div> */}
                <Tabs defaultValue="task" onValueChange={handleViewChange}>
                    <TabsList>
                        <TabsTrigger value="task">Overview</TabsTrigger>
                        {
                            allViews?.map((view) => (
                                <TabsTrigger key={view.id} value={view.id}>{view.name}</TabsTrigger>
                            ))
                        }
                    </TabsList>
                    
                </Tabs>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mx-1"
                    onClick={openCreateViewDialog}
                    title="Create new view"
                >
                    <Plus className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-2 ml-auto">
                    <FilterPopover
                        filterOptions={filterOptions}
                        operatorOptions={operatorOptions}
                        onApplyFilters={handleApplyFilters}
                        storageKey="kanban-board"
                        buttonText="Filter"
                    />
                    <div className="flex items-center">
                        <Button variant="outline" size="sm" className={'rounded-r-none'} onClick={createNewTask}>
                            + Add Task
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className={'rounded-l-none border-l-0 px-2'}>
                                    <ChevronDown className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onClick={createNewTask} disabled>Job</DropdownMenuItem>
                                <DropdownMenuItem onClick={createNewTask}>Task</DropdownMenuItem>
                                <DropdownMenuItem onClick={openNewSectionDialog}>Section</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
            <NewSectionDialog isOpen={isDialogOpen} onClose={closeNewSectionDialog} />
            <CreateViewDialog isOpen={isCreateViewDialogOpen} onClose={closeCreateViewDialog} />
        </div>
    );
}