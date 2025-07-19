'use client';

import React, { useState, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Download, Loader2, Upload, FileUp, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';
import { File as PrismaFile } from '@prisma/client';
import AutodeskViewer from '@/components/autodesk-viewer';
import { updatePart } from '../../actions';
import { getFileUrlFromKey } from '@/lib/actions/file-actions';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

interface StepFileProps {
  cadFile: PrismaFile | null;
  gltfFile: PrismaFile | null;
  partId: string;
  apsUrn?: string | null;
  className?: string;
}

// Component for viewing CAD files with APS support
const StepFile: React.FC<StepFileProps> = ({
  cadFile,
  gltfFile,
  partId,
  apsUrn,
  className
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownload = async (file: PrismaFile, label: string) => {
    try {
      const result = await getFileUrlFromKey(file.key);
      if (result.success) {
        window.open(result.url, '_blank');
        toast.success(`Downloading ${label} file`);
      } else {
        toast.error(result.error || 'Failed to get download URL');
      }
    } catch (error) {
      console.error('Error getting download URL:', error);
      toast.error('Failed to get download URL');
    }
  };

  const handleAPSUpload = useCallback(
    async (file: File) => {
      if (!file) return;

      setIsUploading(true);
      setUploadProgress('Uploading to Autodesk Platform Services...');

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/aps/upload', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Upload failed');
        }

        const result = await response.json();
        console.log('APS Upload result:', result);
        setUploadProgress('File uploaded, starting translation...');

        // Wait for translation to complete
        let translationComplete = false;
        let attempts = 0;
        const maxAttempts = 60; // 5 minutes max

        while (!translationComplete && attempts < maxAttempts) {
          attempts++;
          await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds

          try {
            const statusResponse = await fetch(
              `/api/aps/translate/${result.translationUrn}`
            );
            if (statusResponse.ok) {
              const status = await statusResponse.json();
              console.log('Translation status:', status);

              if (status.isComplete) {
                translationComplete = true;
                setUploadProgress('Translation complete, saving...');

                console.log(
                  'Translation complete, saving URN:',
                  result.translationUrn
                );
                console.log('Part ID:', partId);

                // Save the APS URN to the part
                try {
                  const updateResult = await updatePart({
                    id: partId,
                    apsUrn: result.translationUrn
                  });
                  console.log('Update part result:', updateResult);

                  if (updateResult.success) {
                    console.log('Successfully saved APS URN to part');
                    toast.success(
                      '3D model uploaded and translated successfully!'
                    );
                    setTimeout(() => {
                      window.location.reload();
                    }, 1000);
                  } else {
                    console.error(
                      'Failed to save APS URN:',
                      updateResult.error
                    );
                    toast.error(
                      `Model translated but failed to save: ${updateResult.error}`
                    );
                  }
                } catch (updateError) {
                  console.error(
                    'Error updating part with APS URN:',
                    updateError
                  );
                  toast.error(
                    'Model translated but failed to save. Please refresh the page.'
                  );
                }
                break;
              } else if (status.hasErrors) {
                throw new Error('Translation failed with errors');
              } else {
                setUploadProgress(
                  `Translation in progress... (${status.progress || 'Processing'})`
                );
              }
            }
          } catch (statusError) {
            console.warn('Error checking translation status:', statusError);
          }
        }

        if (!translationComplete) {
          throw new Error('Translation timed out. Please try again.');
        }
      } catch (error) {
        console.error('Error uploading to APS:', error);
        toast.error(
          error instanceof Error ? error.message : 'Failed to upload to APS'
        );
      } finally {
        setIsUploading(false);
        setUploadProgress('');
      }
    },
    [partId]
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        handleAPSUpload(file);
      }
    },
    [handleAPSUpload]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      // APS supports many formats
      'application/octet-stream': [
        '.step',
        '.stp',
        '.dwg',
        '.dxf',
        '.ipt',
        '.iam',
        '.idw',
        '.ipn',
        '.f3d',
        '.catpart',
        '.catproduct',
        '.cgr',
        '.3dxml',
        '.3dm',
        '.rvt',
        '.rfa',
        '.obj',
        '.stl',
        '.3ds',
        '.max'
      ],
      'model/step': ['.step', '.stp'],
      'application/dwg': ['.dwg'],
      'application/dxf': ['.dxf'],
      'application/inventor': ['.ipt', '.iam'],
      'model/obj': ['.obj'],
      'model/stl': ['.stl']
    },
    maxFiles: 1,
    disabled: isUploading,
    noClick: !!apsUrn, // Only disable click when there's an existing model
    noKeyboard: !!apsUrn // Only disable keyboard when there's an existing model
  });

  const handleUpdateModel = () => {
    if (!isUploading) {
      open(); // Trigger the file dialog
    }
  };

  // If we have an APS URN, show the AutodeskViewer
  if (apsUrn) {
    return (
      <div className={cn('w-full space-y-4 h-full', className)}>
        {/* Header with download options and dropdown menu */}
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">3D Model Viewer</h3>
          <div className="flex gap-2">
            {cadFile && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(cadFile, 'CAD')}
              >
                <Download className="h-4 w-4 mr-2" />
                Download CAD
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={handleUpdateModel}
                  disabled={isUploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Update model
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Autodesk Viewer */}
        <AutodeskViewer
          height="100%"
          urn={apsUrn}
          onError={(error) => {
            console.error('AutodeskViewer error:', error);
            toast.error('Failed to load 3D model');
          }}
        />

        {/* Hidden dropzone for file uploads triggered by dropdown */}
        <div {...getRootProps()} className="hidden">
          <input {...getInputProps()} />
        </div>

        {/* Upload progress indicator */}
        {isUploading && (
          <div className="border rounded-lg p-4 bg-muted/10">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-sm font-medium">
                Processing with Autodesk Platform Services...
              </p>
              <p className="text-sm text-muted-foreground">{uploadProgress}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // If no APS URN, show upload interface
  return (
    <div className={cn('w-full space-y-4')}>
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">3D Model Viewer</h3>
        <div className="flex gap-2">
          {cadFile && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownload(cadFile, 'CAD')}
            >
              <Download className="h-4 w-4 mr-2" />
              Download CAD
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={handleUpdateModel}
                disabled={isUploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                Update model
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div
        {...getRootProps()}
        className={cn(
          'w-full rounded-lg border-2 border-dashed transition-colors cursor-pointer',
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 bg-muted/10 hover:border-muted-foreground/40 hover:bg-muted/20',
          isUploading && 'pointer-events-none opacity-75'
        )}
      >
        <input {...getInputProps()} />
        <div className="h-full flex flex-col items-center justify-center gap-4 p-8">
          {isUploading ? (
            <>
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
              <div className="text-center space-y-2">
                <p className="text-lg font-medium text-foreground">
                  Processing with Autodesk Platform Services...
                </p>
                <p className="text-sm text-muted-foreground">
                  {uploadProgress}
                </p>
              </div>
            </>
          ) : isDragActive ? (
            <>
              <FileUp className="h-16 w-16 text-primary" />
              <div className="text-center space-y-2">
                <p className="text-lg font-medium text-foreground">
                  Drop CAD file here
                </p>
                <p className="text-sm text-muted-foreground">
                  Release to upload and translate with APS
                </p>
              </div>
            </>
          ) : (
            <>
              <Upload className="h-16 w-16 text-muted-foreground" />
              <div className="text-center space-y-2">
                <p className="text-lg font-medium text-foreground">
                  Upload CAD File
                </p>
                <p className="text-sm text-muted-foreground">
                  Drag & drop CAD files or click to browse
                </p>
                <p className="text-xs text-muted-foreground">
                  Professional CAD viewing with support for 70+ formats
                  including:
                </p>
                <p className="text-xs text-muted-foreground">
                  .dwg, .step, .ipt, .iam, .f3d, .catpart, .rvt, .obj, .stl,
                  .3ds, .max and more
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StepFile;
