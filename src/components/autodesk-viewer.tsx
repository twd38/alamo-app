'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Loader2, AlertTriangle, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  /** Custom className for styling */
  className?: string;
  /** Width of the viewer */
  width?: string | number;
  /** Height of the viewer */
  height?: string | number;
  /** Called when model loads successfully */
  onLoad?: (viewer: any) => void;
  /** Called when there's an error loading */
  onError?: (error: Error) => void;
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
            const response = await fetch('/api/aps/token');
            if (!response.ok) {
              throw new Error('Failed to get access token');
            }
            const data = await response.json();
            callback(data.access_token, data.expires_in);
          } catch (error) {
            console.error('Token fetch error:', error);
            reject(error);
          }
        }
      };

      window.Autodesk.Viewing.Initializer(options, () => {
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

// Main Autodesk Viewer component
const AutodeskViewer: React.FC<AutodeskViewerProps> = ({
  urn,
  className,
  width = '100%',
  height = '400px',
  onLoad,
  onError
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewer, setViewer] = useState<any>(null);

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
    if (!viewer || !urn) return;

    const loadModel = async () => {
      setIsLoading(true);
      setError(null);

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
        const response = await fetch(`/api/aps/translate/${urn}`);
        if (response.ok) {
          const status = await response.json();

          if (!status.isComplete) {
            setError('Model is still being translated. Please wait...');
            setIsLoading(false);
            return;
          }

          if (status.hasErrors) {
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

      if (urn.startsWith('urn:adsk.objects:os.object:')) {
        // Raw URN - needs to be base64 encoded
        const base64Urn = Buffer.from(urn).toString('base64').replace(/=/g, '');
        documentId = `urn:${base64Urn}`;
      } else if (isBase64Encoded(urn)) {
        // Already base64 encoded - add urn: prefix if missing
        documentId = urn.startsWith('urn:') ? urn : `urn:${urn}`;
      } else {
        // Assume it's already in the correct format, add urn: prefix if missing
        documentId = urn.startsWith('urn:') ? urn : `urn:${urn}`;
      }

      window.Autodesk.Viewing.Document.load(
        documentId,
        (doc: any) => {
          const viewables = doc.getRoot().getDefaultGeometry();
          if (viewables) {
            viewer
              .loadDocumentNode(doc, viewables)
              .then(() => {
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
  }, [viewer, urn, onError]);

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

  // Show no model message when URN is not provided
  if (!urn) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-lg border bg-secondary',
          className
        )}
        style={{ width, height }}
      >
        <div className="max-w-md p-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              No model available for this part. Please upload a 3D model on the
              part detail page.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

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
        'relative rounded-lg border overflow-hidden bg-muted/50',
        className
      )}
      style={{ width, height }}
    >
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
