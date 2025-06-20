'use client';

import { useState, useEffect, useRef } from 'react';
import { Check, ChevronsUpDown, Search, X } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { User } from '@prisma/client';

/**
 * Props for the UserSelect component
 */
export interface UserSelectProps {
  /** Array of users to select from */
  users: User[];
  /** Selected user(s) */
  value: string | string[];
  /** Handler for when selection changes */
  onChange: (value: string | string[]) => void;
  /** Whether multiple users can be selected */
  multiSelect?: boolean;
  /** Optional placeholder text */
  placeholder?: string;
  /** Optional className for styling */
  className?: string;
  /** Optional maximum height for the dropdown */
  maxHeight?: number;
  /** Optional disabled state */
  disabled?: boolean;
}

/**
 * A reusable component for selecting users without requiring a form context
 */
const UserSelect = ({
  users,
  value,
  onChange,
  multiSelect = false,
  placeholder = 'Select user...',
  className,
  maxHeight = 200,
  disabled = false
}: UserSelectProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Convert value to array for consistent handling
  const selectedIds = Array.isArray(value) ? value : value ? [value] : [];

  // Get the selected users by matching IDs
  const selectedUsers = selectedIds
    .map((id) => users.find((user) => user.id === id))
    .filter(Boolean) as User[];

  // Filter users based on search query
  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Focus the search input when popover opens
  useEffect(() => {
    if (open && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 0);
    } else {
      setSearchQuery('');
    }
  }, [open]);

  // Handle selection/deselection of a user
  const handleSelect = (userId: string) => {
    if (multiSelect) {
      const newValue = selectedIds.includes(userId)
        ? selectedIds.filter((id) => id !== userId)
        : [...selectedIds, userId];
      onChange(newValue);
    } else {
      onChange(selectedIds.includes(userId) ? '' : userId);
      setOpen(false);
    }
  };

  // Handle removing a selected user
  const handleRemove = (userId: string, e?: React.SyntheticEvent) => {
    e?.stopPropagation();

    if (multiSelect) {
      onChange(selectedIds.filter((id) => id !== userId));
    } else {
      onChange('');
    }
  };

  return (
    <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full justify-between',
            selectedUsers.length === 0 && 'text-muted-foreground',
            className
          )}
        >
          <div className="flex flex-wrap gap-1 items-center">
            {selectedUsers.length > 0 ? (
              <ScrollArea className="max-w-full" type="scroll">
                <div className="flex flex-wrap gap-1">
                  {selectedUsers.map((user) => (
                    <Badge
                      variant="secondary"
                      key={user.id}
                      className="flex items-center gap-1 pr-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Avatar className="h-4 w-4">
                        <AvatarImage src={user.image || ''} />
                        <AvatarFallback>{user.name?.[0]}</AvatarFallback>
                      </Avatar>
                      <span className="max-w-[100px] truncate">
                        {user.name}
                      </span>
                      {!disabled && (
                        <div
                          role="button"
                          tabIndex={0}
                          className="h-4 w-4 p-0 inline-flex items-center justify-center cursor-pointer rounded-sm hover:bg-muted/50"
                          onClick={(e) => handleRemove(user.id, e)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleRemove(user.id);
                            }
                          }}
                        >
                          <X className="h-3 w-3" />
                          <span className="sr-only">Remove {user.name}</span>
                        </div>
                      )}
                    </Badge>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <span>{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 mr-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-full p-0"
        style={{ width: 'var(--radix-popover-trigger-width)' }}
      >
        <div className="flex items-center border-b px-3 py-1">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <input
            ref={searchInputRef}
            placeholder="Search users..."
            className="flex h-8 w-full rounded-md border-0 bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <ScrollArea
          className={`overflow-y-auto ${maxHeight ? `max-h-[${maxHeight}px]` : ''}`}
        >
          {filteredUsers.length > 0 ? (
            <div className="py-2">
              {filteredUsers.map((user) => {
                const isSelected = selectedIds.includes(user.id);

                return (
                  <div
                    key={user.id}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1 cursor-pointer hover:bg-accent',
                      isSelected && 'bg-accent/50'
                    )}
                    onClick={() => handleSelect(user.id)}
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={user.image || ''} />
                      <AvatarFallback>{user.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <span className="flex-1 truncate text-sm">{user.name}</span>
                    <Check
                      className={cn(
                        'ml-auto h-4 w-4',
                        isSelected ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-sm text-muted-foreground">
              No users found
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export { UserSelect };
