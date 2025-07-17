'use client';

import { useState, useEffect } from 'react';
import { Comment } from './comment';
import { CommentInput } from './comment-input';
import { getEntityComments } from '@/lib/comment-utils';
import { CommentableEntityType } from '@prisma/client';

interface CommentsProps {
  entityType: CommentableEntityType;
  entityId: string;
  entityUrl?: string;
  className?: string;
}

export function Comments({
  entityType,
  entityId,
  entityUrl,
  className = ''
}: CommentsProps) {
  const [comments, setComments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadComments = async () => {
    try {
      const result = await getEntityComments(entityType, entityId);
      if (result.success) {
        setComments(result.data || []);
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [entityType, entityId]);

  const handleCommentCreated = () => {
    loadComments();
  };

  return (
    <div className={`h-full flex flex-col ${className}`}>
      <div className="flex-1 flex flex-col justify-between min-h-0">
        <div className="overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="text-muted-foreground">Loading comments...</div>
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <p>No comments yet</p>
              <p className="text-sm">Be the first to add a comment</p>
            </div>
          ) : (
            comments.map((comment) => (
              <Comment
                key={comment.id}
                comment={comment}
                onUpdate={loadComments}
              />
            ))
          )}
        </div>

        <div className="p-4">
          <CommentInput
            entityType={entityType}
            entityId={entityId}
            entityUrl={entityUrl}
            onCommentCreated={handleCommentCreated}
          />
        </div>
      </div>
    </div>
  );
}
