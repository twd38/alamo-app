'use client';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader } from 'src/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from 'src/components/ui/avatar';
import { Calendar, User2, Tag, Flag } from 'lucide-react';
import { Badge } from 'src/components/ui/badge';
import { Prisma } from '@prisma/client';
import { useAtom } from 'jotai';
import { taskModal } from './utils';
import { PRIORITY_CONFIG } from '@/lib/constants/priority';

type TaskWithRelations = Prisma.TaskGetPayload<{
  include: {
    assignees: true;
    createdBy: true;
    files: true;
    tags: true;
  };
}>;

export function TaskCard({ task }: { task: TaskWithRelations }) {
  const [_, setActiveTask] = useAtom(taskModal);

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: task.id
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  if (!task) return null;

  const handleClick = (e: React.MouseEvent) => {
    // Prevent click when dragging
    if (transform) return;

    // Don't open task detail if clicking the menu button
    if ((e.target as HTMLElement).closest('button')) return;

    setActiveTask({
      type: 'edit',
      taskId: task.id,
      kanbanSectionId: task.kanbanSectionId
    });
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="cursor-pointer"
      onClick={handleClick}
    >
      <CardHeader className="p-4 flex flex-row justify-between items-start">
        <h3 className="font-semibold overflow-hidden text-ellipsis whitespace-nowrap">
          {task.name}
        </h3>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-1">
            <Flag className="h-4 w-4 mr-1" />
            <Badge color={PRIORITY_CONFIG[task.priority].color}>
              {PRIORITY_CONFIG[task.priority].label}
            </Badge>
          </div>

          <div className="flex items-center gap-1">
            <Tag className="h-4 w-4 mr-1" />
            {task.tags.map((tag) => (
              <Badge key={tag.id} color={tag.color}>
                {tag.name}
              </Badge>
            ))}
          </div>

          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            <span>{task.dueDate.toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <User2 className="h-4 w-4 mr-1" />
            {task.assignees.length > 0 ? (
              <>
                <div className="flex -space-x-2">
                  {task.assignees.map((assignee) => (
                    <Avatar
                      key={assignee.id}
                      className="h-6 w-6 border-2 border-background"
                    >
                      <AvatarImage src={assignee.image || ''} />
                      <AvatarFallback>{assignee.name?.[0]}</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <span className="text-muted-foreground">
                  {task.assignees.length === 1
                    ? task.assignees[0].name
                    : `${task.assignees.length} assignees`}
                </span>
              </>
            ) : (
              <>
                <Avatar className="h-6 w-6">
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <span className="text-muted-foreground">Unassigned</span>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
