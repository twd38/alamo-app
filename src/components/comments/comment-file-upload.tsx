'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Paperclip,
  X,
  File as FileIcon,
  ImageIcon,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import { formatFileSize } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { FileDisplay } from '@/components/files/file-display';
import { getSecureFileUrl, downloadSecureFile } from '@/lib/file-utils';

export interface CommentFile {
  id?: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  file?: File; // For new uploads
}

interface CommentFileUploadProps {
  files: CommentFile[];
  onFilesChange: (files: CommentFile[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  className?: string;
}

export function CommentFileUpload({
  files,
  onFilesChange,
  maxFiles = 5,
  maxFileSize = 10, // 10MB default
  className
}: CommentFileUploadProps) {
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = useCallback(
    (newFiles: FileList | null) => {
      if (!newFiles) return;

      const fileArray = Array.from(newFiles);
      const validFiles: CommentFile[] = [];

      // Validate files
      for (const file of fileArray) {
        // Check file size
        if (file.size > maxFileSize * 1024 * 1024) {
          toast.error(`${file.name} is too large (max ${maxFileSize}MB)`);
          continue;
        }

        // Check if we're at max files
        if (files.length + validFiles.length >= maxFiles) {
          toast.error(`Maximum ${maxFiles} files allowed`);
          break;
        }

        validFiles.push({
          name: file.name,
          size: file.size,
          type: file.type,
          file
        });
      }

      if (validFiles.length > 0) {
        onFilesChange([...files, ...validFiles]);
      }
    },
    [files, onFilesChange, maxFiles, maxFileSize]
  );

  const handleRemoveFile = useCallback(
    (index: number) => {
      const newFiles = files.filter((_, i) => i !== index);
      onFilesChange(newFiles);
    },
    [files, onFilesChange]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  const isImageFile = (fileName: string) => {
    const imageExtensions = /\.(jpg|jpeg|png|gif|bmp|webp)$/i;
    return imageExtensions.test(fileName);
  };

  const getFileIcon = (fileName: string) => {
    if (isImageFile(fileName)) {
      return <ImageIcon className="h-4 w-4" />;
    }
    return <FileIcon className="h-4 w-4" />;
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center gap-2 p-2 rounded-md border bg-muted/30"
            >
              {getFileIcon(file.name)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveFile(index)}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button/Drop Zone */}
      {files.length < maxFiles && (
        <div
          className={cn(
            'relative border-2 border-dashed rounded-lg p-3 transition-colors',
            dragActive
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            multiple
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={(e) => handleFileSelect(e.target.files)}
            accept="*/*"
          />
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Paperclip className="h-4 w-4" />
            <span>
              {dragActive
                ? 'Drop files here'
                : `Attach files (${files.length}/${maxFiles})`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Component to display files in a comment (read-only)
interface CommentFilesDisplayProps {
  files: Array<{
    id: string;
    name: string;
    size: number;
    type: string;
    url: string;
  }>;
  className?: string;
}

export function CommentFilesDisplay({
  files,
  className
}: CommentFilesDisplayProps) {
  if (files.length === 0) return null;

  const handleFileClick = (fileId: string, fileName: string) => {
    downloadSecureFile(fileId, fileName);
  };

  return (
    <div className={cn('mt-2 space-y-2', className)}>
      {files.map((file) => (
        <FileDisplay
          key={file.id}
          fileName={file.name}
          fileUrl={getSecureFileUrl(file.id)} // Use secure URL
          fileSize={file.size}
          className="max-w-sm"
          onClick={() => handleFileClick(file.id, file.name)}
        />
      ))}
    </div>
  );
}
