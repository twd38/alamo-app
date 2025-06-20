'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Paperclip, X } from 'lucide-react';
import { File as FileIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatFileSize } from '@/lib/utils';
import Link from 'next/link';
import { File } from '@prisma/client';
import { getFileUrlFromUnsignedUrl } from '@/lib/actions';

interface FileListProps {
  files: File[] | [];
  onChange: (files: FileType[]) => void;
}

type FileType = {
  id?: string;
  name: string;
  size: number;
  url?: string;
};

async function downloadFile(url: string) {
  console.log('downloading file', url);
  const signedUrl = await getFileUrlFromUnsignedUrl(url);
  window.open(signedUrl.url, '_blank');
}

const FileList = ({ files, onChange }: FileListProps) => {
  return (
    <div>
      {/* File List */}
      {files.length > 0 && (
        <>
          <div className="space-y-2">
            {files.map((file: FileType, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 h-12 bg-secondary border rounded-md px-2"
              >
                <div className="flex items-center gap-2">
                  <FileIcon className="h-4 w-4" />
                  <Button
                    variant="link"
                    onClick={() => downloadFile(file.url || '')}
                    className="text-sm font-medium"
                  >
                    {file.name}
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const currentFiles = files;
                    const updatedFiles = currentFiles.filter(
                      (_, i) => i !== index
                    );
                    onChange(updatedFiles);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </>
      )}
      <label htmlFor="file-upload" className="cursor-pointer">
        <Button
          type="button"
          variant="ghost"
          className="flex items-center w-full justify-center mt-2 h-12 bg-secondary/20 border-2 border-dashed rounded-md px-2 gap-2"
          onClick={() => {
            const fileInput = document.getElementById(
              'file-upload'
            ) as HTMLInputElement;
            fileInput.click();
          }}
        >
          <Paperclip className="h-4 w-4" />
          Attach Files
        </Button>
        <Input
          id="file-upload"
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            const addedFiles = Array.from(e.target.files || []);
            const currentFiles = files;

            // Validate file size (10MB limit)
            const invalidFiles = files.filter(
              (file) => file.size > 10 * 1024 * 1024
            );
            if (invalidFiles.length > 0) {
              toast.error('Files must be less than 10MB');
              return;
            }

            console.log('currentFiles', currentFiles);
            console.log('addedFiles', addedFiles);

            onChange([...currentFiles, ...addedFiles]);
          }}
        />
      </label>
    </div>
  );
};

export default FileList;
