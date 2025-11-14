'use client';

import { useState, useEffect, useRef } from 'react';
import { Check, ChevronsUpDown, Search, X, PlusCircle } from 'lucide-react';
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
import { WorkOrderTag } from '@prisma/client';

/**
 * Props for the TagSelect component
 */
export interface TagSelectProps {
  /** Array of tags to select from */
  tags: WorkOrderTag[];
  /** Selected tag IDs */
  value: string[];
  /** Handler for when selection changes */
  onChange: (value: string[]) => void;
  /** Optional placeholder text */
  placeholder?: string;
  /** Optional className for styling */
  className?: string;
  /** Optional maximum height for the dropdown */
  maxHeight?: number;
  /** Optional disabled state */
  disabled?: boolean;
  /** Optional callback for creating new tags */
  onCreateTag?: (name: string) => Promise<WorkOrderTag>;
}

/**
 * A reusable component for selecting tags without requiring a form context
 */
export function TagSelect({
  tags,
  value,
  onChange,
  placeholder = 'Select or create tags...',
  className,
  maxHeight = 200,
  disabled = false,
  onCreateTag
}: TagSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Get the selected tags by matching IDs
  const selectedTags = value
    .map((id) => tags.find((tag) => tag.id === id))
    .filter(Boolean) as WorkOrderTag[];

  // Filter tags based on search query
  const filteredTags = tags.filter((tag) =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Check if we can create a new tag
  const canCreate =
    onCreateTag &&
    searchQuery.trim() !== '' &&
    !tags.some(
      (tag) => tag.name.toLowerCase() === searchQuery.toLowerCase()
    ) &&
    !isCreating;

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

  // Handle selection/deselection of a tag
  const handleSelect = (tagId: string) => {
    const newValue = value.includes(tagId)
      ? value.filter((id) => id !== tagId)
      : [...value, tagId];
    onChange(newValue);
  };

  // Handle removing a selected tag
  const handleRemove = (tagId: string, e?: React.SyntheticEvent) => {
    e?.stopPropagation();
    onChange(value.filter((id) => id !== tagId));
  };

  // Handle creating a new tag
  const handleCreate = async () => {
    if (!onCreateTag || !canCreate) return;

    try {
      setIsCreating(true);
      const newTag = await onCreateTag(searchQuery.trim());
      onChange([...value, newTag.id]);
      setSearchQuery('');
    } catch (error) {
      console.error('Error creating tag:', error);
    } finally {
      setIsCreating(false);
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
            'w-full justify-start min-h-[32px] h-auto',
            selectedTags.length === 0 && 'text-muted-foreground',
            className
          )}
        >
          <div className="flex gap-1 flex-wrap w-full">
            {selectedTags.length > 0 ? (
              selectedTags.map((tag) => (
                <Badge
                  key={tag.id}
                  color={tag.color}
                  variant="secondary"
                  className="text-xs"
                >
                  {tag.name}
                  <button
                    className="ml-1 rounded-sm hover:bg-secondary/80"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRemove(tag.id, e);
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={(e) => handleRemove(tag.id, e)}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input
            ref={searchInputRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tags..."
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
        <ScrollArea style={{ maxHeight: `${maxHeight}px` }}>
          <div className="p-1">
            {filteredTags.length === 0 && !canCreate ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No tags found.
              </div>
            ) : (
              <>
                {filteredTags.map((tag) => {
                  const isSelected = value.includes(tag.id);
                  return (
                    <div
                      key={tag.id}
                      className={cn(
                        'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none',
                        'hover:bg-accent hover:text-accent-foreground',
                        isSelected && 'bg-accent'
                      )}
                      onClick={() => handleSelect(tag.id)}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          isSelected ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <Badge color={tag.color} variant="secondary" className="text-xs">
                        {tag.name}
                      </Badge>
                    </div>
                  );
                })}
                {canCreate && (
                  <div
                    className={cn(
                      'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none',
                      'hover:bg-accent hover:text-accent-foreground',
                      isCreating && 'opacity-50'
                    )}
                    onClick={handleCreate}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create "{searchQuery}"
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

