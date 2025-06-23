'use client';

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow, format } from 'date-fns';

interface ActivityItemProps {
  activity: {
    id: string;
    action: string;
    createdAt: Date;
    user: {
      id: string;
      name: string;
      email: string;
      image: string | null;
    };
  };
}

export function ActivityItem({ activity }: ActivityItemProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const timeAgo = formatDistanceToNow(new Date(activity.createdAt), {
    addSuffix: true
  });
  const formattedDate = format(new Date(activity.createdAt), 'MMM d');

  return (
    <div className="flex gap-3 py-2">
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={activity.user.image || ''} alt={activity.user.name} />
        <AvatarFallback className="text-xs">
          {getInitials(activity.user.name)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">
            {activity.user.name}
          </span>{' '}
          {activity.action}
          {' • '}
          <span title={timeAgo}>{formattedDate}</span>
        </div>
      </div>
    </div>
  );
}
