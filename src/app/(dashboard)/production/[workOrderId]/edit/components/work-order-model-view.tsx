'use client';

import AutodeskViewer from '@/components/autodesk-viewer';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface WorkOrderModelViewProps {
  apsUrn?: string;
}

export function WorkOrderModelView({ apsUrn }: WorkOrderModelViewProps) {
  return (
    <div className="p-4 h-full">
      {apsUrn ? (
        <AutodeskViewer
          urn={apsUrn}
          height="100%"
          className="rounded-lg shadow-sm"
          onLoad={(viewer: any) => {}}
          onError={(error: Error) => {
            console.error('Autodesk viewer error:', error);
            toast.error(`Viewer Error: ${error.message}`);
          }}
        />
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500 text-center">
            <p>No 3D model available for this part</p>
            <p className="text-sm mt-2">Upload a CAD file to view the model</p>
          </div>
        </div>
      )}
    </div>
  );
}
