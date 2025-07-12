/**
 * File icon component that displays appropriate icon based on file extension
 */
import {
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  File as DefaultFileIcon,
  FileSpreadsheet,
  FileCode
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileIconProps {
  /** File name with extension */
  fileName: string;
  /** Icon size in pixels */
  size?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * File icon component that displays appropriate icon based on file extension
 */
export function FileIcon({ fileName, size = 20, className }: FileIconProps) {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';

  const baseClasses = 'flex-shrink-0';

  // Images
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension)) {
    return (
      <FileImage
        size={size}
        className={cn(baseClasses, 'text-green-600', className)}
      />
    );
  }

  // Videos
  if (['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(extension)) {
    return (
      <FileVideo
        size={size}
        className={cn(baseClasses, 'text-blue-600', className)}
      />
    );
  }

  // Audio
  if (['mp3', 'wav', 'flac', 'aac'].includes(extension)) {
    return (
      <FileAudio
        size={size}
        className={cn(baseClasses, 'text-purple-600', className)}
      />
    );
  }

  // Spreadsheets
  if (['xls', 'xlsx', 'csv'].includes(extension)) {
    return (
      <FileSpreadsheet
        size={size}
        className={cn(baseClasses, 'text-green-700', className)}
      />
    );
  }

  // Code files
  if (
    [
      'js',
      'ts',
      'jsx',
      'tsx',
      'html',
      'css',
      'json',
      'xml',
      'py',
      'java',
      'cpp',
      'c'
    ].includes(extension)
  ) {
    return (
      <FileCode
        size={size}
        className={cn(baseClasses, 'text-blue-700', className)}
      />
    );
  }

  // PDF gets special red color
  if (extension === 'pdf') {
    return (
      <FileText
        size={size}
        className={cn(baseClasses, 'text-red-600', className)}
      />
    );
  }

  // Documents
  if (['doc', 'docx', 'txt', 'rtf'].includes(extension)) {
    return (
      <FileText
        size={size}
        className={cn(baseClasses, 'text-blue-600', className)}
      />
    );
  }

  // Default
  return (
    <DefaultFileIcon
      size={size}
      className={cn(baseClasses, 'text-gray-600', className)}
    />
  );
}
