'use client';

import { FC, Suspense, useEffect, useState } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, Stage } from '@react-three/drei';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { getFileUrlFromKey } from '@/lib/actions';
import { Mesh } from 'three';
import ThreeDViewer from './three-d-viewer';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      mesh: any;
      meshStandardMaterial: any;
      ambientLight: any;
      pointLight: any;
      primitive: any;
      directionalLight: any;
      gridHelper: any;
      color: any;
    }
  }
}

interface STLViewerProps {
  filePath: string;
  fileType: string;
  key: string;
  gltfUrl?: string; // Optional GLTF URL for enhanced viewing
  className?: string;
  height?: string | number;
}

const Model: FC<{ url: string }> = ({ url }) => {
  const geometry = useLoader(STLLoader, url);
  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial color="#bbb" roughness={0.5} metalness={0.2} />
    </mesh>
  );
};

const STLViewer: FC<STLViewerProps> = ({
  filePath,
  key,
  fileType,
  gltfUrl,
  className,
  height = '400px'
}) => {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  useEffect(() => {
    const fetchFile = async () => {
      try {
        const isStep =
          filePath.toLowerCase().endsWith('.stp') ||
          filePath.toLowerCase().endsWith('.step');
        const isStl = filePath.toLowerCase().endsWith('.stl');
        const isGltf =
          filePath.toLowerCase().endsWith('.gltf') ||
          filePath.toLowerCase().endsWith('.glb');

        if (!isStl && !isStep && !isGltf) {
          setError(
            'Only STL, STEP, and GLTF files are supported in this viewer'
          );
          return;
        }

        // If we have a GLTF URL provided, we don't need to fetch anything else
        if (gltfUrl) {
          setFileUrl(gltfUrl);
          return;
        }

        const response = await getFileUrlFromKey(key);
        if (!response.success || !('url' in response) || !response.url) {
          const errorMessage =
            'error' in response && response.error
              ? response.error
              : 'Failed to get file URL';
          setError(errorMessage);
          console.error('Error fetching file:', errorMessage);
          return;
        }

        if (isStl || isGltf) {
          setFileUrl(response.url);
        } else {
          // Handle STEP file conversion (keeping original commented code for reference)
          setIsConverting(true);
          //   try {
          //     // Fetch the STEP file
          //     const stepResponse = await fetch(response.url)
          //     const stepBlob = await stepResponse.blob()
          //     const stepFile = new File([stepBlob], filePath.split('/').pop() || 'model.stp', { type: 'model/step' })

          //     // Convert to STL
          //     const stlFile = await convertStepToStl(stepFile)

          //     // Create a temporary URL for the converted STL
          //     const stlUrl = URL.createObjectURL(stlFile)
          //     setFileUrl(stlUrl)

          //     // Clean up the URL when component unmounts
          //     return () => {
          //       URL.revokeObjectURL(stlUrl)
          //     }
          //   } catch (conversionError) {
          //     console.error('Error converting STEP to STL:', conversionError)
          //     setError('Failed to convert STEP file to STL')
          //   } finally {
          //     setIsConverting(false)
          //   }
          setError(
            'STEP file conversion not implemented. Please provide a GLTF URL for enhanced viewing.'
          );
          setIsConverting(false);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'An unknown error occurred';
        setError(errorMessage);
        console.error('Error fetching file:', error);
      }
    };

    fetchFile();
  }, [filePath, gltfUrl]);

  if (error) {
    return (
      <div
        className={`w-full flex items-center justify-center border border-red-200 bg-red-50 rounded-lg ${className}`}
        style={{ height }}
      >
        <div className="text-red-600 text-sm text-center p-4">
          <p className="font-medium">Failed to load 3D model</p>
          <p className="text-xs mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!fileUrl || isConverting) {
    return (
      <div
        className={`w-full flex items-center justify-center border rounded-lg ${className}`}
        style={{ height }}
      >
        <div className="text-muted-foreground">
          {isConverting ? 'Converting STEP file...' : 'Loading...'}
        </div>
      </div>
    );
  }

  // Determine file type for the viewer
  const getFileType = (path: string, url?: string): string => {
    const checkUrl = url || path;
    if (checkUrl.toLowerCase().includes('.gltf')) return 'gltf';
    if (checkUrl.toLowerCase().includes('.glb')) return 'glb';
    if (checkUrl.toLowerCase().includes('.stl')) return 'stl';
    return 'stl'; // fallback
  };

  const actualFileType = getFileType(filePath, fileUrl);

  // Use ThreeDViewer for GLTF files or when gltfUrl is provided
  if (gltfUrl || actualFileType === 'gltf' || actualFileType === 'glb') {
    return (
      <ThreeDViewer
        fileUrl={fileUrl}
        fileType={actualFileType}
        height={height}
        className={className}
        showGrid={true}
        environment="studio"
        onLoad={(model) => {
          console.log('3D model loaded successfully:', model);
        }}
        onError={(error) => {
          console.error('Error loading 3D model:', error);
        }}
      />
    );
  }

  // Fallback to original STL viewer for STL files
  return (
    <div className={`w-full relative ${className}`} style={{ height }}>
      <Canvas shadows camera={{ position: [75, 75, 75], fov: 50 }}>
        <Suspense fallback={null}>
          <color attach="background" args={['#f8f9fa']} />
          <ambientLight intensity={0.5} />
          <directionalLight
            position={[10, 10, 10]}
            intensity={1}
            castShadow
            shadow-mapSize={[1024, 1024]}
          />
          <directionalLight position={[-10, -10, -10]} intensity={0.3} />
          <Model url={fileUrl} />
          <OrbitControls
            makeDefault
            autoRotate={false}
            enableZoom={true}
            enablePan={true}
            minPolarAngle={0}
            maxPolarAngle={Math.PI}
          />
          {/* <gridHelper args={[100, 100]} /> */}
        </Suspense>
      </Canvas>
    </div>
  );
};

export default STLViewer;
