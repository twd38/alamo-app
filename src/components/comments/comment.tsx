'use client';

import { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ThumbsUp, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { updateComment, deleteComment } from '@/lib/comment-utils';
import { useUser } from '@/hooks/use-user';
import { CommentFilesDisplay } from './comment-file-upload';

interface CommentProps {
  comment: {
    id: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    author: {
      id: string;
      name: string;
      email: string;
      image: string | null;
    };
    files?: Array<{
      id: string;
      name: string;
      size: number;
      type: string;
      url: string;
    }>;
  };
  onUpdate?: () => void;
}

export function Comment({ comment, onUpdate }: CommentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUser();

  const isAuthor = user?.id === comment.author.id;
  const timeAgo = formatDistanceToNow(new Date(comment.createdAt), {
    addSuffix: true
  });

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;

    setIsLoading(true);
    try {
      const result = await updateComment(comment.id, { content: editContent });
      if (result.success) {
        setIsEditing(false);
        onUpdate?.();
      }
    } catch (error) {
      console.error('Failed to update comment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    setIsLoading(true);
    try {
      const result = await deleteComment(comment.id);
      if (result.success) {
        onUpdate?.();
      }
    } catch (error) {
      console.error('Failed to delete comment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditContent(comment.content);
    setIsEditing(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex gap-2">
      <Avatar className="h-6 w-6 mt-0.5 flex-shrink-0">
        <AvatarImage
          src={comment.author.image || ''}
          alt={comment.author.name}
        />
        <AvatarFallback className="text-xs">
          {getInitials(comment.author.name)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{comment.author.name}</span>
            <span className="text-xs text-muted-foreground">
              {timeAgo}
              {comment.updatedAt > comment.createdAt && ' (edited)'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {isAuthor && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Edit className="h-3 w-3 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-destructive"
                  >
                    <Trash2 className="h-3 w-3 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[60px] resize-none"
              placeholder="Write a comment..."
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSaveEdit}
                disabled={isLoading || !editContent.trim()}
              >
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancelEdit}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div
              className="text-sm text-foreground prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: comment.content }}
            />
            {comment.files && comment.files.length > 0 && (
              <CommentFilesDisplay files={comment.files} className="mt-2" />
            )}
          </>
        )}
      </div>
    </div>
  );
}
