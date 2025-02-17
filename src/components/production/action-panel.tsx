'use client'
import { useState } from 'react';
import { Button } from 'src/components/ui/button';
import { Input } from "src/components/ui/input"
import { ChevronDown } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "src/components/ui/dropdown-menu"
import { Filter, Search } from "lucide-react"
import NewWorkstationDialog from './new-workstation-dialog';
import { useRouter } from 'next/navigation'

import { taskModal } from './utils';
import { useAtom } from 'jotai';


export function ActionPanel() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [activeTask, setActiveTask] = useAtom(taskModal)
    const router = useRouter();

    const openNewWorkstationDialog = () => {
      setIsDialogOpen(true);
    };
  
    const closeNewWorkstationDialog = () => {
      setIsDialogOpen(false);
    };

    const createNewTask = () => {
        setActiveTask("new");
    }

    const updateActiveTask = (task: "String" | "new" | null) => {
        setActiveTask(task);
    }

    return (
        <div>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search" className="pl-8 w-[250px]" />
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center">
                    <Button variant="outline" className={'rounded-r-none'} onClick={createNewTask}>
                        + Add Task
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                        <Button variant="outline" className={'rounded-l-none border-l-0 px-2'}>
                            <ChevronDown />
                        </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={createNewTask} disabled>Job</DropdownMenuItem>
                            <DropdownMenuItem onClick={createNewTask}>Task</DropdownMenuItem>
                            <DropdownMenuItem onClick={openNewWorkstationDialog}>Workstation</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    </div>
                </div>
                </div>
            </div>
            <NewWorkstationDialog isOpen={isDialogOpen} onClose={closeNewWorkstationDialog} />
        </div>
    );
}