"use client"

import { useState } from "react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { ChevronDownIcon, PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Board, User, Prisma } from "@prisma/client"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import CreateBoardDialog from "./create-board"
import { UserAccessList } from "@/components/user-access-list"

type BoardWithRelations = Prisma.BoardGetPayload<{
    include: {
        createdBy: true;
        collaborators: true;
    }
}>

type TopBarProps = {
    activeBoard: BoardWithRelations;
    boards: BoardWithRelations[];
}

const BoardsTopBar = ({ activeBoard, boards}: TopBarProps) => {
    console.log(activeBoard)
    const [isOpen, setIsOpen] = useState(false);
    const creator = activeBoard.createdBy
    const collaborators = activeBoard.collaborators
    const isPublic = !activeBoard.private
    const privateBoards = boards.filter((board) => board.private).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    const publicBoards = boards.filter((board) => !board.private).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())

    const onClose = () => {
        setIsOpen(false);
    }
    
    
    return (
        <div className="sticky top-0 z-10 h-12 border-b p-4 bg-white dark:bg-gray-900 flex items-center justify-between gap-2 shrink-0 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="h-4" />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="gap-2 focus-visible:ring-0 px-2 max-h-8">
                            {activeBoard.name} <ChevronDownIcon className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                        align="start"
                        side="bottom"
                        sideOffset={4}
                        className="w-56"
                    >
                        <DropdownMenuLabel className="text-xs text-muted-foreground">Private</DropdownMenuLabel>
                        <DropdownMenuGroup>
                            {
                                privateBoards.length > 0 ? privateBoards.map((board) => (
                                    <DropdownMenuItem key={board.id} asChild>
                                        <Link href={`/board/${board.id}`}>
                                        {board.name}
                                        </Link>
                                    </DropdownMenuItem>
                                )) : (
                                    <DropdownMenuItem className="text-xs text-muted-foreground">No private boards</DropdownMenuItem>
                                )
                            }
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-xs text-muted-foreground">Public</DropdownMenuLabel>
                        <DropdownMenuGroup>
                            {
                                publicBoards.map((board) => (
                                    <DropdownMenuItem key={board.id} asChild>
                                        <Link href={`/board/${board.id}`}>
                                        {board.name}
                                        </Link>
                                    </DropdownMenuItem>
                                ))
                            }
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-muted-foreground" onClick={() => setIsOpen(true)}>
                            <PlusIcon className="h-4 w-4 p-0.5 mr-2 ring-1 ring-current text-primary rounded-sm" />
                            Create board
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            {creator && collaborators && <UserAccessList users={[creator, ...(collaborators || [])]} isPublic={isPublic} />}    
            <CreateBoardDialog isOpen={isOpen} onClose={onClose} />
        </div>
    )
}

export { BoardsTopBar };