'use client';

import React, { useMemo } from 'react';
import { useAtom } from 'jotai';
import { taskModal } from './utils';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Calendar, User2, Tag, Flag, FileText } from 'lucide-react';
import { PRIORITY_CONFIG } from '@/lib/constants/priority';
import { useFilterAtom } from '@/components/filter-popover';
import { useQueryStates, parseAsString } from 'nuqs';
import type { KanbanSection, Task, User, TaskTag } from '@prisma/client';

type TaskWithRelations = Task & {
  assignees: User[];
  createdBy: User;
  files: any[];
  tags: TaskTag[];
  kanbanSection: KanbanSection | null;
};

type KanbanSectionWithTasks = KanbanSection & {
  tasks: TaskWithRelations[];
};

interface ListViewProps {
  columns: KanbanSectionWithTasks[];
  tasks: Task[];
  boardId: string;
}

export function ListView({ columns, tasks, boardId }: ListViewProps) {
  const [_, setActiveTask] = useAtom(taskModal);
  const [filterState] = useFilterAtom('kanban-board');
  const [{ sort: sortKey, dir: sortDir }] = useQueryStates({
    sort: parseAsString.withDefault(''),
    dir: parseAsString.withDefault('desc')
  });

  // Flatten all tasks from columns
  const allTasks = useMemo(() => {
    return columns.flatMap((column) =>
      column.tasks.map((task) => ({
        ...task,
        kanbanSection: column
      }))
    );
  }, [columns]);

  // Apply filters to tasks
  const filteredTasks = useMemo(() => {
    if (!filterState.filters || filterState.filters.length === 0) {
      return allTasks;
    }

    return allTasks.filter((task) => {
      return filterState.filters.every((filter) => {
        const { type, operator, value } = filter;

        if (!value.trim()) return true;

        const filterValue = value.toLowerCase().trim();

        switch (type) {
          case 'Assignee':
            const assigneeIds = task.assignees.map(
              (u) => u.id?.toLowerCase() || ''
            );
            const assigneeNames = task.assignees.map(
              (u) => u.name?.toLowerCase() || ''
            );
            return operator === 'is'
              ? assigneeIds.includes(filterValue) ||
                  assigneeNames.includes(filterValue)
              : !assigneeIds.includes(filterValue) &&
                  !assigneeNames.includes(filterValue);

          case 'Tag':
            const tagNames = task.tags.map(
              (tag) => tag.name?.toLowerCase() || ''
            );
            return operator === 'is'
              ? tagNames.includes(filterValue)
              : !tagNames.includes(filterValue);

          case 'Due date':
            if (!task.dueDate) return operator === 'is not';
            const dueDate = new Date(task.dueDate).toISOString().split('T')[0];
            return operator === 'is'
              ? dueDate === filterValue
              : dueDate !== filterValue;

          case 'Created by':
            const creatorName = task.createdBy?.name?.toLowerCase() || '';
            const creatorEmail = task.createdBy?.email?.toLowerCase() || '';
            return operator === 'is'
              ? creatorName === filterValue || creatorEmail === filterValue
              : creatorName !== filterValue && creatorEmail !== filterValue;

          case 'Private':
            const isPrivate = task.private;
            return operator === 'is'
              ? isPrivate === (filterValue === 'true')
              : isPrivate !== (filterValue === 'true');

          default:
            return true;
        }
      });
    });
  }, [allTasks, filterState.filters]);

  // Apply sorting
  const sortedTasks = useMemo(() => {
    if (!sortKey) return filteredTasks;

    return [...filteredTasks].sort((a, b) => {
      let aVal: any, bVal: any;

      switch (sortKey) {
        case 'priority':
          aVal = a.priority;
          bVal = b.priority;
          break;
        case 'due_date':
          aVal = a.dueDate ? new Date(a.dueDate).getTime() : 0;
          bVal = b.dueDate ? new Date(b.dueDate).getTime() : 0;
          break;
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        default:
          return 0;
      }

      if (sortDir === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });
  }, [filteredTasks, sortKey, sortDir]);

  const handleTaskClick = (task: TaskWithRelations) => {
    setActiveTask({
      type: 'edit',
      taskId: task.id,
      kanbanSectionId: task.kanbanSectionId
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          List View ({sortedTasks.length} tasks)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Task</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Assignees</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTasks.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No tasks found
                  </TableCell>
                </TableRow>
              ) : (
                sortedTasks.map((task) => (
                  <TableRow
                    key={task.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleTaskClick(task)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold">{task.name}</span>
                        <span className="text-sm text-muted-foreground">
                          #{task.taskNumber}
                        </span>
                        {task.description && (
                          <span className="text-xs text-muted-foreground line-clamp-2">
                            {task.description}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {task.kanbanSection?.name || 'No Status'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge color={PRIORITY_CONFIG[task.priority].color}>
                        {PRIORITY_CONFIG[task.priority].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {task.assignees.length > 0 ? (
                          <>
                            <div className="flex -space-x-2">
                              {task.assignees.slice(0, 3).map((assignee) => (
                                <Avatar
                                  key={assignee.id}
                                  className="h-6 w-6 border-2 border-background"
                                >
                                  <AvatarImage src={assignee.image || ''} />
                                  <AvatarFallback className="text-xs">
                                    {assignee.name?.[0]}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                            </div>
                            {task.assignees.length > 3 && (
                              <span className="text-xs text-muted-foreground">
                                +{task.assignees.length - 3}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            Unassigned
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {task.tags.map((tag) => (
                          <Badge
                            key={tag.id}
                            color={tag.color}
                            variant="secondary"
                          >
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {task.dueDate ? (
                        <span className="text-sm">
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          No due date
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={task.createdBy.image || ''} />
                          <AvatarFallback className="text-xs">
                            {task.createdBy.name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{task.createdBy.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTaskClick(task);
                        }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
