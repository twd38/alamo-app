'use client';

import React, { Suspense, useRef, useState, useCallback } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import {
  OrbitControls,
  Environment,
  Center,
  Bounds,
  Html,
  useProgress,
  Grid
} from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import * as THREE from 'three';
import { cn } from '@/lib/utils';
import {
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Home,
  Loader2,
  AlertTriangle,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface ThreeDViewerProps {
  /** URL of the 3D file to display */
  fileUrl: string;
  /** File type/format (gltf, glb, stl, obj) */
  fileType?: string;
  /** Custom className for styling */
  className?: string;
  /** Width of the viewer */
  width?: string | number;
  /** Height of the viewer */
  height?: string | number;
  /** Whether to show control buttons */
  showControls?: boolean;
  /** Whether to show grid */
  showGrid?: boolean;
  /** Background color */
  backgroundColor?: string;
  /** Camera position */
  cameraPosition?: [number, number, number];
  /** Enable auto-rotation */
  autoRotate?: boolean;
  /** Lighting environment preset */
  environment?: 'city' | 'forest' | 'dawn' | 'night' | 'studio' | 'sunset';
  /** Called when model loads successfully */
  onLoad?: (model: any) => void;
  /** Called when there's an error loading */
  onError?: (error: Error) => void;
}

// Loading indicator component
function LoadingFallback() {
  const { progress } = useProgress();

  return (
    <Html center>
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <div className="text-sm">Loading...</div>
        <div className="text-xs">{Math.round(progress)}%</div>
      </div>
    </Html>
  );
}

// Individual model components for each file type
function GLTFModel({
  fileUrl,
  onLoad,
  onError
}: {
  fileUrl: string;
  onLoad?: (model: any) => void;
  onError?: (error: Error) => void;
}) {
  const modelRef = useRef<THREE.Group>(null);
  const model = useLoader(GLTFLoader, fileUrl);

  // Apply grey material and wireframe to GLTF models
  React.useEffect(() => {
    if (model) {
      model.scene.traverse((child: any) => {
        if (child.isMesh) {
          // Override any existing material with our grey material
          child.material = new THREE.MeshStandardMaterial({
            color: 0x666666, // Medium grey
            roughness: 0.6,
            metalness: 0.1,
            transparent: false,
            opacity: 1.0
          });

          // Enable shadows
          child.castShadow = true;
          child.receiveShadow = true;

          // Add wireframe edges
          const edges = new THREE.EdgesGeometry(child.geometry);
          const edgesMaterial = new THREE.LineBasicMaterial({
            color: 0x000000,
            linewidth: 1
          });
          const wireframe = new THREE.LineSegments(edges, edgesMaterial);
          child.parent.add(wireframe);
        }
      });

      if (onLoad) {
        console.log('GLTF model loaded successfully:', model);
        onLoad(model);
      }
    }
  }, [model, onLoad]);

  return (
    <group ref={modelRef}>
      <primitive object={model.scene} />
    </group>
  );
}

function STLModel({
  fileUrl,
  onLoad,
  onError
}: {
  fileUrl: string;
  onLoad?: (model: any) => void;
  onError?: (error: Error) => void;
}) {
  const modelRef = useRef<THREE.Group>(null);
  const geometry = useLoader(STLLoader, fileUrl);
  const greyMaterial = new THREE.MeshStandardMaterial({
    color: 0x666666, // Medium grey for good visibility
    roughness: 0.6,
    metalness: 0.1,
    transparent: false,
    opacity: 1.0
  });

  console.log('STL: Creating mesh with grey material:', greyMaterial);

  const mesh = new THREE.Mesh(geometry, greyMaterial);

  // Create edges for wireframe lines
  const edges = new THREE.EdgesGeometry(geometry);
  const edgesMaterial = new THREE.LineBasicMaterial({
    color: 0x000000,
    linewidth: 1
  });
  const wireframe = new THREE.LineSegments(edges, edgesMaterial);

  // Enable shadows
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  // Create a group containing both mesh and wireframe
  const group = new THREE.Group();
  group.add(mesh);
  group.add(wireframe);

  const model = { scene: group };

  React.useEffect(() => {
    if (onLoad) {
      console.log('STL model loaded successfully:', model);
      onLoad(model);
    }
  }, [onLoad]);

  return (
    <group ref={modelRef}>
      <primitive object={group} />
    </group>
  );
}

function OBJModel({
  fileUrl,
  onLoad,
  onError
}: {
  fileUrl: string;
  onLoad?: (model: any) => void;
  onError?: (error: Error) => void;
}) {
  const modelRef = useRef<THREE.Group>(null);
  const object = useLoader(OBJLoader, fileUrl);

  // Apply material to OBJ models for better visibility
  React.useEffect(() => {
    object.traverse((child: any) => {
      if (child.isMesh) {
        console.log('OBJ: Applying grey material to mesh:', child.name);
        console.log('OBJ: Original material:', child.material);

        child.material = new THREE.MeshStandardMaterial({
          color: 0x666666, // Medium grey for good visibility
          roughness: 0.6,
          metalness: 0.1,
          transparent: false,
          opacity: 1.0
        });

        console.log('OBJ: New material applied:', child.material);

        // Enable shadows
        child.castShadow = true;
        child.receiveShadow = true;

        // Add wireframe edges
        const edges = new THREE.EdgesGeometry(child.geometry);
        const edgesMaterial = new THREE.LineBasicMaterial({
          color: 0x000000,
          linewidth: 1
        });
        const wireframe = new THREE.LineSegments(edges, edgesMaterial);
        child.parent.add(wireframe);
      }
    });
  }, [object]);

  const model = { scene: object };

  React.useEffect(() => {
    if (onLoad) {
      console.log('OBJ model loaded successfully:', model);
      onLoad(model);
    }
  }, [onLoad]);

  return (
    <group ref={modelRef}>
      <primitive object={object} />
    </group>
  );
}

// Error boundary component for 3D models
class ModelErrorBoundary extends React.Component<
  {
    children: React.ReactNode;
    fileType: string;
    onError?: (error: Error) => void;
  },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: {
    children: React.ReactNode;
    fileType: string;
    onError?: (error: Error) => void;
  }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Model loading error:', error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <Html center>
          <div className="flex flex-col items-center gap-2 text-red-500">
            <AlertTriangle className="h-8 w-8" />
            <div className="text-sm">Failed to load 3D model</div>
            <div className="text-xs">Format: {this.props.fileType}</div>
            {this.state.error && (
              <div className="text-xs text-center max-w-xs">
                {this.state.error.message}
              </div>
            )}
          </div>
        </Html>
      );
    }

    return (
      <React.Suspense fallback={<LoadingFallback />}>
        {this.props.children}
      </React.Suspense>
    );
  }
}

// Model wrapper that selects the appropriate model component
function Model({
  fileUrl,
  fileType,
  onLoad,
  onError
}: {
  fileUrl: string;
  fileType?: string;
  onLoad?: (model: any) => void;
  onError?: (error: Error) => void;
}) {
  // Determine file type from URL if not provided
  const getFileType = useCallback((url: string, type?: string): string => {
    if (type) return type.toLowerCase();
    const extension = url.split('.').pop()?.toLowerCase() || '';
    return extension;
  }, []);

  const actualFileType = getFileType(fileUrl, fileType);

  console.log('Loading model:', { fileUrl, actualFileType, fileType });

  // Return the appropriate model component
  switch (actualFileType) {
    case 'gltf':
    case 'glb':
      return (
        <ModelErrorBoundary fileType={actualFileType} onError={onError}>
          <GLTFModel fileUrl={fileUrl} onLoad={onLoad} onError={onError} />
        </ModelErrorBoundary>
      );
    case 'stl':
      return (
        <ModelErrorBoundary fileType={actualFileType} onError={onError}>
          <STLModel fileUrl={fileUrl} onLoad={onLoad} onError={onError} />
        </ModelErrorBoundary>
      );
    case 'obj':
      return (
        <ModelErrorBoundary fileType={actualFileType} onError={onError}>
          <OBJModel fileUrl={fileUrl} onLoad={onLoad} onError={onError} />
        </ModelErrorBoundary>
      );
    default:
      // Handle unsupported format
      React.useEffect(() => {
        const error = new Error(`Unsupported file type: ${actualFileType}`);
        console.error('Unsupported file type:', actualFileType);
        if (onError) {
          onError(error);
        }
      }, [actualFileType, onError]);

      return (
        <Html center>
          <div className="flex flex-col items-center gap-2 text-red-500">
            <AlertTriangle className="h-8 w-8" />
            <div className="text-sm">Unsupported file format</div>
            <div className="text-xs">Format: {actualFileType}</div>
          </div>
        </Html>
      );
  }
}

// Control buttons component
function ControlButtons({
  onReset,
  onZoomIn,
  onZoomOut,
  onResetView,
  onToggleFullscreen,
  isFullscreen
}: {
  onReset: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
}) {
  return (
    <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
      <button
        onClick={onToggleFullscreen}
        className="flex h-8 w-8 items-center justify-center rounded-md bg-background/80 backdrop-blur-sm border shadow-sm hover:bg-background/90 transition-colors"
        title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
      >
        {isFullscreen ? (
          <Minimize2 className="h-4 w-4" />
        ) : (
          <Maximize2 className="h-4 w-4" />
        )}
      </button>
      <button
        onClick={onResetView}
        className="flex h-8 w-8 items-center justify-center rounded-md bg-background/80 backdrop-blur-sm border shadow-sm hover:bg-background/90 transition-colors"
        title="Reset view"
      >
        <Home className="h-4 w-4" />
      </button>
      <button
        onClick={onZoomIn}
        className="flex h-8 w-8 items-center justify-center rounded-md bg-background/80 backdrop-blur-sm border shadow-sm hover:bg-background/90 transition-colors"
        title="Zoom in"
      >
        <ZoomIn className="h-4 w-4" />
      </button>
      <button
        onClick={onZoomOut}
        className="flex h-8 w-8 items-center justify-center rounded-md bg-background/80 backdrop-blur-sm border shadow-sm hover:bg-background/90 transition-colors"
        title="Zoom out"
      >
        <ZoomOut className="h-4 w-4" />
      </button>
      <button
        onClick={onReset}
        className="flex h-8 w-8 items-center justify-center rounded-md bg-background/80 backdrop-blur-sm border shadow-sm hover:bg-background/90 transition-colors"
        title="Reset rotation"
      >
        <RotateCcw className="h-4 w-4" />
      </button>
    </div>
  );
}

// Main 3D Viewer component
const ThreeDViewer: React.FC<ThreeDViewerProps> = ({
  fileUrl,
  fileType,
  className,
  width = '100%',
  height = '400px',
  showControls = true,
  showGrid = true,
  backgroundColor = '#f8f9fa',
  cameraPosition = [5, 5, 5],
  autoRotate = false,
  environment = 'studio',
  onLoad,
  onError
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValidatingUrl, setIsValidatingUrl] = useState(true);
  const controlsRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  console.log('ThreeDViewer - fileUrl:', fileUrl);
  console.log('ThreeDViewer - fileType:', fileType);

  const handleError = useCallback(
    (error: Error) => {
      console.error('ThreeDViewer Error:', error);
      setError(error.message);
      if (onError) {
        onError(error);
      }
    },
    [onError]
  );

  // Skip URL validation since CORS will be handled by the 3D loader
  React.useEffect(() => {
    if (!fileUrl) {
      setError('No file URL provided');
      setIsValidatingUrl(false);
      return;
    }

    console.log('Skipping URL validation - will be handled by 3D loader');
    setIsValidatingUrl(false);
  }, [fileUrl]);

  const handleReset = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  }, []);

  const handleZoomIn = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.dollyIn(1.2);
      controlsRef.current.update();
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.dollyOut(1.2);
      controlsRef.current.update();
    }
  }, []);

  const handleResetView = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.object.position.set(...cameraPosition);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  }, [cameraPosition]);

  const handleToggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  }, [isFullscreen]);

  // Listen for fullscreen changes
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

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
          <div className="text-sm font-medium">Failed to load 3D model</div>
          <div className="text-xs text-center max-w-xs">{error}</div>
          <div className="text-xs text-center text-muted-foreground mt-2">
            Check browser console for more details
          </div>
        </div>
      </div>
    );
  }

  if (isValidatingUrl) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-lg border',
          className
        )}
        style={{ width, height }}
      >
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <div className="text-sm">Validating file access...</div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative rounded-lg border overflow-hidden',
        isFullscreen && 'h-screen w-screen',
        className
      )}
      style={isFullscreen ? {} : { width, height }}
    >
      <Canvas
        camera={{ position: cameraPosition, fov: 75 }}
        style={{ background: backgroundColor }}
        gl={{ antialias: true, alpha: true }}
        shadows
      >
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1.0}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <directionalLight position={[-10, -10, -5]} intensity={0.3} />
        <directionalLight position={[0, 10, 0]} intensity={0.2} />

        {/* Environment */}
        <Environment preset={environment} />

        {/* Grid */}
        {showGrid && (
          <Grid
            position={[0, -1, 0]}
            args={[20, 20]}
            cellSize={1}
            cellThickness={0.5}
            sectionSize={5}
            sectionThickness={1}
            fadeDistance={25}
            cellColor="#cccccc"
            sectionColor="#999999"
          />
        )}

        {/* Controls */}
        <OrbitControls
          ref={controlsRef}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          autoRotate={autoRotate}
          autoRotateSpeed={2}
          dampingFactor={0.05}
          enableDamping={true}
        />

        {/* Model */}
        <Suspense fallback={<LoadingFallback />}>
          <Center>
            <Bounds fit clip observe margin={1.2}>
              <Model
                fileUrl={fileUrl}
                fileType={fileType}
                onLoad={onLoad}
                onError={handleError}
              />
            </Bounds>
          </Center>
        </Suspense>
      </Canvas>

      {/* Control buttons */}
      {showControls && (
        <ControlButtons
          onReset={handleReset}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetView={handleResetView}
          onToggleFullscreen={handleToggleFullscreen}
          isFullscreen={isFullscreen}
        />
      )}
    </div>
  );
};

export default ThreeDViewer;
