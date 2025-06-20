import type React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { Globe } from 'lucide-react';

export interface User {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}

interface UserAccessListProps {
  users: User[];
  maxVisible?: number;
  overlapAmount?: number;
  isPublic?: boolean;
}

export function UserAccessList({
  users,
  maxVisible = 3,
  overlapAmount = 8,
  isPublic = false
}: UserAccessListProps) {
  const visibleUsers = users.slice(0, maxVisible);
  const remainingCount = users.length - maxVisible;

  return (
    <TooltipProvider>
      <div className="flex items-center">
        {isPublic ? (
          <Tooltip key="public">
            <TooltipTrigger asChild>
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 ">
                <Globe className="h-4 w-4" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="font-medium">Public</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <div
            className="flex -space-x-[var(--overlap-amount)] items-center"
            style={
              {
                '--overlap-amount': `${overlapAmount}px`
              } as React.CSSProperties
            }
          >
            {visibleUsers.map((user) => (
              <Tooltip key={user.id}>
                <TooltipTrigger asChild>
                  <div className="relative rounded-full border-2 border-background transition-transform hover:translate-y-[-3px] hover:z-10">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={user.image || ''} />
                      <AvatarFallback>{user.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <span className="sr-only">{user.name}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </TooltipContent>
              </Tooltip>
            ))}

            {remainingCount > 0 && (
              <div className="relative z-10 flex h-7 w-7 border-2 border-background items-center justify-center rounded-full bg-muted text-muted-foreground text-xs">
                +{remainingCount}
              </div>
            )}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
