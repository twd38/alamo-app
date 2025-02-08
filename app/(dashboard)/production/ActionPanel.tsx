'use client'
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input"
import { ChevronDown } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Filter, Search } from "lucide-react"
import NewWorkstationDialog from './NewWorkstationDialog';
import { useRouter } from 'next/navigation'


export function ActionPanel() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const router = useRouter();

    const openNewWorkstationDialog = () => {
      setIsDialogOpen(true);
    };
  
    const closeNewWorkstationDialog = () => {
      setIsDialogOpen(false);
    };

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
                    <Button variant="outline" className={'rounded-r-none'} >
                        + Add Job
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                        <Button variant="outline" className={'rounded-l-none border-l-0 px-2'}>
                            <ChevronDown />
                        </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                        <DropdownMenuItem>Job</DropdownMenuItem>
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