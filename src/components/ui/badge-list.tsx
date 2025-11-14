import * as React from 'react';
import { Badge } from './badge';
import { cn } from '@/lib/utils';
import { WorkOrderTag } from '@prisma/client';

export interface BadgeListItem {
  id: string;
  name: string;
  color?: string;
}

export interface BadgeListProps {
  badges?: (BadgeListItem | WorkOrderTag)[];
  className?: string;
  maxVisible?: number;
  variant?: 'default' | 'secondary' | 'outline';
}

export function BadgeList({
  badges,
  className,
  maxVisible,
  variant = 'secondary'
}: BadgeListProps) {
  // Support both 'tags' and 'badges' props for flexibility
  const items = badges || [];

  if (!items || items.length === 0) {
    return (
      <span className={cn('text-sm text-muted-foreground', className)}>—</span>
    );
  }

  const visibleItems = maxVisible ? items.slice(0, maxVisible) : items;
  const remainingCount =
    maxVisible && items.length > maxVisible ? items.length - maxVisible : 0;

  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {visibleItems.map((item) => {
        // Handle both BadgeListItem and WorkOrderTag objects
        const name = item.name;
        const color = item.color;
        return (
          <Badge
            key={item.id}
            color={color as any}
            variant={variant}
            className="text-xs"
          >
            {name}
          </Badge>
        );
      })}
      {remainingCount > 0 && (
        <Badge variant={variant} className="text-xs">
          +{remainingCount}
        </Badge>
      )}
    </div>
  );
}
