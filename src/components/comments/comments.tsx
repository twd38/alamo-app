'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();

  const {
    data: commentsResult,
    isLoading,
    error
  } = useQuery({
    queryKey: ['comments', entityType, entityId],
    queryFn: () => getEntityComments(entityType, entityId)
  });

  const comments = commentsResult?.success ? commentsResult.data || [] : [];

  const handleCommentCreated = () => {
    queryClient.invalidateQueries({
      queryKey: ['comments', entityType, entityId]
    });
  };

  return (
    <div className={`h-full flex flex-col ${className}`}>
      <div className="flex-1 flex flex-col justify-between min-h-0">
        <div className="overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="text-muted-foreground">Loading comments...</div>
            </div>
          ) : error ? (
            <div className="flex justify-center py-8">
              <div className="text-destructive">Failed to load comments</div>
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
                onUpdate={handleCommentCreated}
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
