'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TipTapTextEditor } from '@/components/ui/tiptap-text-editor';
import { useUser } from '@/hooks/use-user';
import { createComment } from '@/lib/comment-actions';
import { CommentableEntityType } from '@prisma/client';
import { CommentFileUpload, type CommentFile } from './comment-file-upload';
import { Paperclip } from 'lucide-react';

interface CommentInputProps {
  entityType: CommentableEntityType;
  entityId: string;
  placeholder?: string;
  onCommentCreated?: () => void;
  className?: string;
}

export function CommentInput({
  entityType,
  entityId,
  placeholder = 'Write a comment...',
  onCommentCreated,
  className = ''
}: CommentInputProps) {
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<CommentFile[]>([]);
  const [key, setKey] = useState(0); // Force re-render to clear editor
  const [isLoading, setIsLoading] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const { user } = useUser();

  // Helper to check if content is empty (handles HTML content)
  const isContentEmpty = (htmlContent: string) => {
    if (!htmlContent || htmlContent.trim() === '') return true;
    // Remove HTML tags and check if there's actual text content
    const textContent = htmlContent.replace(/<[^>]*>/g, '').trim();
    return textContent === '';
  };

  const handleSubmit = async () => {
    if ((isContentEmpty(content) && files.length === 0) || isLoading) return;

    setIsLoading(true);
    try {
      // Convert CommentFile objects to File objects for API
      const filesToUpload = files
        .filter((f) => f.file instanceof File)
        .map((f) => f.file!);

      const result = await createComment({
        content: content.trim(),
        entityType,
        entityId,
        files: filesToUpload
      });

      if (result.success) {
        setContent('');
        setFiles([]);
        setShowFileUpload(false);
        setKey((prev) => prev + 1); // Force editor re-render to clear content
        onCommentCreated?.();
      } else {
        console.error('Failed to create comment:', result.error);
      }
    } catch (error) {
      console.error('Error creating comment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContentChange = (htmlContent: string) => {
    setContent(htmlContent);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      handleSubmit();
      return false;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!user) {
    return null;
  }

  return (
    <div className={`border rounded-lg bg-background ${className}`}>
      <TipTapTextEditor
        key={key}
        initialContent={content}
        onContentChange={handleContentChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="border-0 ring-0 focus-within:ring-0"
        minHeight="60px"
        hideToolbar={true}
        customToolbar={(editor) => (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowFileUpload(!showFileUpload)}
            className={`h-8 w-8 p-0 ${
              showFileUpload || files.length > 0
                ? 'bg-accent text-accent-foreground'
                : ''
            }`}
            title="Attach files"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
        )}
        submitButton={
          <Button
            onClick={handleSubmit}
            disabled={
              isLoading || (isContentEmpty(content) && files.length === 0)
            }
            size="sm"
          >
            {isLoading ? 'Commenting...' : 'Comment'}
          </Button>
        }
      />

      {showFileUpload && (
        <div className="p-3 border-t">
          <CommentFileUpload
            files={files}
            onFilesChange={setFiles}
            maxFiles={3}
            maxFileSize={10}
          />
        </div>
      )}
    </div>
  );
}
