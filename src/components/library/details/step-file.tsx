'use client';

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  Box,
  Download,
  Eye,
  Loader2,
  Upload,
  FileUp,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { File as PrismaFile } from '@prisma/client';
import ThreeDViewer from '@/components/three-d-viewer';
import useSWR from 'swr';
import {
  getFileUrlFromKey,
  addStepFileWithGltfConversion
} from '@/lib/actions';
import { useDropzone } from 'react-dropzone';

interface StepFileProps {
  cadFile: PrismaFile | null;
  gltfFile: PrismaFile | null;
  partId: string;
  className?: string;
}

// Fetcher function for SWR
const fetcher = async (key: string) => {
  console.log('Fetching Key:', key);
  const result = await getFileUrlFromKey(key);
  if (!result.success) {
    throw new Error(result.error || 'Failed to get signed URL');
  }
  return result.url;
};

// Component for viewing STEP and GLTF files
const StepFile: React.FC<StepFileProps> = ({
  cadFile,
  gltfFile,
  partId,
  className
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const key = gltfFile?.key;

  console.log('gltfFile', gltfFile);
  // Get signed URL for the GLTF file using SWR
  const {
    data: signedGltfUrl,
    error: gltfUrlError,
    isLoading: isLoadingGltfUrl
  } = useSWR(key, fetcher);

  console.log('error', gltfUrlError);
  console.log('signedGltfUrl', signedGltfUrl);

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

  const handleStepFileUpload = useCallback(
    async (file: File) => {
      if (!file) return;

      // Validate file type
      const isValidStepFile =
        file.name.toLowerCase().endsWith('.step') ||
        file.name.toLowerCase().endsWith('.stp');

      if (!isValidStepFile) {
        toast.error('Please upload a STEP file (.step or .stp)');
        return;
      }

      setIsUploading(true);
      setUploadProgress('Uploading STEP file...');

      try {
        // Call the server action to upload and convert
        setUploadProgress('Converting STEP to GLTF...');
        const result = await addStepFileWithGltfConversion({
          partId,
          stepFile: file
        });

        if (result.success) {
          setUploadProgress('Upload complete!');
          toast.success(
            'STEP file uploaded and converted to 3D model successfully!'
          );

          // Refresh the page to show the new files
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          throw new Error(
            result.error || 'Failed to upload and convert STEP file'
          );
        }
      } catch (error) {
        console.error('Error uploading STEP file:', error);
        toast.error(
          error instanceof Error ? error.message : 'Failed to upload STEP file'
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
        handleStepFileUpload(file);
      }
    },
    [handleStepFileUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/octet-stream': ['.step', '.stp'],
      'model/step': ['.step', '.stp']
    },
    maxFiles: 1,
    disabled: isUploading
  });

  // If no GLTF file is available, show upload dropzone
  if (!gltfFile) {
    return (
      <div className={cn('w-full', className)}>
        <div
          {...getRootProps()}
          className={cn(
            'aspect-square w-full rounded-lg border-2 border-dashed transition-colors cursor-pointer',
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
                    Processing STEP File...
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
                    Drop STEP file here
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Release to upload and convert to 3D model
                  </p>
                </div>
              </>
            ) : (
              <>
                <Upload className="h-16 w-16 text-muted-foreground" />
                <div className="text-center space-y-2">
                  <p className="text-lg font-medium text-foreground">
                    Upload STEP File
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Drag & drop a STEP file (.step or .stp) or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground">
                    The file will be automatically converted to a 3D model
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // If we're loading the signed URL, show loading state
  if (isLoadingGltfUrl || !signedGltfUrl) {
    return (
      <div className={cn('w-full', className)}>
        <div className="aspect-square w-full rounded-lg border bg-muted/10 flex flex-col items-center justify-center gap-4 p-8">
          <Loader2 className="h-16 w-16 text-muted-foreground animate-spin" />
          <div className="text-center space-y-2">
            <p className="text-lg font-medium text-foreground">
              Loading 3D Model...
            </p>
            <p className="text-sm text-muted-foreground">
              Preparing secure access to the file
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If there's an error getting the signed URL, show error
  if (gltfUrlError) {
    return (
      <div className={cn('w-full', className)}>
        <div className="aspect-square w-full rounded-lg border border-red-200 bg-red-50 flex flex-col items-center justify-center gap-4 p-8">
          <Box className="h-16 w-16 text-red-500" />
          <div className="text-center space-y-2">
            <p className="text-lg font-medium text-red-700">
              Error Loading 3D Model
            </p>
            <p className="text-sm text-red-600">
              {gltfUrlError.message || 'Failed to load the 3D model file'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show the 3D viewer with file information
  return (
    <div className={cn('w-full space-y-4', className)}>
      {/* 3D Viewer */}
      <div className="relative">
        <ThreeDViewer
          fileUrl={signedGltfUrl}
          fileType="gltf"
          height="500px"
          className="rounded-lg shadow-sm"
          environment="studio"
          showGrid={true}
          onLoad={(model) => {
            console.log('3D model loaded:', model);
          }}
          onError={(error) => {
            console.error('Error loading 3D model:', error);
            toast.error('Failed to load 3D model');
          }}
        />
      </div>

      {/* File Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* GLTF File Info */}
        <div className="p-4 border rounded-lg bg-card">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Box className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-sm">GLTF File</span>
            </div>
            <button
              onClick={() => handleDownload(gltfFile, 'GLTF')}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 transition-colors"
            >
              <Download className="h-3 w-3" />
              Download
            </button>
          </div>
        </div>

        {/* CAD File Info */}
        {cadFile && (
          <div className="p-4 border rounded-lg bg-card">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Box className="h-4 w-4 text-green-600" />
                <span className="font-medium text-sm">STEP File</span>
              </div>
              <button
                onClick={() => handleDownload(cadFile, 'STEP')}
                className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 transition-colors"
              >
                <Download className="h-3 w-3" />
                Download
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StepFile;
