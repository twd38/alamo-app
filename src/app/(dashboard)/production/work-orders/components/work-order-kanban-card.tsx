'use client';

import { Draggable } from '@hello-pangea/dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Calendar, MoreHorizontal, Package } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { deleteWorkOrder } from '@/lib/actions';
import { UserAvatarList } from '@/components/ui/user-avatar-list';
import type { WorkOrderKanbanItem } from '../queries/getWorkOrdersKanban';

interface WorkOrderKanbanCardProps {
  workOrder: WorkOrderKanbanItem;
  index: number;
  onArchive?: () => void;
}

export function WorkOrderKanbanCard({
  workOrder,
  index,
  onArchive
}: WorkOrderKanbanCardProps) {
  const dueDateLabel = workOrder.dueDate
    ? format(new Date(workOrder.dueDate), 'MMM d')
    : 'No due date';

  const assignees =
    workOrder.assignees?.map((assignee) => assignee.user).filter(Boolean) || [];
  const tags = workOrder.tags || [];

  const handleArchive = async () => {
    if (typeof window === 'undefined') return;
    const confirmed = window.confirm(
      `Archive work order ${workOrder.workOrderNumber}?`
    );
    if (!confirmed) return;

    const result = await deleteWorkOrder(workOrder.id);
    if (result.success) {
      toast.success('Work order archived');
      onArchive?.();
    } else {
      toast.error(result.error || 'Failed to archive work order');
    }
  };

  return (
    <Draggable draggableId={workOrder.id} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            ...provided.draggableProps.style,
            opacity: snapshot.isDragging ? 0.6 : 1
          }}
          className="w-full cursor-grab border border-border/60 shadow-sm active:cursor-grabbing"
        >
          <CardContent className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  WO #{workOrder.workOrderNumber}
                </p>
                <Link
                  href={`/production/${workOrder.id}`}
                  className="block text-sm font-semibold leading-snug text-primary hover:underline"
                  onClick={(event) => event.stopPropagation()}
                >
                  {workOrder.part?.name ||
                    workOrder.part?.partNumber ||
                    'Untitled part'}
                </Link>
              </div>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 p-0"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/production/${workOrder.id}/edit`}>
                        Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleArchive();
                      }}
                    >
                      Archive
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>{dueDateLabel}</span>
              </div>
              <div className="flex items-center gap-1">
                <Package className="h-3.5 w-3.5" />
                <span>{workOrder.part?.partNumber || '—'}</span>
              </div>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tags.slice(0, 3).map((tag) => (
                  <Badge key={tag.id} variant="secondary" className="text-xs">
                    {tag.name}
                  </Badge>
                ))}
                {tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{tags.length - 3}
                  </Badge>
                )}
              </div>
            )}

            <div className="flex items-center">
              {assignees.length > 0 ? (
                <UserAvatarList users={assignees} maxVisible={3} />
              ) : (
                <span className="text-xs text-muted-foreground">
                  Unassigned
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </Draggable>
  );
}
