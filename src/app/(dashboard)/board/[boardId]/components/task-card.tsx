'use client';
import { Draggable } from '@hello-pangea/dnd';
import { Card, CardContent } from 'src/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from 'src/components/ui/avatar';
import { Calendar } from 'lucide-react';
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

export function TaskCard({
  task,
  index
}: {
  task: TaskWithRelations;
  index: number;
}) {
  const [_, setActiveTask] = useAtom(taskModal);

  if (!task) return null;

  const handleClick = (e: React.MouseEvent) => {
    // Don't open task detail if clicking the menu button
    if ((e.target as HTMLElement).closest('button')) return;

    setActiveTask({
      type: 'edit',
      taskId: task.id,
      kanbanSectionId: task.kanbanSectionId
    });
  };

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            ...provided.draggableProps.style,
            opacity: snapshot.isDragging ? 0.5 : 1
          }}
          className="cursor-pointer"
          onClick={handleClick}
        >
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* Title */}
              <h3 className="font-medium text-wrap">{task.name}</h3>

              {/* Bottom section with date, priority and assignees */}
              <div className="space-y-3">
                {/* Left side: Date and Priority */}
                <div className="flex items-center justify-between">
                  {/* Date */}
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-1.5" />
                    <span>
                      {task.dueDate.toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>

                  {/* Right side: Assignees */}
                  <div className="flex -space-x-3 align-top">
                    {task.assignees.length > 0 ? (
                      task.assignees.map((assignee) => (
                        <Avatar
                          key={assignee.id}
                          className="h-7 w-7 border-2 border-background"
                        >
                          <AvatarImage src={assignee.image || ''} />
                          <AvatarFallback className="text-xs">
                            {assignee.name
                              ?.split(' ')
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ))
                    ) : (
                      <></>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Priority Badge */}
                  <Badge
                    variant={task.priority === 0 ? 'secondary' : 'default'}
                    className={
                      task.priority === 0
                        ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                        : task.priority === 1
                          ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                          : task.priority === 2
                            ? 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                            : 'bg-red-50 text-red-700 hover:bg-red-100'
                    }
                  >
                    {PRIORITY_CONFIG[task.priority].label}
                  </Badge>

                  {/* Tags */}
                  <div className="flex -space-x-2 align-top">
                    {task.tags.map((tag) => (
                      <Badge key={tag.id} color={tag.color}>
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </Draggable>
  );
}
