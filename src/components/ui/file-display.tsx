'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import {
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  File,
  Download,
  FileSpreadsheet,
  FileCode
} from 'lucide-react';

interface FileDisplayProps {
  /** File name with extension */
  fileName: string;
  /** File URL for download/display */
  fileUrl: string;
  /** File size in bytes (optional) */
  fileSize?: number;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show as clickable/downloadable */
  downloadable?: boolean;
  /** Custom onClick handler (overrides default download) */
  onClick?: () => void;
}

const getFileType = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';

  const typeMap: Record<string, string> = {
    // Documents
    pdf: 'PDF',
    doc: 'DOC',
    docx: 'DOCX',
    txt: 'TXT',
    rtf: 'RTF',

    // Spreadsheets
    xls: 'XLS',
    xlsx: 'XLSX',
    csv: 'CSV',

    // Images
    jpg: 'JPG',
    jpeg: 'JPEG',
    png: 'PNG',
    gif: 'GIF',
    webp: 'WEBP',
    svg: 'SVG',
    bmp: 'BMP',

    // Videos
    mp4: 'MP4',
    avi: 'AVI',
    mov: 'MOV',
    mkv: 'MKV',
    webm: 'WEBM',

    // Audio
    mp3: 'MP3',
    wav: 'WAV',
    flac: 'FLAC',
    aac: 'AAC',

    // Code
    js: 'JS',
    ts: 'TS',
    jsx: 'JSX',
    tsx: 'TSX',
    html: 'HTML',
    css: 'CSS',
    json: 'JSON',
    xml: 'XML',
    py: 'Python',
    java: 'Java',
    cpp: 'C++',
    c: 'C',

    // Archives
    zip: 'ZIP',
    rar: 'RAR',
    '7z': '7Z',
    tar: 'TAR',
    gz: 'GZ'
  };

  return typeMap[extension] || extension.toUpperCase();
};

const getFileIcon = (fileName: string, size: number = 20) => {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';

  const iconProps = { size, className: 'flex-shrink-0' };

  // Images
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension)) {
    return (
      <FileImage {...iconProps} className="text-green-600 flex-shrink-0" />
    );
  }

  // Videos
  if (['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(extension)) {
    return <FileVideo {...iconProps} className="text-blue-600 flex-shrink-0" />;
  }

  // Audio
  if (['mp3', 'wav', 'flac', 'aac'].includes(extension)) {
    return (
      <FileAudio {...iconProps} className="text-purple-600 flex-shrink-0" />
    );
  }

  // Spreadsheets
  if (['xls', 'xlsx', 'csv'].includes(extension)) {
    return (
      <FileSpreadsheet
        {...iconProps}
        className="text-green-700 flex-shrink-0"
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
    return <FileCode {...iconProps} className="text-blue-700 flex-shrink-0" />;
  }

  // PDF gets special red color like in your image
  if (extension === 'pdf') {
    return <FileText {...iconProps} className="text-red-600 flex-shrink-0" />;
  }

  // Documents
  if (['doc', 'docx', 'txt', 'rtf'].includes(extension)) {
    return <FileText {...iconProps} className="text-blue-600 flex-shrink-0" />;
  }

  // Default
  return <File {...iconProps} className="text-gray-600 flex-shrink-0" />;
};

const isImageFile = (fileName: string): boolean => {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(
    extension
  );
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const handleDownload = (fileUrl: string, fileName: string) => {
  const link = document.createElement('a');
  link.href = fileUrl;
  link.download = fileName;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export function FileDisplay({
  fileName,
  fileUrl,
  fileSize,
  className,
  downloadable = true,
  onClick
}: FileDisplayProps) {
  const fileType = getFileType(fileName);
  const isImage = isImageFile(fileName);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (downloadable) {
      handleDownload(fileUrl, fileName);
    }
  };

  // For images, display the actual image
  if (isImage) {
    return (
      <div
        className={cn(
          'relative group rounded-lg border border-border overflow-hidden bg-background',
          downloadable &&
            'cursor-pointer hover:border-primary/50 transition-colors',
          className
        )}
        onClick={downloadable ? handleClick : undefined}
      >
        <img
          src={fileUrl}
          alt={fileName}
          className="w-full h-48 object-cover"
        />

        {/* Overlay on hover for downloadable images */}
        {downloadable && (
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="text-white text-center">
              <Download className="h-6 w-6 mx-auto mb-2" />
              <span className="text-sm font-medium">Download</span>
            </div>
          </div>
        )}

        {/* File info at bottom */}
        <div className="p-3 border-t border-border bg-background">
          <div className="flex items-center gap-3">
            {getFileIcon(fileName, 16)}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {fileName}
              </p>
              <p className="text-xs text-muted-foreground">
                {fileType}
                {fileSize && ` • ${formatFileSize(fileSize)}`}
                {downloadable && ' • Click to download'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // For non-images, display the file info card (like your PDF example)
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-4 rounded-lg border border-border bg-background',
        downloadable &&
          'cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors',
        className
      )}
      onClick={downloadable ? handleClick : undefined}
    >
      {getFileIcon(fileName, 24)}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {fileName}
        </p>
        <p className="text-xs text-muted-foreground">
          {fileType}
          {fileSize && ` • ${formatFileSize(fileSize)}`}
          {downloadable && ' • Download'}
        </p>
      </div>

      {downloadable && (
        <Download className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
      )}
    </div>
  );
}
