'use client';

import React, { useMemo } from 'react';
import { useAtom } from 'jotai';
import { taskModal } from './utils';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, User2, Tag, Flag, MapPin } from 'lucide-react';
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

interface TimelineViewProps {
  columns: KanbanSectionWithTasks[];
  tasks: Task[];
  boardId: string;
}

interface TimelineGroup {
  date: string;
  tasks: TaskWithRelations[];
  displayDate: string;
}

export function TimelineView({ columns, tasks, boardId }: TimelineViewProps) {
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
          case 'Assignee': {
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
          }

          case 'Tag': {
            const tagNames = task.tags.map(
              (tag) => tag.name?.toLowerCase() || ''
            );
            return operator === 'is'
              ? tagNames.includes(filterValue)
              : !tagNames.includes(filterValue);
          }

          case 'Due date': {
            if (!task.dueDate) return operator === 'is not';
            const dueDate = new Date(task.dueDate).toISOString().split('T')[0];
            return operator === 'is'
              ? dueDate === filterValue
              : dueDate !== filterValue;
          }

          case 'Created by': {
            const creatorName = task.createdBy?.name?.toLowerCase() || '';
            const creatorEmail = task.createdBy?.email?.toLowerCase() || '';
            return operator === 'is'
              ? creatorName === filterValue || creatorEmail === filterValue
              : creatorName !== filterValue && creatorEmail !== filterValue;
          }

          case 'Private': {
            const isPrivate = task.private;
            return operator === 'is'
              ? isPrivate === (filterValue === 'true')
              : isPrivate !== (filterValue === 'true');
          }

          default:
            return true;
        }
      });
    });
  }, [allTasks, filterState.filters]);

  // Group tasks by date and create timeline
  const timelineGroups = useMemo(() => {
    const groups: { [key: string]: TimelineGroup } = {};
    const today = new Date();
    const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneWeekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Add tasks with due dates
    filteredTasks.forEach((task) => {
      const dueDate = task.dueDate ? new Date(task.dueDate) : null;
      let groupKey: string;
      let displayDate: string;

      if (!dueDate) {
        groupKey = 'no-due-date';
        displayDate = 'No Due Date';
      } else if (dueDate < oneWeekAgo) {
        groupKey = 'overdue';
        displayDate = 'Overdue';
      } else if (dueDate < today) {
        groupKey = 'past-due';
        displayDate = 'Past Due';
      } else if (dueDate.toDateString() === today.toDateString()) {
        groupKey = 'today';
        displayDate = 'Today';
      } else if (dueDate < oneWeekFromNow) {
        groupKey = dueDate.toISOString().split('T')[0];
        displayDate = dueDate.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric'
        });
      } else {
        groupKey = dueDate.toISOString().split('T')[0];
        displayDate = dueDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      }

      if (!groups[groupKey]) {
        groups[groupKey] = {
          date: groupKey,
          tasks: [],
          displayDate
        };
      }

      groups[groupKey].tasks.push(task);
    });

    // Sort groups by date
    const sortedGroups = Object.values(groups).sort((a, b) => {
      const dateA =
        a.date === 'overdue' || a.date === 'past-due'
          ? '1900-01-01'
          : a.date === 'today'
            ? new Date().toISOString().split('T')[0]
            : a.date === 'no-due-date'
              ? '9999-12-31'
              : a.date;
      const dateB =
        b.date === 'overdue' || b.date === 'past-due'
          ? '1900-01-01'
          : b.date === 'today'
            ? new Date().toISOString().split('T')[0]
            : b.date === 'no-due-date'
              ? '9999-12-31'
              : b.date;
      return dateA.localeCompare(dateB);
    });

    return sortedGroups;
  }, [filteredTasks]);

  const handleTaskClick = (task: TaskWithRelations) => {
    setActiveTask({
      type: 'edit',
      taskId: task.id,
      kanbanSectionId: task.kanbanSectionId
    });
  };

  const getDateColor = (dateKey: string) => {
    switch (dateKey) {
      case 'overdue':
      case 'past-due':
        return 'border-red-500 bg-red-50';
      case 'today':
        return 'border-blue-500 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="h-5 w-5" />
        <h2 className="text-lg font-semibold">Timeline View</h2>
        <Badge variant="outline">{filteredTasks.length} tasks</Badge>
      </div>

      <div className="space-y-6">
        {timelineGroups.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>No tasks found for the timeline</p>
            </CardContent>
          </Card>
        ) : (
          timelineGroups.map((group) => (
            <div key={group.date} className="relative">
              {/* Timeline date header */}
              <div className="flex items-center gap-4 mb-4">
                <div
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 ${getDateColor(group.date)}`}
                >
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">{group.displayDate}</span>
                  <Badge variant="secondary" className="ml-2">
                    {group.tasks.length}
                  </Badge>
                </div>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              {/* Tasks for this date */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ml-4">
                {group.tasks.map((task) => (
                  <Card
                    key={task.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleTaskClick(task)}
                  >
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-sm font-medium line-clamp-2">
                            {task.name}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground">
                            #{task.taskNumber}
                          </p>
                        </div>
                        <Badge
                          color={PRIORITY_CONFIG[task.priority].color}
                          className="ml-2"
                        >
                          {PRIORITY_CONFIG[task.priority].label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="space-y-2">
                        {/* Status */}
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <Badge variant="outline" className="text-xs">
                            {task.kanbanSection?.name || 'No Status'}
                          </Badge>
                        </div>

                        {/* Tags */}
                        {task.tags.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap">
                            <Tag className="h-3 w-3 text-muted-foreground" />
                            {task.tags.slice(0, 2).map((tag) => (
                              <Badge
                                key={tag.id}
                                color={tag.color}
                                variant="secondary"
                                className="text-xs"
                              >
                                {tag.name}
                              </Badge>
                            ))}
                            {task.tags.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{task.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Assignees */}
                        <div className="flex items-center gap-2">
                          <User2 className="h-3 w-3 text-muted-foreground" />
                          {task.assignees.length > 0 ? (
                            <div className="flex items-center gap-1">
                              <div className="flex -space-x-1">
                                {task.assignees.slice(0, 3).map((assignee) => (
                                  <Avatar
                                    key={assignee.id}
                                    className="h-5 w-5 border-2 border-background"
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
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Unassigned
                            </span>
                          )}
                        </div>

                        {/* Due date detail */}
                        {task.dueDate && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>
                              Due: {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
