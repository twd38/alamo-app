'use client';

import { Crosshair } from 'lucide-react';

interface MapFooterProps {
  zoom: number;
  center: [number, number]; // [lng, lat]
}

/**
 * Formats a coordinate value to a fixed number of decimal places
 */
function formatCoordinate(value: number, decimals: number = 5): string {
  return value.toFixed(decimals);
}

/**
 * Map footer component displaying zoom level and coordinates
 */
export function MapFooter({ zoom, center }: MapFooterProps) {
  const [lng, lat] = center;

  return (
    <div className="absolute bottom-4 right-4 z-10 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-md shadow-md text-xs text-gray-600 flex items-center gap-4">
      <div className="flex items-center gap-1.5">
        <span className="text-gray-400 font-medium">Zoom:</span>
        <span className="font-mono">{zoom.toFixed(1)}</span>
      </div>
      <div className="w-px h-4 bg-gray-200" />
      <div className="flex items-center gap-1.5">
        <Crosshair className="w-3 h-3 text-gray-400" />
        <span className="font-mono">
          {formatCoordinate(lat)}°, {formatCoordinate(lng)}°
        </span>
      </div>
    </div>
  );
}
