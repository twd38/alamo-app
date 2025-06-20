'use client';

import { useState } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { ChevronDownIcon, PlusIcon, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Board, User, Prisma } from '@prisma/client';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import CreateBoardDialog from './create-board-dialog';
import EditBoardDialog from './edit-board-dialog';
import { ConfirmDeleteAlert } from '@/components/confirm-delete-alert';
import { deleteBoard } from '@/lib/actions';
import { useRouter } from 'next/navigation';
import { UserAccessList } from '@/components/user-access-list';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

type BoardWithRelations = Board & {
  createdBy: User;
  collaborators: User[];
};

type TopBarProps = {
  activeBoard: BoardWithRelations | 'my-tasks';
  boards: BoardWithRelations[];
};

const BoardsTopBar = ({ activeBoard, boards }: TopBarProps) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const isMyTasks = activeBoard === 'my-tasks';

  const boardId = isMyTasks ? 'my-tasks' : activeBoard.id;
  const creator = isMyTasks ? null : activeBoard.createdBy;
  const collaborators = isMyTasks ? [] : activeBoard.collaborators;
  const isPrivate = isMyTasks ? true : activeBoard.private;
  const icon = isMyTasks ? '📚' : activeBoard.icon;
  const name = isMyTasks ? 'My Tasks' : activeBoard.name;

  const privateBoards = boards
    .filter((board) => board.private)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const publicBoards = boards
    .filter((board) => !board.private)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  const onClose = () => {
    setIsOpen(false);
  };

  const handleDeleteBoard = async () => {
    const result = await deleteBoard(boardId);
    if (result.success) {
      router.push('/');
    }
  };

  return (
    <div className="sticky top-0 z-10 h-12 border-b p-4 bg-white dark:bg-gray-900 flex items-center justify-between gap-2 shrink-0 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="h-4" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="gap-2 focus-visible:ring-0 px-2 max-h-8"
            >
              {icon && <span className="text-lg">{icon}</span>}
              {name} <ChevronDownIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            side="bottom"
            sideOffset={4}
            className="w-56"
          >
            <DropdownMenuItem>
              <Link href="/board/my-tasks">
                <span className="mr-2">📚</span>
                My Tasks
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Public
            </DropdownMenuLabel>
            <DropdownMenuGroup>
              {publicBoards.map((board) => (
                <DropdownMenuItem key={board.id} asChild>
                  <Link href={`/board/${board.id}`}>
                    {board.icon && <span className="mr-2">{board.icon}</span>}
                    {board.name}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Private
            </DropdownMenuLabel>
            <DropdownMenuGroup>
              {privateBoards.length > 0 ? (
                privateBoards.map((board) => (
                  <DropdownMenuItem key={board.id} asChild>
                    <Link href={`/board/${board.id}`}>
                      {board.icon && <span className="mr-1">{board.icon}</span>}
                      {board.name}
                    </Link>
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem className="text-xs text-muted-foreground">
                  No private boards
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="text-muted-foreground"
              onClick={() => setIsOpen(true)}
            >
              <PlusIcon className="h-4 w-4 p-0.5 mr-2 ring-1 ring-current text-primary rounded-sm" />
              Create board
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex items-center gap-2">
        {creator && collaborators && (
          <UserAccessList
            users={[creator, ...(collaborators || [])]}
            isPublic={!isPrivate}
          />
        )}
        {!isMyTasks && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setIsEditOpen(true)}>
                Edit board
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => setIsDeleteOpen(true)}
                className="text-red-600"
              >
                Archive board
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <CreateBoardDialog isOpen={isOpen} onClose={onClose} />
      <EditBoardDialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        boardId={boardId}
        boardName={name}
        isPrivate={isPrivate}
        collaboratorIds={collaborators.map((c) => c.id)}
        icon={icon || undefined}
      />
      <ConfirmDeleteAlert
        isOpen={isDeleteOpen}
        onCloseAction={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteBoard}
        resourceName="board"
        confirmName={name}
      />
    </div>
  );
};

export { BoardsTopBar };
