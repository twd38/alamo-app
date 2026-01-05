'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import { SearchBox } from '@mapbox/search-js-react';
import 'mapbox-gl/dist/mapbox-gl.css';
import { ReactNode } from 'react';
import {
  getParcelDetail,
  ParcelDetail,
  getDevelopmentPlan,
  getFloodZone,
  FloodZoneData
} from '../queries';
import { PropertyDetail } from './property-detail';
import { useSearchParams, useRouter } from 'next/navigation';
import { throttle, debounce } from 'lodash';
import { acresToSquareFeet } from '@/lib/utils';
import type { DevelopmentPlan } from '@prisma/client';
import { Button } from '@/components/ui/button';
import DevelopmentPlansModal from './development-plans-modal';
import { Hammer } from 'lucide-react';
import DevelopableParcelsSidebar from './developable-parcels-sidebar';
import { useQueryState } from 'nuqs';

// Properly type the SearchBox component
type SearchBoxType = typeof SearchBox & {
  (props: any): ReactNode;
};

const TypedSearchBox = SearchBox as SearchBoxType;
const INITIAL_CENTER: [number, number] = [-97.7235671, 30.2540749];
const INITIAL_ZOOM = 13;

const Map = () => {
  const mapRef = useRef<mapboxgl.Map | undefined>(undefined);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const mapboxAccessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';
  /**
   * Mapbox tileset ID for Travis County parcels. Expected format: <username>.tx_travis_parcels.
   * Expose as NEXT_PUBLIC_PARCELS_TILESET_ID in the environment. Falls back to the bare layer name when not provided
   * so that you can hard-code the `url` below if desired.
   */
  const parcelsTilesetId =
    process.env.NEXT_PUBLIC_PARCELS_TILESET_ID ||
    'americanhousing.tx_travis_parcels';

  const [center, setCenter] = useState(INITIAL_CENTER);
  const [zoom, setZoom] = useState(INITIAL_ZOOM);
  const [searchValue, setSearchValue] = useState('');
  const [openDevelopmentPlansModal, setOpenDevelopmentPlansModal] =
    useState(false);
  const [parcelData, setParcelData] = useState<ParcelDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [floodZoneData, setFloodZoneData] = useState<FloodZoneData | null>(null);

  // Selected development-plan details (full object)
  const [planDetail, setPlanDetail] = useState<DevelopmentPlan | null>(null);

  const queryParams = useSearchParams();
  const router = useRouter();

  const view = queryParams.get('view');
  const address = queryParams.get('address');

  const [developmentPlan, setDevelopmentPlan] =
    useQueryState('developmentPlan');

  const DEVELOPABLE_SRC_ID = 'developable-parcels-src';
  const developableMarkersRef = useRef<mapboxgl.Marker[]>([]); // legacy; no longer used

  // Maximum number of developable parcels to display at any given time
  const MAX_DEVELOPABLE_PARCELS = 100;

  // Vector source & layer identifiers – keep them in constants so we only need to change in one place if required.
  const PARCEL_SOURCE_ID = 'tx-travis-parcels' as const;
  const PARCEL_FILL_LAYER_ID = 'parcels-fill' as const;
  const PARCEL_OUTLINE_LAYER_ID = 'parcels-outline' as const;
  // Tileset recipe indicates the internal layer is named "parcel"
  const PARCEL_SOURCE_LAYER = 'parcel' as const;

  /**
   * Store the numeric minimum lot-area requirement (sqft) from the selected development plan.
   * Null means either no plan selected or the plan is still loading.
   */
  const [planMinLotArea, setPlanMinLotArea] = useState<number | null>(null);

  // After planMinLotArea state declaration, add local filter state synced with planMinLotArea
  const [parcelAreaMin, setParcelAreaMin] = useState<string>(
    planMinLotArea ? String(planMinLotArea) : ''
  );

  /**
   * Count developable parcels from the full tileset source using the current minimum lot area filter.
   * @returns The total number of parcels meeting the developable criteria.
   */
  const getDevelopableParcelCount = useCallback(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return 0;

    // Query all vector-source features (no bounding box filter)
    const features: mapboxgl.MapboxGeoJSONFeature[] = map.querySourceFeatures(
      PARCEL_SOURCE_ID,
      { sourceLayer: PARCEL_SOURCE_LAYER }
    );

    // Filter by area and count
    const count = features.reduce<number>((count, feature) => {
      const props = feature.properties as Record<string, unknown>;
      const lotAreaSqft: number =
        typeof props.ll_gissqft === 'number'
          ? props.ll_gissqft
          : typeof props.gisacre === 'number'
            ? acresToSquareFeet(props.gisacre)
            : 0;

      const isDevelopable =
        planMinLotArea === null ||
        (Number.isFinite(lotAreaSqft) && lotAreaSqft >= planMinLotArea);

      return isDevelopable ? count + 1 : count;
    }, 0);

    setFullDevelopableCount(count);
  }, [planMinLotArea]);

  useEffect(() => {
    getDevelopableParcelCount();
  }, [developmentPlan, getDevelopableParcelCount]);

  // Fetch development-plan details whenever the id changes
  useEffect(() => {
    if (!developmentPlan) {
      setPlanMinLotArea(null);
      return;
    }

    // Lightweight API call – SSR route in /api/development-plan/[id]
    const fetchPlan = async () => {
      try {
        const plan = await getDevelopmentPlan(developmentPlan);
        setPlanDetail(plan as any);
        const minArea: number | null = (plan as any)?.minimumLotArea ?? null;
        setPlanMinLotArea(
          typeof minArea === 'number' && Number.isFinite(minArea)
            ? minArea
            : null
        );
        console.warn('[Development-Plan] Loaded – minimumLotArea:', minArea);
      } catch (err) {
        console.error('Failed to load development plan:', err);
        setPlanMinLotArea(null);
      }
    };

    fetchPlan();
  }, [developmentPlan]);

  // Sync the parcel-area input whenever the development-plan minimum lot area changes
  useEffect(() => {
    if (planMinLotArea !== null) {
      setParcelAreaMin(String(planMinLotArea));
    }
  }, [planMinLotArea]);

  const handleMapClick = useCallback(
    async (e: mapboxgl.MapMouseEvent) => {
      setParcelData(null);
      setFloodZoneData(null);

      const features = mapRef?.current?.queryRenderedFeatures(e.point, {
        layers: [PARCEL_FILL_LAYER_ID]
      });

      if (!features || features.length === 0) return;

      const props = features[0].properties as { [k: string]: unknown };
      const address = (props.address ?? '') as string;
      const city = (props.city ?? props.scity ?? '') as string;
      const state = (props.state2 ?? props.state ?? '') as string;
      const zip = (props.szip ?? props.szip5 ?? '') as string;
      const fullAddress = `${address}, ${city}, ${state} ${zip}`;

      const { lng, lat } = e.lngLat;

      // update the center of the map
      if (markerRef.current && mapRef.current) {
        mapRef.current.flyTo({
          center: [lng, lat]
        });

        markerRef.current.setLngLat([lng, lat]).addTo(mapRef.current);
      }

      // Include coordinates in URL so mock data can use the actual clicked location
      router.push(`/explorer?view=property_detail&address=${encodeURIComponent(fullAddress)}&lat=${lat}&lng=${lng}`);
    },
    [router]
  );

  // Initialize the map and add layers
  useEffect(() => {
    if (!mapContainerRef.current) return;

    mapboxgl.accessToken = mapboxAccessToken;
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/standard',
      center,
      zoom
    });

    // Create marker but don't add to map yet
    markerRef.current = new mapboxgl.Marker({
      color: '#3b82f6'
    });

    // Add map navigation controls
    mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Change cursor to pointer when hovering over clickable areas
    mapRef.current.getCanvas().style.cursor = 'default';

    // Add parcel vector tiles (Mapbox tileset) once the base style has loaded
    mapRef.current.on('load', () => {
      // Build the Mapbox vector source URL. It must have the `mapbox://` prefix.
      // If you defined NEXT_PUBLIC_PARCELS_TILESET_ID as &ldquo;&lt;username&gt;.tx_travis_parcels&rdquo; this will resolve correctly.
      const sourceUrl = `mapbox://${parcelsTilesetId}`;

      // Bail early if the URL is not well formed – helps during local development
      if (!sourceUrl.startsWith('mapbox://')) {
        console.error(
          'Invalid parcels tileset id. Expected format &ldquo;&lt;username&gt;.tx_travis_parcels&rdquo;'
        );
        return;
      }

      if (!mapRef.current?.getSource(PARCEL_SOURCE_ID)) {
        mapRef.current?.addSource(PARCEL_SOURCE_ID, {
          type: 'vector',
          url: sourceUrl,
          promoteId: 'parcelnumb' // promote the parcel id for feature-state & faster lookups
        });

        // The tilejson response contains a unique `id` that must be used
        // as the `source-layer` value when styling / querying the tiles.

        // Add the fill layer – use the dynamic source-layer id that came back
        mapRef.current?.addLayer({
          id: PARCEL_FILL_LAYER_ID,
          type: 'fill',
          source: PARCEL_SOURCE_ID,
          'source-layer': PARCEL_SOURCE_LAYER,
          paint: {
            'fill-color': '#3b82f6',
            'fill-opacity': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              0.25, // Hover opacity
              0 // Default opacity
            ],
            'fill-outline-color': '#088'
          }
        });

        // Add a thin line layer on top for clearer parcel borders
        if (!mapRef.current?.getLayer(PARCEL_OUTLINE_LAYER_ID)) {
          mapRef.current?.addLayer({
            id: PARCEL_OUTLINE_LAYER_ID,
            type: 'line',
            source: PARCEL_SOURCE_ID,
            'source-layer': PARCEL_SOURCE_LAYER,
            paint: {
              'line-color': '#3b82f6',
              'line-width': 1
            }
          });
        }

        // Determine an appropriate label layer to insert below (first symbol layer)
        let beforeLayerId: string | undefined;
        const style = mapRef.current?.getStyle();

        if (style && style.layers) {
          const symbolLayer = style.layers.find((l) => l.type === 'symbol');
          if (symbolLayer) {
            beforeLayerId = symbolLayer.id;
          }
        }

        mapRef.current?.addLayer(
          {
            id: 'parcels-layer', // invisible layer for feature querying
            type: 'fill',
            source: PARCEL_SOURCE_ID,
            'source-layer': PARCEL_SOURCE_LAYER,
            paint: {
              'fill-color': '#3b82f6',
              'fill-opacity': 0
            },
            layout: {
              visibility: 'visible'
            }
          },
          beforeLayerId
        );

        // Create the popup once the map & layer are ready
        if (!popupRef.current) {
          popupRef.current = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false
          });
        }
      }

      // On hover, show the popup and change fill color
      let hoveredParcelId: number | string | null = null;
      mapRef.current?.on(
        'mousemove',
        PARCEL_FILL_LAYER_ID,
        throttle((e) => {
          if (!e.features?.length) return;
          const f = e.features[0] as mapboxgl.MapboxGeoJSONFeature;
          const props = f.properties as { [k: string]: unknown };
          const id = f.id as number | string | undefined;

          // fields exposed by Mapbox tiles
          const address = props.address;
          const zoning = props.zoning;
          const gisAcre = props.gisacre as number;
          const parcelArea = gisAcre
            ? acresToSquareFeet(gisAcre)
            : props.ll_gissqft;

          // Manage feature-state hover toggle
          if (id !== undefined) {
            if (hoveredParcelId !== null && hoveredParcelId !== id) {
              mapRef.current?.setFeatureState(
                {
                  source: PARCEL_SOURCE_ID,
                  sourceLayer: PARCEL_SOURCE_LAYER,
                  id: hoveredParcelId
                },
                { hover: false }
              );
            }
            if (hoveredParcelId !== id) {
              hoveredParcelId = id;
              mapRef.current?.setFeatureState(
                {
                  source: PARCEL_SOURCE_ID,
                  sourceLayer: PARCEL_SOURCE_LAYER,
                  id: hoveredParcelId
                },
                { hover: true }
              );
            }
          }

          // console.log(props)

          // set the popup content
          popupRef
            .current!.setLngLat((e.lngLat as mapboxgl.LngLatLike)!)
            .setHTML(
              `<div style="min-width:200px;">
                      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                        <span style="font-weight:600;">Address:</span>
                        <span style="text-align:right;">${address}</span>
                      </div>
                      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                        <span style="font-weight:600;">Zoning:</span>
                        <span style="text-align:right;">${zoning}</span>
                      </div>
                      <div style="display:flex;justify-content:space-between;align-items:center;">
                        <span style="font-weight:600;">Parcel Area:</span>
                        <span style="text-align:right;">${Number(parcelArea).toLocaleString()} ft<sup>2</sup></span>
                      </div>
                    </div>`
            )
            .addTo(mapRef.current!);
        }, 100)
      );

      mapRef.current?.on('mouseleave', PARCEL_FILL_LAYER_ID, () => {
        // Remove hover effect & popup
        if (hoveredParcelId !== null) {
          mapRef.current?.setFeatureState(
            {
              source: PARCEL_SOURCE_ID,
              sourceLayer: PARCEL_SOURCE_LAYER,
              id: hoveredParcelId
            },
            { hover: false }
          );
        }
        hoveredParcelId = null;
        popupRef.current?.remove();
      });

      // Register click handler *after* the layer exists to avoid the
      // "The provided layerId parameter is invalid" runtime error.
      mapRef.current?.on('click', PARCEL_FILL_LAYER_ID, handleMapClick);
    });

    return () => {
      mapRef.current?.remove();
    };
  }, [center, zoom, mapboxAccessToken, parcelsTilesetId, handleMapClick]);

  // Fetch parcel data when an address is selected
  useEffect(() => {
    const fetchParcelData = async () => {
      if (address) {
        try {
          setError(null);

          // Get coordinates from URL if available (from map click)
          const urlLat = queryParams.get('lat');
          const urlLng = queryParams.get('lng');
          const hasUrlCoords = urlLat && urlLng;

          // Single API call to Regrid with return_zoning=true gets both parcel and zoning data
          // Pass URL coordinates so mock data uses the actual clicked location
          const parcelResult = await getParcelDetail(
            address,
            hasUrlCoords ? { lat: parseFloat(urlLat), lng: parseFloat(urlLng) } : undefined
          );

          if (parcelResult.success && parcelResult.data) {
            setParcelData(parcelResult.data);
          } else {
            setError(parcelResult.error || 'Failed to fetch property data');
            setParcelData(null);
          }

          // Use URL coordinates if available, otherwise use API result
          const lng = hasUrlCoords ? parseFloat(urlLng) : parcelResult.data?.longitude;
          const lat = hasUrlCoords ? parseFloat(urlLat) : parcelResult.data?.latitude;

          // Fetch flood zone data if we have coordinates
          if (lat && lng) {
            const floodResult = await getFloodZone(lat, lng);
            if (floodResult.success && floodResult.data) {
              setFloodZoneData(floodResult.data);
            } else {
              // Don't set error for flood zone - it's optional
              console.warn('Failed to fetch flood zone data:', floodResult.error);
              setFloodZoneData(null);
            }
          }

          // Only fly to location if we DON'T have URL coords (meaning this is from search, not click)
          // When clicking on map, handleMapClick already flies to the location
          if (markerRef.current && mapRef.current && lng && lat && !hasUrlCoords) {
            markerRef.current.setLngLat([lng, lat]).addTo(mapRef.current);

            // Fly to the location
            mapRef.current.flyTo({
              center: [lng, lat]
            });
          }
        } catch (err) {
          setError('An unexpected error occurred');
          setParcelData(null);
          setFloodZoneData(null);
        }
      }
    };

    fetchParcelData();
  }, [address, queryParams]);

  /**
   * Helper: remove all developable parcel markers
   */
  const clearDevelopableMarkers = useCallback(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    // Remove Mapbox layers & source for developable parcels if they exist
    if (map.getLayer('cluster-count')) map.removeLayer('cluster-count');
    if (map.getLayer('clusters')) map.removeLayer('clusters');
    if (map.getLayer('unclustered-point')) map.removeLayer('unclustered-point');
    if (map.getSource(DEVELOPABLE_SRC_ID)) map.removeSource(DEVELOPABLE_SRC_ID);

    // Clear local sidebar listing and cached bounds so next fetch executes
    setDevelopableList([]);
    // setFullDevelopableCount(0);
    lastFetchedBoundsRef.current = null;
  }, []);

  /**
   * Helper: centroid of first polygon ring
   */
  const getPolygonCentroid = (coordinates: number[][]): [number, number] => {
    const count = coordinates.length;
    const [lngSum, latSum] = coordinates.reduce<[number, number]>(
      (acc, [lng, lat]) => [acc[0] + lng, acc[1] + lat],
      [0, 0]
    );
    return [lngSum / count, latSum / count];
  };

  /**
   * Internal helper type representing a developable parcel and its pre-computed centroid & distance-squared
   * from the current map centre. Used solely for in-memory sorting and limiting.
   */
  type DevelopableEntry = {
    feature: mapboxgl.MapboxGeoJSONFeature;
    centroid: [number, number];
    distSq: number;
  };

  /**
   * Cache: track the last viewport that was fetched to avoid duplicate network calls
   */
  const lastFetchedBoundsRef = useRef<mapboxgl.LngLatBounds | null>(null);

  /**
   * Effect: Fetch and display developable parcels as markers when a development plan is selected.
   * Cleans up old markers before adding new ones.
   */
  const fetchAndShowDevelopableParcels = useCallback((): void => {
    if (!developmentPlan || !mapRef.current) return;

    const map = mapRef.current;

    // Ensure the parcels layer is present before querying features
    if (!map.isStyleLoaded() || !map.getLayer(PARCEL_FILL_LAYER_ID)) {
      return; // style not yet ready; will retry on next invocation
    }

    try {
      const currentBounds = map.getBounds?.();
      if (!currentBounds) return; // cannot determine viewport

      // Avoid redundant processing for the same viewport
      if (
        lastFetchedBoundsRef.current &&
        lastFetchedBoundsRef.current.getCenter() === currentBounds.getCenter()
      ) {
        return;
      }

      setIsLoading(true);
      setError(null);

      // Define bounding box in pixel space for efficient feature query
      const swPixel = map.project(currentBounds.getSouthWest());
      const nePixel = map.project(currentBounds.getNorthEast());

      const rendered = map.queryRenderedFeatures(
        [
          [swPixel.x, nePixel.y] as [number, number], // top-left pixel
          [nePixel.x, swPixel.y] as [number, number] // bottom-right pixel
        ],
        {
          layers: [PARCEL_FILL_LAYER_ID]
        }
      ) as mapboxgl.MapboxGeoJSONFeature[];

      // Use the fetched development-plan minimum lot-area requirement.
      const minLotAreaSqft = planMinLotArea ?? 0;

      // Filter developable parcels based on the lot-area requirement.
      const developable = rendered.filter((f) => {
        // Get the lot area in square feet.
        const lotAreaSqft = (f.properties as any)?.ll_gissqft
          ? (f.properties as any)?.ll_gissqft
          : acresToSquareFeet((f.properties as any)?.gisacre);

        if (!minLotAreaSqft) return true;
        return (
          typeof lotAreaSqft === 'number' &&
          Number.isFinite(lotAreaSqft) &&
          lotAreaSqft >= minLotAreaSqft
        );
      });

      // Map center – used to prioritise parcels closest to the current view centre
      const centerLngLat = map.getCenter();

      // Helper to compute centroid for any geometry type (point/polygon/multipolygon)
      const toCentroid = (
        feature: mapboxgl.MapboxGeoJSONFeature
      ): [number, number] | null => {
        if (feature.geometry.type === 'Point') {
          return feature.geometry.coordinates as [number, number];
        }
        if (feature.geometry.type === 'Polygon') {
          const ring: number[][] =
            (feature.geometry as any).coordinates?.[0] ?? [];
          return ring.length ? getPolygonCentroid(ring) : null;
        }
        if (feature.geometry.type === 'MultiPolygon') {
          const ring: number[][] =
            (feature.geometry as any).coordinates?.[0]?.[0] ?? [];
          return ring.length ? getPolygonCentroid(ring) : null;
        }
        return null;
      };

      // Sort developable parcels by distance to map centre & take only the closest N
      const sortedDevelopable: DevelopableEntry[] = developable
        .map((f): DevelopableEntry | null => {
          const centroid = toCentroid(f);
          if (!centroid) return null;
          const dx = centroid[0] - centerLngLat.lng;
          const dy = centroid[1] - centerLngLat.lat;
          const distSq = dx * dx + dy * dy; // squared Euclidean distance (good enough for small spans)
          return { feature: f, centroid, distSq };
        })
        .filter((d): d is DevelopableEntry => d !== null)
        .sort((a, b) => a.distSq - b.distSq) // nearest first
        .slice(0, MAX_DEVELOPABLE_PARCELS);

      // For future use: full list of candidate features (currently unused after limiting)
      const _limitedDevelopable: mapboxgl.MapboxGeoJSONFeature[] =
        sortedDevelopable.map((d) => d.feature);

      // --------------------------------------------------------------------------------
      // Build sidebar entries & GeoJSON point features for clustering in one pass.
      // --------------------------------------------------------------------------------

      const developableTempList: DevelopableListEntry[] = [];

      const pointFeatures: GeoJSON.Feature<GeoJSON.Point, any>[] =
        sortedDevelopable.map(({ centroid, feature }) => {
          const address =
            (feature.properties as any)?.address ||
            (feature.properties as any)?.headline ||
            'Unknown';
          const sqftRaw =
            (feature.properties as any)?.ll_gissqft ||
            (feature.properties as any)?.sqft ||
            null;
          // Additional attributes for sidebar listing
          const zoning = (feature.properties as any)?.zoning ?? null;
          const parcelValueRaw =
            (feature.properties as any)?.parval ??
            (feature.properties as any)?.parcel_value ??
            null;
          const parcelValue =
            typeof parcelValueRaw === 'number' &&
            Number.isFinite(parcelValueRaw)
              ? parcelValueRaw
              : Number.isFinite(Number(parcelValueRaw))
                ? Number(parcelValueRaw)
                : null;

          // Populate sidebar entry list (limited to the same max count)
          // We'll push into array then set state once outside loop for performance.
          developableTempList.push({
            id: feature.id as any,
            centroid,
            address,
            sqft:
              typeof sqftRaw === 'number' && Number.isFinite(sqftRaw)
                ? sqftRaw
                : null,
            zoning: typeof zoning === 'string' ? zoning : null,
            parcelValue,
            feature
          });

          return {
            type: 'Feature' as const,
            geometry: {
              type: 'Point' as const,
              coordinates: centroid
            },
            properties: {
              address,
              sqft:
                typeof sqftRaw === 'number' && Number.isFinite(sqftRaw)
                  ? sqftRaw
                  : null,
              zoning: typeof zoning === 'string' ? zoning : null,
              parcelValue
            }
          } satisfies GeoJSON.Feature<GeoJSON.Point, any>;
        });

      const geojson: GeoJSON.FeatureCollection<GeoJSON.Point> = {
        type: 'FeatureCollection',
        features: pointFeatures
      };

      // Add or update the clustered source & layers
      if (!map.getSource(DEVELOPABLE_SRC_ID)) {
        map.addSource(DEVELOPABLE_SRC_ID, {
          type: 'geojson',
          data: geojson,
          cluster: true,
          clusterRadius: 100,
          clusterMaxZoom: 15 // clusters exist only while zoom ≤ 15
        });

        // Cluster circles
        map.addLayer({
          id: 'clusters',
          type: 'circle',
          source: DEVELOPABLE_SRC_ID,
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': '#3b82f6',
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              12,
              10,
              24
              // 30, 20,
            ]
          }
        });

        // Cluster count labels
        map.addLayer({
          id: 'cluster-count',
          type: 'symbol',
          source: DEVELOPABLE_SRC_ID,
          filter: ['has', 'point_count'],
          layout: {
            'text-field': '{point_count_abbreviated}',
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            'text-size': 14
          },
          paint: { 'text-color': '#ffffff' }
        });

        // Unclustered individual point
        map.addLayer({
          id: 'unclustered-point',
          type: 'circle',
          source: DEVELOPABLE_SRC_ID,
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-color': '#3b82f6',
            'circle-radius': 6
          }
        });

        // On click: zoom into clusters
        map.on('click', 'clusters', (e) => {
          const clusteredFeatures = map.queryRenderedFeatures(e.point, {
            layers: ['clusters']
          });
          const clusterId = clusteredFeatures[0].properties?.cluster_id;
          (
            map.getSource(DEVELOPABLE_SRC_ID) as mapboxgl.GeoJSONSource
          ).getClusterExpansionZoom(clusterId, (err, zoom) => {
            if (err) return;
            const center = (clusteredFeatures[0].geometry as any)
              .coordinates as mapboxgl.LngLatLike;
            map.easeTo({ center, zoom: zoom || 12 });
          });
        });

        // Tooltip for individual developable parcel
        map.on('click', 'unclustered-point', (e) => {
          const props = e.features?.[0].properties as any;
          const coordinates = (
            e.features?.[0].geometry as any
          ).coordinates.slice();
          new mapboxgl.Popup()
            .setLngLat(coordinates as any)
            .setHTML(`<strong>Developable Parcel</strong><br/>${props.address}`)
            .addTo(map);
        });
      } else {
        const src = map.getSource(DEVELOPABLE_SRC_ID) as mapboxgl.GeoJSONSource;
        src.setData(geojson);
      }

      // Cache the bounds that were just processed
      lastFetchedBoundsRef.current = currentBounds;

      // Sync React state with the freshly generated list (after mapping to avoid
      // triggering multiple renders).
      setDevelopableList(developableTempList);
    } catch (err) {
      setError('Failed to identify developable parcels.');

      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [developmentPlan, planMinLotArea]);

  // Debounced version to avoid excessive calls while panning/zooming
  const debouncedFetchDevelopable = useMemo(
    () => debounce(fetchAndShowDevelopableParcels, 600),
    [fetchAndShowDevelopableParcels]
  );

  // Attach map moveend handler once map + developmentPlan ready – this fires after any pan or zoom,
  // ensuring the developable-parcels list stays in sync with the visible viewport.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !developmentPlan) return;

    const handler = () => debouncedFetchDevelopable();

    map.on('moveend', handler);

    return () => {
      map.off('moveend', handler);
    };
  }, [debouncedFetchDevelopable, developmentPlan]);

  // Trigger fetch on mount & when developmentPlan changes
  useEffect(() => {
    fetchAndShowDevelopableParcels();
    return () => {
      clearDevelopableMarkers();
    };
  }, [fetchAndShowDevelopableParcels, clearDevelopableMarkers]);

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
  };

  const handleSearchResultSelected = (result: any) => {
    // Extract address components from the search result
    const properties = result.features[0].properties;
    const fullAddress = properties.full_address;
    const lng = properties.coordinates.longitude;
    const lat = properties.coordinates.latitude;

    if (properties) {
      // Update marker on the map
      if (mapRef.current && properties.coordinates) {
        // Add marker to map
        if (markerRef.current) {
          markerRef.current.setLngLat([lng, lat]).addTo(mapRef.current);

          // Fly to the location
          mapRef.current.flyTo({
            center: [lng, lat]
            // zoom: 18,
          });
        }
      }
    }
  };

  const handleClosePropertyDetail = () => {
    router.push('/explorer');
    router.refresh();
  };

  /**
   * Local state: list of developable parcels (limited & sorted – kept in sync with the
   * GeoJSON source used for clustering).
   * Each entry includes the centroid coordinates so we can quickly pan the map when
   * the user interacts with the sidebar listing.
   */
  type DevelopableListEntry = {
    /** Underlying feature id – may be undefined for some geometries */
    id: string | number | undefined;
    /** Centroid coordinates ([lng, lat]) */
    centroid: [number, number];
    /** Human-readable address or fallback string */
    address: string;
    /** Lot area in square-feet (nullable) */
    sqft: number | null;
    /** Zoning code (nullable) */
    zoning: string | null;
    /** Parcel assessed value in USD (nullable) */
    parcelValue: number | null;
    /** Original Mapbox feature (for potential future use / highlighting) */
    feature: mapboxgl.MapboxGeoJSONFeature;
  };

  const [developableList, setDevelopableList] = useState<
    DevelopableListEntry[]
  >([]);
  const [fullDevelopableList, setFullDevelopableList] = useState<
    DevelopableListEntry[]
  >([]);
  // Track the total number of developable parcels (before client-side limiting)
  const [fullDevelopableCount, setFullDevelopableCount] = useState<number>(0);

  // Memoised list of parcels after applying the minimum-area filter (client-side only)
  // const filteredDevelopableList = useMemo(() => {
  //   const minSqft = Number(parcelAreaMin)
  //   if (Number.isFinite(minSqft) && minSqft > 0) {
  //     return developableList.filter((d) => (d.sqft ?? 0) >= minSqft)
  //   }
  //   return developableList
  // }, [developableList, parcelAreaMin])

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !developmentPlan) return;

    map.on('moveend', () => {
      const sourceFeatures = map.querySourceFeatures(DEVELOPABLE_SRC_ID);
      const clusterFeatures = sourceFeatures.filter(
        (f) => typeof f.properties?.point_count === 'number'
      );
      // eslint-disable-next-line no-console
      console.log(
        'zoom',
        map.getZoom().toFixed(1),
        'total',
        sourceFeatures.length,
        'clusters',
        clusterFeatures.length
      );
    });
  }, [developmentPlan]);

  return (
    <div className="flex flex-row h-full w-full">
      {/* Sidebar: property detail (when a single parcel selected) */}
      {view == 'property_detail' ? (
        <div className="w-1/4 min-w-[400px] flex flex-col overflow-y-auto max-h-[calc(100vh-48px)]">
          <PropertyDetail
            parcel={parcelData}
            floodZone={floodZoneData}
            onClose={handleClosePropertyDetail}
          />
        </div>
      ) : null}

      {/* Sidebar: developable parcels list (shown when a developmentPlan is active and property_detail not open) */}
      {developmentPlan && view !== 'property_detail' && (
        <DevelopableParcelsSidebar
          developableList={developableList}
          fullDevelopableCount={fullDevelopableCount}
          parcelAreaMin={parcelAreaMin}
          mapRef={mapRef}
          markerRef={markerRef}
          mapboxAccessToken={mapboxAccessToken}
          onClose={() => {
            const params = new URLSearchParams(
              Array.from(queryParams.entries())
            );
            params.delete('developmentPlan');
            router.push(`/explorer?${params.toString()}`);
          }}
        />
      )}

      {/* Map container - dynamic width depending on sidebar presence */}
      <div
        className={`relative ${view === 'property_detail' || (developmentPlan && view !== 'property_detail') ? 'w-3/4' : 'w-full'} h-full`}
      >
        <div className="absolute top-4 left-4 z-10 flex items-center space-x-2">
          <div className="w-[400px]">
            <TypedSearchBox
              options={{
                proximity: center,
                types: [
                  'postcode',
                  'place',
                  'locality',
                  'neighborhood',
                  'street',
                  'address'
                ]
              }}
              value={searchValue}
              onChange={handleSearchChange}
              onRetrieve={handleSearchResultSelected}
              accessToken={mapboxAccessToken}
              marker={false} // Disable the default marker, we'll use our own
              mapboxgl={mapboxgl}
              placeholder="Search for an address, city, zip, etc"
              map={mapRef.current}
              theme={{
                variables: {
                  fontFamily: '"Open Sans", sans-serif',
                  unit: '16px',
                  borderRadius: '8px',
                  boxShadow: '0px 2.44px 9.75px 0px rgba(95, 126, 155, 0.2)'
                }
              }}
            />
          </div>
          <Button
            variant="secondary"
            size="icon"
            className="rounded-lg h-9 w-9 bg-white"
            onClick={() => setOpenDevelopmentPlansModal(true)}
            aria-label="Open development plans"
          >
            <Hammer className="h-5 w-5" />
          </Button>
        </div>
        <div className="absolute bottom-4 left-4 z-10 bg-white p-2 rounded-md shadow-md text-xs text-gray-500">
          <p>Click anywhere on the map to select an address</p>
        </div>
        <div
          id="map-container"
          ref={mapContainerRef}
          className="w-full h-full"
        />
      </div>
      <DevelopmentPlansModal
        open={openDevelopmentPlansModal}
        onOpenChange={setOpenDevelopmentPlansModal}
      />
    </div>
  );
};

export default Map;
