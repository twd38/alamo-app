'use client';

import { Suspense } from 'react';
import NextDynamic from 'next/dynamic';
import BasicTopBar from '@/components/layouts/basic-top-bar';

// Prevent static pre-rendering at build time
export const dynamic = 'force-dynamic';

// Dynamically import the Map component with no SSR
const MapComponent = NextDynamic(() => import('./components/map'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-full h-[calc(100vh-48px)] bg-gray-100">
      Loading map...
    </div>
  )
});

const ExplorerPage = () => {
  return (
    <div className="w-full h-full">
      <BasicTopBar />
      <Suspense
        fallback={
          <div className="flex items-center justify-center w-full h-[calc(100vh-48px)] bg-gray-100">
            Loading map...
          </div>
        }
      >
        <MapComponent />
      </Suspense>
    </div>
  );
};

export default ExplorerPage;
