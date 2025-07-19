'use client';

import React from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DropzoneInputProps {
  /** Label text displayed in the dropzone */
  label?: string;
  /** Description text displayed in the dropzone */
  description?: string;
  /** Callback when files are selected or dropped */
  onFilesChange?: (files: File[]) => void;
  /** Maximum number of files allowed */
  maxFiles?: number;
  /** Maximum file size in bytes */
  maxSize?: number;
  /** Array of accepted file types (e.g., ['image/*', '.pdf']) */
  acceptedFileTypes?: string[];
  /** Whether the dropzone is in loading state */
  isLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * A dropzone input component for file uploads with drag and drop functionality
 */
export function DropzoneInput({
  label = 'Upload files',
  description,
  onFilesChange,
  maxFiles,
  maxSize,
  acceptedFileTypes,
  isLoading,
  className
}: DropzoneInputProps) {
  // Convert acceptedFileTypes array to react-dropzone accept format
  const acceptObject = React.useMemo(() => {
    if (!acceptedFileTypes?.length) return undefined;

    const accept: Record<string, string[]> = {};
    acceptedFileTypes.forEach((type) => {
      if (type.startsWith('.')) {
        // File extension
        accept['*/*'] = accept['*/*'] || [];
        accept['*/*'].push(type);
      } else {
        // MIME type
        accept[type] = [];
      }
    });

    return accept;
  }, [acceptedFileTypes]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: acceptObject,
    maxFiles,
    maxSize,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        onFilesChange?.(acceptedFiles);
      }
    }
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'flex items-center justify-center border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer',
        isDragActive
          ? 'border-gray-500 bg-gray-50'
          : 'border-gray-300 hover:border-gray-400',
        isLoading && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <div className="text-center">
        <Upload className="mx-auto h-6 w-6 text-gray-400 mb-3" />
        <span className="block text-sm font-medium text-gray-700">
          {isDragActive ? 'Drop files here' : label}
        </span>
        <span className="block text-xs text-gray-500 mt-1">
          {description || (
            <>
              Drag & drop or{' '}
              <span className="text-blue-600 hover:text-blue-700 cursor-pointer">
                choose file
              </span>{' '}
              to upload
            </>
          )}
        </span>
        {(maxFiles || maxSize || acceptedFileTypes?.length) && (
          <span className="block text-xs text-gray-500 mt-1">
            {acceptedFileTypes?.length && `${acceptedFileTypes.join(', ')}`}
            {maxFiles && ` • Max ${maxFiles} files`}
            {maxSize && ` • Max ${Math.round(maxSize / 1024 / 1024)}MB`}
          </span>
        )}
      </div>
      <input {...getInputProps()} />
    </div>
  );
}
