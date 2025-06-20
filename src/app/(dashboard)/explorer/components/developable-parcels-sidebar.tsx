'use client';

import { FC, MutableRefObject } from 'react';
import Image from 'next/image';
import mapboxgl from 'mapbox-gl';
import { Button } from '@/components/ui/button';
import { X, SlidersHorizontal } from 'lucide-react';

/**
 * Model of an individual developable‐parcel list entry.
 * Mirrors the structure defined in the parent Map component.
 */
export interface DevelopableListEntry {
  /** Underlying feature id – may be undefined for some geometries */
  id: string | number | undefined;
  /** Centroid coordinates ([lng, lat]) */
  centroid: [number, number];
  /** Human-readable address */
  address: string;
  /** Lot area in square-feet (nullable) */
  sqft: number | null;
  /** Zoning code (nullable) */
  zoning: string | null;
  /** Parcel assessed value in USD (nullable) */
  parcelValue: number | null;
  /** Original Mapbox feature (for potential future use / highlighting) */
  feature: mapboxgl.MapboxGeoJSONFeature;
}

interface DevelopableParcelsSidebarProps {
  /** Sub-set of developable parcels within the current viewport */
  developableList: DevelopableListEntry[];
  /** Total count of developable parcels (before client-side limiting) */
  fullDevelopableCount: number;
  /** Minimum parcel area filter (ft²) */
  parcelAreaMin: string | number;
  /** Map reference – used for panning/zooming interactions */
  mapRef: MutableRefObject<mapboxgl.Map | undefined>;
  /** Marker reference – reused so we don't create a new marker per click */
  markerRef: MutableRefObject<mapboxgl.Marker | null>;
  /** Public Mapbox access token – required for static map preview thumbnails */
  mapboxAccessToken: string;
  /** Handler invoked when the user closes the sidebar */
  onClose: () => void;
}

/**
 * UI component: sidebar listing developable parcels for the selected development plan.
 */
const DevelopableParcelsSidebar: FC<DevelopableParcelsSidebarProps> = ({
  developableList,
  fullDevelopableCount,
  parcelAreaMin,
  mapRef,
  markerRef,
  mapboxAccessToken,
  onClose
}) => {
  return (
    <div className="w-1/4 min-w-[375px] max-w-sm flex flex-col border-r border-gray-200 bg-white overflow-y-auto max-h-[calc(100vh-48px)]">
      {/* Header */}
      <div className="flex items-center justify-between py-1 px-3 border-b sticky top-0 bg-white z-20">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-medium text-gray-800">
            Developable Parcels
          </h1>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Close</span>
        </Button>
      </div>

      {/* Filters */}
      <div className="p-2 border-b">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 space-y-2">
            <div className="border border-green-500 rounded-md text-xs px-2 py-0.5 bg-white text-green-700 w-fit">
              Parcel area min: {parcelAreaMin} ft²
            </div>
            <Button
              variant="outline"
              className="flex items-center text-xs px-2 py-1 h-8"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </Button>
          </div>
          <div className="flex-2 text-gray-600 text-sm flex items-end">
            <span className="text-gray-600 text-xs">
              Showing {developableList.length} of{' '}
              {fullDevelopableCount.toLocaleString()} results
            </span>
          </div>
        </div>
      </div>

      {/* Property listings */}
      <div className="divide-y">
        {developableList.map((d) => {
          const [houseNumber, ...streetParts] = d.address.split(' ');
          const street = streetParts.join(' ');
          const imageUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/${d.centroid[0]},${d.centroid[1]},18,0,0/600x400?access_token=${mapboxAccessToken}`;

          const handleClick = () => {
            if (mapRef.current) {
              mapRef.current.easeTo({
                center: d.centroid,
                zoom: Math.max(mapRef.current.getZoom(), 15)
              });
            }
            if (markerRef.current) {
              markerRef.current.setLngLat(d.centroid).addTo(mapRef.current!);
            }
          };

          return (
            <div
              key={String(d.id) + d.centroid.join(',')}
              className="flex p-3 gap-3 cursor-pointer hover:bg-gray-50"
              onClick={handleClick}
            >
              <div className="relative w-32 h-24 flex-shrink-0 rounded-md overflow-hidden">
                <Image
                  src={imageUrl}
                  alt={d.address}
                  fill
                  className="object-cover"
                />
                <div className="absolute bottom-1 left-1 bg-white rounded-sm px-1 py-0.5 text-xs">
                  Mapbox
                </div>
              </div>

              <div className="flex-1">
                <h2 className="text-sm font-medium text-gray-900 mb-3">
                  {houseNumber} {street}
                </h2>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div className="text-gray-600">Zoning</div>
                  <div className="text-right font-medium">
                    {d.zoning ?? '—'}
                  </div>

                  <div className="text-gray-600">Lot size</div>
                  <div className="text-right font-medium">
                    {d.sqft !== null ? `${d.sqft.toLocaleString()} ft²` : '—'}
                  </div>

                  <div className="text-gray-600">Parcel value</div>
                  <div className="text-right font-medium">
                    {d.parcelValue !== null
                      ? `$${d.parcelValue.toLocaleString()}`
                      : '—'}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {developableList.length === 0 && (
          <div className="p-4 text-gray-500">
            No developable parcels match the criteria.
          </div>
        )}
      </div>
    </div>
  );
};

export default DevelopableParcelsSidebar;
