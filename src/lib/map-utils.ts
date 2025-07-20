import mapboxgl from 'mapbox-gl';
import { acresToSquareFeet } from '@/lib/utils';

/**
 * Fetch all parcels from a Mapbox vector tileset source,
 * filter by minimum lot area requirement, and return the count of developable parcels.
 *
 * @param map - The Mapbox GL JS map instance.
 * @param sourceId - The ID of the vector source containing parcel data.
 * @param sourceLayer - The source-layer name within the vector tileset.
 * @param minLotAreaSqft - Minimum lot area in square feet. Use a non-positive value to disable filtering.
 * @returns The number of parcels meeting the developable criteria.
 * @throws Error if the map style is not yet loaded.
 */
export default function getDevelopableParcelCount(
  map: mapboxgl.Map,
  sourceId: string,
  sourceLayer: string,
  minLotAreaSqft: number
): number {
  if (!map.isStyleLoaded()) {
    throw new Error('Map style is not loaded.');
  }

  // Query all features from the source-layer (no bounding box filter)
  const rawFeatures: mapboxgl.MapboxGeoJSONFeature[] = map.querySourceFeatures(
    sourceId,
    { sourceLayer }
  );

  // Count features that meet the area requirement
  const count = rawFeatures.reduce<number>((count, feature) => {
    const props = feature.properties as Record<string, unknown>;

    // Determine lot area in square feet
    const lotAreaSqft: number = (() => {
      if (typeof props.ll_gissqft === 'number') {
        return props.ll_gissqft;
      }
      if (typeof props.gisacre === 'number') {
        return acresToSquareFeet(props.gisacre as number);
      }
      return 0;
    })();

    const isDevelopable =
      minLotAreaSqft <= 0 ||
      (Number.isFinite(lotAreaSqft) && lotAreaSqft >= minLotAreaSqft);

    return isDevelopable ? count + 1 : count;
  }, 0);

  return count;
}
