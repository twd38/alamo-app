'use client'

import { FC, Suspense, useEffect, useState } from 'react'
import { Canvas, useLoader } from '@react-three/fiber'
import { OrbitControls, Stage } from '@react-three/drei'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader'
import { getPresignedFileUrl } from '@/lib/actions'
import { Mesh } from 'three'

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      mesh: any
      meshStandardMaterial: any
      ambientLight: any
      pointLight: any
      primitive: any
      directionalLight: any
      gridHelper: any
      color: any
    }
  }
}

interface STLViewerProps {
  filePath: string
  fileType: string
}

const Model: FC<{ url: string }> = ({ url }) => {
  const geometry = useLoader(STLLoader, url)
  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial
        color="#bbb"
        roughness={0.5}
        metalness={0.2}
      />
    </mesh>
  )
}

const STLViewer: FC<STLViewerProps> = ({ filePath, fileType }) => {
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isConverting, setIsConverting] = useState(false)

  useEffect(() => {
    const fetchFile = async () => {
      try {
        const isStep = filePath.toLowerCase().endsWith('.stp') || filePath.toLowerCase().endsWith('.step')
        const isStl = filePath.toLowerCase().endsWith('.stl')

        if (!isStl && !isStep) {
          setError('Only STL and STEP files are supported in this viewer')
          return
        }

        const response = await getPresignedFileUrl(filePath)
        if (!response.success || !('url' in response) || !response.url) {
          const errorMessage = 'error' in response && response.error ? response.error : 'Failed to get file URL'
          setError(errorMessage)
          console.error('Error fetching file:', errorMessage)
          return
        }

        if (isStl) {
          setFileUrl(response.url)
        } else {
          // Handle STEP file conversion
          setIsConverting(true)
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
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
        setError(errorMessage)
        console.error('Error fetching file:', error)
      }
    }

    fetchFile()
  }, [filePath])

  if (error) {
    return (null)
  }

  if (!fileUrl || isConverting) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center">
        {isConverting ? 'Converting STEP file...' : 'Loading...'}
      </div>
    )
  }

  return (
    <div className="w-full h-[400px] relative">
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
          <directionalLight
            position={[-10, -10, -10]}
            intensity={0.3}
          />
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
  )
}

export default STLViewer