'use client';

import React from 'react';
import Image from 'next/image';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { X, Upload, File, ImageIcon, Loader2 } from 'lucide-react';
import { formatFileSize } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { FileIcon } from '@/components/files/file-icon';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

interface FileUploadProps {
  // Core functionality
  multiple?: boolean;
  accept?: Record<string, string[]>; // Same format as react-dropzone
  maxFiles?: number;
  maxSize?: number; // in bytes, defaults to 10MB

  // Current state - now expects uploaded file data instead of File objects
  value?: UploadedFile | UploadedFile[];

  // Handlers - now returns uploaded file data instead of File objects
  onChange: (files: UploadedFile | UploadedFile[] | undefined) => void;
  onError?: (error: string) => void;

  // Upload function - required for immediate uploads
  onUpload: (
    file: File,
    path: string
  ) => Promise<{
    success: boolean;
    data?: {
      id: string;
      url: string;
      key: string;
      name: string;
      type: string;
      size: number;
    };
    error?: string;
  }>;
  uploadPath: string; // Path for R2 uploads (e.g., 'parts', 'tasks')

  // UI customization
  placeholder?: string;
  className?: string;
  disabled?: boolean;

  // Preview options
  showPreview?: boolean;
  previewSize?: 'sm' | 'md' | 'lg';
}

const FileUpload: React.FC<FileUploadProps> = ({
  multiple = false,
  accept,
  maxFiles,
  maxSize = 10 * 1024 * 1024, // 10MB default
  value,
  onChange,
  onError,
  onUpload,
  uploadPath,
  placeholder,
  className,
  disabled = false,
  showPreview = true,
  previewSize = 'md'
}) => {
  // Convert value to array for consistent handling
  const files = React.useMemo(() => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }, [value]);

  // State for tracking uploads
  const [uploadingFiles, setUploadingFiles] = React.useState<Set<string>>(
    new Set()
  );

  // Size classes for preview
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-20 h-20',
    lg: 'w-24 h-24'
  };

  const dropzone = useDropzone({
    accept,
    multiple,
    maxFiles: maxFiles || (multiple ? undefined : 1),
    disabled: disabled || uploadingFiles.size > 0,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        await handleFilesUpload(acceptedFiles);
      }
    },
    onDropRejected: (rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        if (
          rejection.errors.some((error) => error.code === 'file-invalid-type')
        ) {
          onError?.('Please upload a valid file type');
        } else if (
          rejection.errors.some((error) => error.code === 'too-many-files')
        ) {
          onError?.(
            multiple
              ? `Please upload no more than ${maxFiles} files`
              : 'Please upload only one file'
          );
        } else if (
          rejection.errors.some((error) => error.code === 'file-too-large')
        ) {
          onError?.(`File size must be less than ${formatFileSize(maxSize)}`);
        } else {
          onError?.('File upload failed');
        }
      }
    }
  });

  const handleFilesUpload = async (filesToUpload: File[]) => {
    const uploadPromises = filesToUpload.map(async (file) => {
      const uploadKey = `${file.name}-${Date.now()}`;

      // Add to uploading set
      setUploadingFiles((prev) => new Set([...Array.from(prev), uploadKey]));

      try {
        const result = await onUpload(file, uploadPath);

        if (result.success && result.data) {
          return {
            id: result.data.id,
            name: result.data.name,
            size: result.data.size,
            type: result.data.type,
            url: result.data.url
          };
        } else {
          onError?.(result.error || `Failed to upload ${file.name}`);
          return null;
        }
      } catch (error) {
        onError?.(
          error instanceof Error
            ? error.message
            : `Failed to upload ${file.name}`
        );
        return null;
      } finally {
        // Remove from uploading set
        setUploadingFiles((prev) => {
          const newSet = new Set(Array.from(prev));
          newSet.delete(uploadKey);
          return newSet;
        });
      }
    });

    const uploadResults = await Promise.all(uploadPromises);
    const successfulUploads = uploadResults.filter(
      (result): result is UploadedFile => result !== null
    );

    if (successfulUploads.length > 0) {
      if (multiple) {
        const newFiles = [...files, ...successfulUploads];
        onChange(newFiles);
      } else {
        onChange(successfulUploads[0]);
      }
    }
  };

  const handleRemoveFile = (indexToRemove: number) => {
    const updatedFiles = files.filter((_, index) => index !== indexToRemove);
    if (multiple) {
      onChange(updatedFiles.length > 0 ? updatedFiles : undefined);
    } else {
      onChange(undefined);
    }
  };

  const isImage = (file: UploadedFile) => file.type.startsWith('image/');

  // Get secure URL for file access
  const getSecureFileUrl = (file: UploadedFile) => {
    // Use the secure API endpoint for file access
    return `/api/files/${file.id}`;
  };

  // For single file mode with preview, show preview instead of dropzone when file exists
  if (!multiple && files.length > 0 && showPreview) {
    const secureUrl = getSecureFileUrl(files[0]);

    return (
      <div className={cn('space-y-2', className)}>
        <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 aspect-square relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            {isImage(files[0]) ? (
              <Image
                src={secureUrl}
                alt={files[0].name}
                fill
                className="object-cover rounded-md"
              />
            ) : (
              <FileIcon
                fileName={files[0].name}
                size={48}
                className="max-w-24 max-h-24"
              />
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 h-5 w-5 p-0 bg-slate-800 text-white rounded-full shadow-lg z-10 hover:bg-slate-700 hover:text-white"
            onClick={() => handleRemoveFile(0)}
            disabled={disabled}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  // Default dropzone view
  return (
    <div className={cn('space-y-2', className)}>
      <div
        {...dropzone.getRootProps()}
        className={cn(
          'flex items-center justify-center border-2 border-dashed rounded-lg p-4 transition-colors cursor-pointer',
          dropzone.isDragActive
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400',
          (disabled || uploadingFiles.size > 0) &&
            'opacity-50 cursor-not-allowed',
          !multiple && 'aspect-square'
        )}
      >
        <div className="text-center">
          {uploadingFiles.size > 0 ? (
            <Loader2 className="mx-auto h-8 w-8 text-gray-400 animate-spin" />
          ) : (
            <Upload className="mx-auto h-8 w-8 text-gray-400" />
          )}
          <div className="mt-2">
            <span className="block text-sm font-medium text-gray-900">
              {uploadingFiles.size > 0
                ? 'Uploading...'
                : dropzone.isDragActive
                  ? 'Drop files here'
                  : placeholder ||
                    (multiple
                      ? 'Drop files here or click to browse'
                      : 'Drop file here or click to browse')}
            </span>
            <span className="block text-xs text-gray-500 mt-1">
              {accept
                ? Object.values(accept).flat().join(', ')
                : 'Any file type'}
              {maxSize && ` • Max ${formatFileSize(maxSize)}`}
            </span>
          </div>
        </div>
        <input {...dropzone.getInputProps()} />
      </div>

      {/* File List for multiple files or when not showing preview */}
      {files.length > 0 && (multiple || !showPreview) && (
        <div className="rounded-md">
          <div className="space-y-2">
            {files.map((file: UploadedFile, index: number) => (
              <div
                key={`${file.id}-${index}`}
                className="flex items-center justify-between p-2 bg-secondary/70 rounded-md"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {isImage(file) ? (
                    <ImageIcon className="h-4 w-4 flex-shrink-0" />
                  ) : (
                    <FileIcon fileName={file.name} size={16} />
                  )}
                  <span className="text-sm font-medium truncate">
                    {file.name}
                  </span>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {formatFileSize(file.size)}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveFile(index)}
                  disabled={disabled}
                  className="flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
