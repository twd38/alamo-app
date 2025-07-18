'use client';

import NextDynamic from 'next/dynamic';
import BasicTopBar from '@/components/layouts/basic-top-bar';
import { Loader2 } from 'lucide-react';

// Prevent static pre-rendering at build time
export const dynamic = 'force-dynamic';

// Dynamically import the Map component with no SSR
const MapComponent = NextDynamic(() => import('./components/map'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-full h-[calc(100vh-48px)] bg-gray-100">
      <Loader2 className="animate-spin" />
    </div>
  )
});

const ExplorerPage = () => {
  return (
    <div className="w-full h-full">
      <BasicTopBar />
      <MapComponent />
    </div>
  );
};

export default ExplorerPage;
