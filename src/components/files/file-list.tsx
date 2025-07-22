// File list and upload component
// This component is used to display a list of files and upload new files to R2
// Adding files to the DB is handled by the parent component

'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { DropzoneInput } from './dropzone-input';
import { toast } from 'sonner';
import { formatFileSize } from '@/lib/utils';
import { Prisma, File as PrismaFile } from '@prisma/client';
import { FileDisplay } from './file-display';
import { FileIcon } from './file-icon';
import { getUploadUrl } from '@/lib/actions/file-actions';
import { downloadFile } from '@/lib/file-utils';

interface LoadingFile {
  id: string;
  name: string;
  size: number;
}

interface FileItemProps {
  file: PrismaFile;
  isDeleting: boolean;
  onDelete: (file: PrismaFile) => void;
}

interface LoadingFileItemProps {
  file: LoadingFile;
}

interface FileListProps {
  files: PrismaFile[] | [];
  uploadPath: string; // The path to upload the files to on R2
  readOnly?: boolean;
  onUpload: (files: Prisma.FileCreateInput[]) => void | Promise<void>;
  onDelete: (file: PrismaFile) => void | Promise<void>;
}

/*
FILE ITEM COMPONENT
*/

function FileItem({ file, isDeleting, onDelete }: FileItemProps) {
  return (
    <div
      className={`flex items-center justify-between p-2 h-12 border rounded-md px-2 ${
        isDeleting ? 'bg-secondary/50 opacity-50 animate-pulse' : 'bg-secondary'
      }`}
    >
      <div className="flex items-center gap-2 w-full">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <FileIcon
            fileName={file.name}
            className={`h-4 w-4 flex-shrink-0 ${isDeleting ? 'text-muted-foreground' : ''}`}
          />
          <Button
            variant="link"
            onClick={() => downloadFile(file)}
            className={`text-sm font-medium p-0 h-auto justify-start min-w-0 truncate ${
              isDeleting ? 'text-muted-foreground' : ''
            }`}
            disabled={isDeleting}
          >
            <span className="truncate block">{file.name}</span>
          </Button>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className={`text-xs whitespace-nowrap ${isDeleting ? 'text-muted-foreground' : 'text-muted-foreground'}`}
          >
            {isDeleting && 'Deleting...'}
          </span>
          {isDeleting ? (
            <div className="w-8 h-8 flex items-center justify-center">
              <div className="w-4 h-4 bg-muted-foreground/20 rounded animate-pulse" />
            </div>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onDelete(file)}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/*
LOADING FILE ITEM COMPONENT
*/

function LoadingFileItem({ file }: LoadingFileItemProps) {
  return (
    <div className="flex items-center justify-between p-2 h-12 bg-secondary/50 border rounded-md px-2 opacity-50 animate-pulse">
      <div className="flex items-center justify-between gap-2 w-full">
        <div className="flex items-center gap-2">
          <FileIcon
            fileName={file.name}
            className="h-4 w-4 text-muted-foreground"
          />
          <span className="text-sm font-medium text-muted-foreground truncate max-w-[300px] sm:max-w-full">
            {file.name}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {formatFileSize(file.size)}
        </span>
      </div>
      <div className="w-8 h-8 flex items-center justify-center">
        <div className="w-4 h-4 bg-muted-foreground/20 rounded animate-pulse" />
      </div>
    </div>
  );
}

/*
FILE LIST COMPONENT
*/

export function FileList({
  files,
  uploadPath,
  readOnly = false,
  onUpload,
  onDelete
}: FileListProps) {
  const [loadingFiles, setLoadingFiles] = useState<LoadingFile[]>([]);
  const [deletingFileIds, setDeletingFileIds] = useState<Set<string>>(
    new Set()
  );

  const uploadToR2 = async (files: File[]) => {
    if (!uploadPath) {
      return;
    }

    const uploadedFiles: Prisma.FileCreateInput[] = [];
    await Promise.all(
      files.map(async (file) => {
        const uploadUrl = await getUploadUrl(file.name, file.type, uploadPath);
        if (!uploadUrl.url) {
          throw new Error('Failed to get upload URL');
        }
        const response = await fetch(uploadUrl.url, {
          method: 'PUT',
          body: file
        });
        if (!response.ok) {
          throw new Error('Failed to upload file');
        }

        uploadedFiles.push({
          url: uploadUrl.url,
          key: uploadUrl.key,
          name: file.name,
          type: file.type,
          size: file.size
        });
      })
    );

    return uploadedFiles;
  };

  const handleDelete = async (file: PrismaFile) => {
    try {
      setDeletingFileIds((prev) => new Set(prev).add(file.id));
      await onDelete(file);
    } catch (error) {
      toast.error('Failed to delete file');
    } finally {
      setDeletingFileIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(file.id);
        return newSet;
      });
    }
  };

  const handleUpload = async (filesToUpload: File[]) => {
    // Create loading file entries
    const newLoadingFiles: LoadingFile[] = filesToUpload.map((file, index) => ({
      id: `loading-${Date.now()}-${index}`,
      name: file.name,
      size: file.size
    }));

    setLoadingFiles((prev) => [...prev, ...newLoadingFiles]);

    try {
      const uploadedFiles = await uploadToR2(filesToUpload);
      if (uploadedFiles) {
        await onUpload(uploadedFiles);
      }
    } catch (error) {
      toast.error('Failed to upload files');
    } finally {
      // Remove loading files
      setLoadingFiles((prev) =>
        prev.filter(
          (loadingFile) =>
            !newLoadingFiles.some((newFile) => newFile.id === loadingFile.id)
        )
      );
    }
  };

  return (
    <div>
      {/* File List */}
      {(files?.length > 0 || loadingFiles.length > 0) && (
        <div className="space-y-2">
          {/* Existing files */}
          {files.map((file, index: number) => {
            const isDeleting = deletingFileIds.has(file.id);
            return (
              <FileItem
                key={index}
                file={file}
                isDeleting={isDeleting}
                onDelete={handleDelete}
              />
            );
          })}

          {/* Loading files */}
          {loadingFiles.map((file) => (
            <LoadingFileItem key={file.id} file={file} />
          ))}
        </div>
      )}
      {!readOnly && (
        <DropzoneInput
          label={'Upload Files'}
          onFilesChange={(files) => {
            // Validate file size (10MB limit)
            const invalidFiles = files.filter(
              (file) => file.size > 10 * 1024 * 1024
            );
            if (invalidFiles.length > 0) {
              toast.error('Files must be less than 10MB');
              return;
            }

            handleUpload(files);
          }}
          isLoading={loadingFiles.length > 0}
          className="mt-2"
        />
      )}
    </div>
  );
}
