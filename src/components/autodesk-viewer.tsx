'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Loader2, AlertTriangle, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Autodesk Viewer types
declare global {
  interface Window {
    Autodesk: {
      Viewing: {
        Initializer: (options: any, callback: () => void) => void;
        GuiViewer3D: new (container: HTMLElement, config?: any) => any;
        Document: {
          load: (
            urn: string,
            onDocumentLoadSuccess: (doc: any) => void,
            onDocumentLoadFailure: (error: any) => void
          ) => void;
        };
        EXTENSION: {
          ViewCubeUi: string;
          Toolbar: string;
          ModelStructurePanel: string;
          PropertiesPanel: string;
          LayerManager: string;
        };
      };
    };
  }
}

interface AutodeskViewerProps {
  /** URN of the translated model to display */
  urn?: string;
  /** File URL for upload and translation */
  fileUrl?: string;
  /** Custom className for styling */
  className?: string;
  /** Width of the viewer */
  width?: string | number;
  /** Height of the viewer */
  height?: string | number;
  /** Whether to show upload option */
  showUpload?: boolean;
  /** Called when model loads successfully */
  onLoad?: (viewer: any) => void;
  /** Called when there's an error loading */
  onError?: (error: Error) => void;
  /** Called when upload is successful */
  onUploadSuccess?: (result: any) => void;
}

// Load Autodesk Viewer SDK
const loadAutodeskViewer = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.Autodesk?.Viewing) {
      resolve();
      return;
    }

    // Create script element
    const script = document.createElement('script');
    script.src =
      'https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/viewer3D.min.js';
    script.async = true;

    script.onload = () => {
      // Initialize the viewer
      const options = {
        env: 'AutodeskProduction',
        api: 'derivativeV2', // Use US region to match our translation service
        endpoint: 'https://developer.api.autodesk.com',
        getAccessToken: async (
          callback: (token: string, expires: number) => void
        ) => {
          try {
            console.log('Fetching access token for viewer...');
            const response = await fetch('/api/aps/token');
            if (!response.ok) {
              throw new Error('Failed to get access token');
            }
            const data = await response.json();
            console.log('Access token retrieved successfully for viewer');
            callback(data.access_token, data.expires_in);
          } catch (error) {
            console.error('Token fetch error:', error);
            reject(error);
          }
        }
      };

      console.log('Initializing Autodesk Viewer with options:', options);
      window.Autodesk.Viewing.Initializer(options, () => {
        console.log('Autodesk Viewer initialized successfully');
        resolve();
      });
    };

    script.onerror = () => {
      reject(new Error('Failed to load Autodesk Viewer SDK'));
    };

    document.head.appendChild(script);

    // Also load CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href =
      'https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/style.min.css';
    document.head.appendChild(link);
  });
};

// Upload file component
const FileUpload: React.FC<{
  onUploadSuccess: (result: any) => void;
  onError: (error: Error) => void;
}> = ({ onUploadSuccess, onError }) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

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
      onUploadSuccess(result);

      toast.success(
        `Upload Successful: ${file.name} has been uploaded and translation started.`
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Upload failed';
      onError(new Error(errorMessage));

      toast.error(`Upload Failed: ${errorMessage}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".dwg,.dwf,.dwfx,.dxf,.ifc,.ige,.iges,.igs,.ipt,.iam,.idw,.ipn,.stp,.step,.stl,.obj,.3ds,.max,.rvt,.rfa,.rte,.rft,.f3d,.catpart,.catproduct,.cgr,.3dxml,.3dm,.nwd,.nwc,.nwf"
        onChange={handleFileSelect}
        disabled={isUploading}
        className="hidden"
      />
      <Button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        variant="outline"
        className="w-full"
      >
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Upload 3D Model
          </>
        )}
      </Button>
    </div>
  );
};

// Main Autodesk Viewer component
const AutodeskViewer: React.FC<AutodeskViewerProps> = ({
  urn,
  fileUrl,
  className,
  width = '100%',
  height = '400px',
  showUpload = false,
  onLoad,
  onError,
  onUploadSuccess
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewer, setViewer] = useState<any>(null);
  const [currentUrn, setCurrentUrn] = useState<string | undefined>(urn);
  const [translationStatus, setTranslationStatus] = useState<any>(null);

  const viewerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize Autodesk Viewer SDK
  useEffect(() => {
    const initViewer = async () => {
      try {
        setIsLoading(true);
        await loadAutodeskViewer();
        setIsInitialized(true);
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to initialize viewer';
        setError(errorMessage);
        if (onError) {
          onError(new Error(errorMessage));
        }
      } finally {
        setIsLoading(false);
      }
    };

    initViewer();
  }, [onError]);

  // Create viewer instance
  useEffect(() => {
    if (!isInitialized || !viewerRef.current || viewer) return;

    try {
      const viewerInstance = new window.Autodesk.Viewing.GuiViewer3D(
        viewerRef.current
      );

      const startedCode = viewerInstance.start();
      if (startedCode > 0) {
        console.error('Failed to create viewer');
        return;
      }

      setViewer(viewerInstance);

      if (onLoad) {
        onLoad(viewerInstance);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create viewer';
      setError(errorMessage);
      if (onError) {
        onError(new Error(errorMessage));
      }
    }
  }, [isInitialized, onLoad, onError, viewer]);

  // Load model when URN changes
  useEffect(() => {
    if (!viewer || !currentUrn) return;

    const loadModel = async () => {
      setIsLoading(true);
      setError(null);

      console.log('Starting model load process for URN:', currentUrn);

      // Helper function to determine if URN is already base64 encoded
      const isBase64Encoded = (str: string): boolean => {
        try {
          // Check if it's a valid base64 string without 'urn:' prefix
          const decoded = Buffer.from(str, 'base64').toString();
          return decoded.startsWith('urn:adsk.objects:os.object:');
        } catch {
          return false;
        }
      };

      // Check translation status first
      try {
        console.log('Checking translation status before loading...');
        const response = await fetch(`/api/aps/translate/${currentUrn}`);
        if (response.ok) {
          const status = await response.json();
          console.log('Translation status:', status);

          if (!status.isComplete) {
            console.log('Translation not complete, waiting...');
            setError('Model is still being translated. Please wait...');
            setIsLoading(false);
            return;
          }

          if (status.hasErrors) {
            console.log('Translation has errors:', status);
            setError('Translation failed with errors');
            setIsLoading(false);
            return;
          }
        }
      } catch (error) {
        console.warn('Could not check translation status:', error);
        // Continue anyway
      }

      // Determine the correct document ID format for the viewer
      let documentId: string;

      if (currentUrn.startsWith('urn:adsk.objects:os.object:')) {
        // Raw URN - needs to be base64 encoded
        const base64Urn = Buffer.from(currentUrn)
          .toString('base64')
          .replace(/=/g, '');
        documentId = `urn:${base64Urn}`;
        console.log('Encoded raw URN to base64 with urn: prefix:', documentId);
      } else if (isBase64Encoded(currentUrn)) {
        // Already base64 encoded - add urn: prefix if missing
        documentId = currentUrn.startsWith('urn:')
          ? currentUrn
          : `urn:${currentUrn}`;
        console.log('Using base64 URN with urn: prefix:', documentId);
      } else {
        // Assume it's already in the correct format, add urn: prefix if missing
        documentId = currentUrn.startsWith('urn:')
          ? currentUrn
          : `urn:${currentUrn}`;
        console.log('Using URN with urn: prefix:', documentId);
      }

      console.log('Loading document with URN:', documentId);

      window.Autodesk.Viewing.Document.load(
        documentId,
        (doc: any) => {
          console.log('Document loaded successfully:', doc);
          const viewables = doc.getRoot().getDefaultGeometry();
          if (viewables) {
            console.log('Found viewable geometry, loading into viewer...');
            viewer
              .loadDocumentNode(doc, viewables)
              .then(() => {
                console.log('Model loaded successfully into viewer');
                setIsLoading(false);
              })
              .catch((error: any) => {
                console.error('Failed to load model geometry:', error);
                const errorMessage = 'Failed to load model geometry';
                setError(errorMessage);
                setIsLoading(false);
                if (onError) {
                  onError(new Error(errorMessage));
                }
              });
          } else {
            console.warn('No viewable geometry found in document');
            const errorMessage = 'No viewable content found';
            setError(errorMessage);
            setIsLoading(false);
            if (onError) {
              onError(new Error(errorMessage));
            }
          }
        },
        (error: any) => {
          console.error('Document load error:', error);
          console.error('Failed URN:', documentId);
          const errorMessage = `Failed to load document: ${error.message || error}`;
          setError(errorMessage);
          setIsLoading(false);
          if (onError) {
            onError(new Error(errorMessage));
          }
        }
      );
    };

    loadModel();
  }, [viewer, currentUrn, onError, toast]);

  // Handle upload success
  const handleUploadSuccess = useCallback(
    (result: any) => {
      setCurrentUrn(result.translationUrn || result.objectId);

      // Poll for translation status
      const pollTranslation = async () => {
        try {
          const response = await fetch(
            `/api/aps/translate/${result.translationUrn || result.objectId}`
          );
          const status = await response.json();

          setTranslationStatus(status);

          if (status.isComplete) {
            setCurrentUrn(result.translationUrn || result.objectId);
          } else if (!status.hasErrors) {
            // Continue polling if not complete and no errors
            setTimeout(pollTranslation, 5000);
          }
        } catch (error) {
          console.error('Failed to check translation status:', error);
        }
      };

      pollTranslation();

      if (onUploadSuccess) {
        onUploadSuccess(result);
      }
    },
    [onUploadSuccess]
  );

  // Cleanup
  useEffect(() => {
    return () => {
      if (viewer) {
        try {
          viewer.finish();
        } catch (error) {
          console.error('Error cleaning up viewer:', error);
        }
      }
    };
  }, [viewer]);

  if (error) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-lg border border-red-200 bg-red-50',
          className
        )}
        style={{ width, height }}
      >
        <div className="flex flex-col items-center gap-2 text-red-600">
          <AlertTriangle className="h-8 w-8" />
          <div className="text-sm font-medium">Failed to load 3D viewer</div>
          <div className="text-xs text-center max-w-xs">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative rounded-lg border overflow-hidden bg-gray-100',
        className
      )}
      style={{ width, height }}
    >
      {/* Upload section */}
      {showUpload && !currentUrn && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/80">
          <div className="w-80 p-6 bg-background border rounded-lg shadow-lg">
            <h3 className="text-lg font-medium mb-4">Upload 3D Model</h3>
            <FileUpload
              onUploadSuccess={handleUploadSuccess}
              onError={(error) => {
                setError(error.message);
                if (onError) onError(error);
              }}
            />
          </div>
        </div>
      )}

      {/* Translation status */}
      {translationStatus &&
        !translationStatus.isComplete &&
        !translationStatus.hasErrors && (
          <div className="absolute top-4 left-4 z-10 bg-background border rounded-md p-3 shadow-lg">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <div className="text-sm">
                Translating model... {translationStatus.progress}
              </div>
            </div>
          </div>
        )}

      {/* Loading indicator */}
      {(isLoading || !isInitialized) && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <div className="text-sm">
              {!isInitialized ? 'Initializing viewer...' : 'Loading model...'}
            </div>
          </div>
        </div>
      )}

      {/* Viewer container */}
      <div
        ref={viewerRef}
        className="w-full h-full"
        style={{ minHeight: '200px' }}
      />
    </div>
  );
};

export default AutodeskViewer;
