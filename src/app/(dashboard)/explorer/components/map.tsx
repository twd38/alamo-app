'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import mapboxgl from 'mapbox-gl'
import { SearchBox } from '@mapbox/search-js-react'
import 'mapbox-gl/dist/mapbox-gl.css';
import { ReactNode } from 'react'
import { getParcelDetail, ParcelDetail, getParcelZoningDetail, ParcelZoningDetail, getDevelopableParcels } from '@/lib/queries'
import { PropertyDetail } from './property-detail'
import { useSearchParams, useRouter } from 'next/navigation';
import { throttle, debounce } from 'lodash';


// Properly type the SearchBox component
type SearchBoxType = typeof SearchBox & {
  (props: any): ReactNode;
};

const TypedSearchBox = SearchBox as SearchBoxType;

const INITIAL_CENTER: [number, number] = [-97.7235671, 30.2540749]
const INITIAL_ZOOM = 14

const Map = () => {
    const mapRef = useRef<mapboxgl.Map | undefined>(undefined)
    const mapContainerRef = useRef<HTMLDivElement>(null)
    const markerRef = useRef<mapboxgl.Marker | null>(null)
    const popupRef = useRef<mapboxgl.Popup | null>(null)
    const mapboxAccessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ''
    /**
     * Mapbox tileset ID for Travis County parcels. Expected format: <username>.tx_travis_parcels.
     * Expose as NEXT_PUBLIC_PARCELS_TILESET_ID in the environment. Falls back to the bare layer name when not provided
     * so that you can hard-code the `url` below if desired.
     */
    const parcelsTilesetId = process.env.NEXT_PUBLIC_PARCELS_TILESET_ID || 'americanhousing.tx_travis_parcels'

    const [center, setCenter] = useState(INITIAL_CENTER)
    const [zoom, setZoom] = useState(INITIAL_ZOOM)
    const [searchValue, setSearchValue] = useState('')
    const [parcelData, setParcelData] = useState<ParcelDetail | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [zoningData, setZoningData] = useState<ParcelZoningDetail | null>(null)

    const queryParams = useSearchParams();
    const router = useRouter();

    const view = queryParams.get('view');
    const address = queryParams.get('address');
    const developmentPlan = queryParams.get('developmentPlan');

    const DEVELOPABLE_SRC_ID = 'developable-parcels-src';
    const developableMarkersRef = useRef<mapboxgl.Marker[]>([]) // legacy; no longer used

    // Vector source & layer identifiers – keep them in constants so we only need to change in one place if required.
    const PARCEL_SOURCE_ID = 'tx-travis-parcels' as const;
    const PARCEL_FILL_LAYER_ID = 'parcels-fill' as const;
    const PARCEL_OUTLINE_LAYER_ID = 'parcels-outline' as const;
    // Tileset recipe indicates the internal layer is named "parcel"
    const PARCEL_SOURCE_LAYER = 'parcel' as const;

    // Initialize the map and add layers
    useEffect(() => {
        console.log("LOADING MAP")
        if (!mapContainerRef.current) return;
        
        mapboxgl.accessToken = mapboxAccessToken
        mapRef.current = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: 'mapbox://styles/mapbox/standard',
            center: center,
            zoom: zoom,
        });

        // Create marker but don't add to map yet
        markerRef.current = new mapboxgl.Marker({
            color: '#3b82f6',
        });


        // Update the center and zoom state when the map moves
        // mapRef.current.on('move', () => {
        //     if (!mapRef.current) return;

        //     // get the current center coordinates and zoom level from the map
        //     const mapCenter = mapRef.current.getCenter()
        //     const mapZoom = mapRef.current.getZoom()
        
        //     // update state
        //     setCenter([ mapCenter.lng, mapCenter.lat ])
        //     setZoom(mapZoom)
        // });

        // Add map navigation controls
        mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

        // Change cursor to pointer when hovering over clickable areas
        mapRef.current.getCanvas().style.cursor = 'default';

        // Add parcel vector tiles (Mapbox tileset) once the base style has loaded
        mapRef.current.on('load', () => {
            // Build the Mapbox vector source URL. It must have the `mapbox://` prefix.
            // If you defined NEXT_PUBLIC_PARCELS_TILESET_ID as "<username>.tx_travis_parcels" this will resolve correctly.
            const sourceUrl = `mapbox://${parcelsTilesetId}`;

            // Bail early if the URL is not well formed – helps during local development
            if (!sourceUrl.startsWith('mapbox://')) {
              // eslint-disable-next-line no-console
              console.error('Invalid parcels tileset id. Expected format "<username>.tx_travis_parcels"');
              return;
            }

            if (!mapRef.current?.getSource(PARCEL_SOURCE_ID)) {
                mapRef.current?.addSource(PARCEL_SOURCE_ID, {
                    type: 'vector',
                    url: sourceUrl,
                    promoteId: 'parcelnumb', // promote the parcel id for feature-state & faster lookups
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
                      0  // Default opacity
                    ],
                    'fill-outline-color': '#088',
                  },
                })

                // Add a thin line layer on top for clearer parcel borders
                if (!mapRef.current?.getLayer(PARCEL_OUTLINE_LAYER_ID)) {
                  mapRef.current?.addLayer({
                    id: PARCEL_OUTLINE_LAYER_ID,
                    type: 'line',
                    source: PARCEL_SOURCE_ID,
                    'source-layer': PARCEL_SOURCE_LAYER,
                    paint: {
                      'line-color': '#3b82f6',
                      'line-width': 1,
                    },
                  })
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
                          'fill-opacity': 0,
                        },
                        layout: {
                            visibility: 'visible'
                        },
                        
                    },
                    beforeLayerId
                );

                // Create the popup once the map & layer are ready
                if (!popupRef.current) {
                  popupRef.current = new mapboxgl.Popup({
                    closeButton: false,
                    closeOnClick: false,
                  })
                }

            }

            // On hover, show the popup and change fill color
            let hoveredParcelId: number | string | null = null;
            mapRef.current?.on(
              'mousemove',
              PARCEL_FILL_LAYER_ID,
              throttle((e) => {
                if (!e.features?.length) return
                const f = e.features[0] as mapboxgl.MapboxGeoJSONFeature
                const props = f.properties as { [k: string]: unknown }
                const id = f.id as number | string | undefined

                // fields exposed by Mapbox tiles
                const address = props.address
                const zoning = props.zoning
                const parcelArea = props.sqft

                // Manage feature-state hover toggle
                if (id !== undefined) {
                  if (hoveredParcelId !== null && hoveredParcelId !== id) {
                    mapRef.current?.setFeatureState(
                      { source: PARCEL_SOURCE_ID, sourceLayer: PARCEL_SOURCE_LAYER, id: hoveredParcelId },
                      { hover: false }
                    )
                  }
                  if (hoveredParcelId !== id) {
                    hoveredParcelId = id
                    mapRef.current?.setFeatureState(
                      { source: PARCEL_SOURCE_ID, sourceLayer: PARCEL_SOURCE_LAYER, id: hoveredParcelId },
                      { hover: true }
                    )
                  }
                }

                // set the popup content
                popupRef.current!
                  .setLngLat((e.lngLat as mapboxgl.LngLatLike)!)
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
                  .addTo(mapRef.current!)
              }, 100),
            )
            

            mapRef.current?.on('mouseleave', PARCEL_FILL_LAYER_ID, () => {
              // Remove hover effect & popup
              if (hoveredParcelId !== null) {
                mapRef.current?.setFeatureState(
                  { source: PARCEL_SOURCE_ID, sourceLayer: PARCEL_SOURCE_LAYER, id: hoveredParcelId },
                  { hover: false }
                )
              }
              hoveredParcelId = null
              popupRef.current?.remove()
            })

            // Register click handler *after* the layer exists to avoid the
            // "The provided layerId parameter is invalid" runtime error.
            mapRef.current?.on('click', PARCEL_FILL_LAYER_ID, handleMapClick)
        });

        return () => {
            mapRef.current?.remove();
        }
    }, []);

    // Fetch parcel data when an address is selected
    useEffect(() => {
      const fetchParcelData = async () => {
        if (address) {
          try {
            setError(null);
          
            const parcelResult = await getParcelDetail(address);
            const zoningResult = await getParcelZoningDetail(address);

            if (parcelResult.success && parcelResult.data) {
              setParcelData(parcelResult.data);
            } else {
              setError(parcelResult.error || 'Failed to fetch property data');
              setParcelData(null);
            }

            if (zoningResult.success && zoningResult.data) {
              setZoningData(zoningResult.data);
            } else {
              setError(zoningResult.error || 'Failed to fetch zoning data');
              setZoningData(null);
            }

            const lng = parcelResult.data?.longitude
            const lat = parcelResult.data?.latitude

            // add marker to map and fly to location
            if (markerRef.current && mapRef.current && lng && lat) {
              markerRef.current
                  .setLngLat([lng, lat])
                  .addTo(mapRef.current);
              
              // Fly to the location
              mapRef.current.flyTo({
                center: [lng, lat],
              });
            }
            
          } catch (err) {
            setError('An unexpected error occurred');
            setParcelData(null);
            setZoningData(null);
          } 
        }
      };
      
      fetchParcelData();
    }, [address]);

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
    }, []);

    /**
     * Helper: centroid of first polygon ring
     */
    const getPolygonCentroid = (coordinates: number[][]): [number, number] => {
      const count = coordinates.length;
      const [lngSum, latSum] = coordinates.reduce<[number, number]>(
        (acc, [lng, lat]) => [acc[0] + lng, acc[1] + lat],
        [0, 0],
      );
      return [lngSum / count, latSum / count];
    };

    /**
     * Cache: track the last viewport that was fetched to avoid duplicate network calls
     */
    const lastFetchedBoundsRef = useRef<mapboxgl.LngLatBounds | null>(null);

    /**
     * Effect: Fetch and display developable parcels as markers when a development plan is selected.
     * Cleans up old markers before adding new ones.
     */
    const fetchAndShowDevelopableParcels = useCallback(async (): Promise<void> => {
      if (!developmentPlan || !mapRef.current) return;
      try {
        const currentBounds = mapRef.current.getBounds?.();
        if (!currentBounds) return; // cannot determine viewport

        // If we already fetched data for a viewport that fully contains the current one, skip
        if (
          lastFetchedBoundsRef.current &&
          lastFetchedBoundsRef.current.contains(currentBounds.getNorthEast()) &&
          lastFetchedBoundsRef.current.contains(currentBounds.getSouthWest())
        ) {
          return;
        }

        setIsLoading(true);
        setError(null);

        // Build a simple Polygon geometry (GeoJSON) representing the current map viewport
        const sw = currentBounds.getSouthWest();
        const ne = currentBounds.getNorthEast();
        const viewportPolygon = {
          type: 'Polygon' as const,
          coordinates: [[
            [sw.lng, sw.lat], // SW
            [ne.lng, sw.lat], // SE
            [ne.lng, ne.lat], // NE
            [sw.lng, ne.lat], // NW
            [sw.lng, sw.lat], // Close ring
          ]],
        };

        const result = await getDevelopableParcels(developmentPlan, viewportPolygon);
        if (!result.success || !result.data?.parcels?.features) {
          setError('No developable parcels found.');
          return;
        }

        // Remember the bounds only after a successful fetch
        lastFetchedBoundsRef.current = currentBounds;

        const features: GeoJSON.Feature<GeoJSON.Point, any>[] = result.data.parcels.features
          .map((feature: any): GeoJSON.Feature<GeoJSON.Point, any> | null => {
            const ring: number[][] = feature.geometry?.coordinates?.[0] ?? [];
            if (!ring.length) return null;
            const [lng, lat] = getPolygonCentroid(ring);
            return {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [lng, lat],
              },
              properties: {
                address: feature.properties?.fields?.address || feature.properties?.headline || 'Unknown',
              },
            };
          })
          .filter(Boolean) as GeoJSON.Feature<GeoJSON.Point, any>[];

        const geojson: GeoJSON.FeatureCollection<GeoJSON.Point> = {
          type: 'FeatureCollection',
          features,
        };

        // Add/update source & layers
        const map = mapRef.current!;
        if (!map.getSource(DEVELOPABLE_SRC_ID)) {
          map.addSource(DEVELOPABLE_SRC_ID, {
            type: 'geojson',
            data: geojson,
            cluster: true,
            clusterRadius: 50,
            clusterMaxZoom: 15, // clusters exist only while zoom ≤ 12
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
                12, // base size
                10, 16,
                30, 20,
              ],
            },
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
              'text-size': 14,
            },
            paint: { 'text-color': '#ffffff' },
          });

          // Unclustered individual point
          map.addLayer({
            id: 'unclustered-point',
            type: 'circle',
            source: DEVELOPABLE_SRC_ID,
            filter: ['!', ['has', 'point_count']],
            paint: {
              'circle-color': '#3b82f6',
              'circle-radius': 6,
            },
          });

          // On click cluster zoom
          map.on('click', 'clusters', (e) => {
            const clusteredFeatures = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
            const clusterId = clusteredFeatures[0].properties?.cluster_id;
            (map.getSource(DEVELOPABLE_SRC_ID) as mapboxgl.GeoJSONSource).getClusterExpansionZoom(clusterId, (err, zoom) => {
              const zoomLevel = zoom || 12;
              if (err) return;
              const center = (clusteredFeatures[0].geometry as any).coordinates as mapboxgl.LngLatLike;
              map.easeTo({ center, zoom: zoomLevel });
            });
          });

          // Tooltip for unclustered point
          map.on('click', 'unclustered-point', (e) => {
            const props = e.features?.[0].properties as any;
            const coordinates = (e.features?.[0].geometry as any).coordinates.slice();
            new mapboxgl.Popup()
              .setLngLat(coordinates as any)
              .setHTML(`<strong>Developable Parcel</strong><br/>${props.address}`)
              .addTo(map);
          });
        } else {
          const src = map.getSource(DEVELOPABLE_SRC_ID) as mapboxgl.GeoJSONSource;
          src.setData(geojson);
        }
      } catch (err) {
        setError('Failed to load developable parcels.');
      } finally {
        setIsLoading(false);
      }
    }, [developmentPlan]);

    // Debounced version to avoid excessive calls while panning/zooming
    const debouncedFetchDevelopable = useMemo(() => debounce(fetchAndShowDevelopableParcels, 600), [fetchAndShowDevelopableParcels]);

    // Attach map dragend handler once map + developmentPlan ready
    useEffect(() => {
      if (!mapRef.current || !developmentPlan) return;
      const handler = () => debouncedFetchDevelopable();
      mapRef.current.on('dragend', handler);
      return () => {
        mapRef.current?.off('dragend', handler);
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
    }

    const handleSearchResultSelected = (result: any) => {
      // Extract address components from the search result
      const properties = result.features[0].properties
      const fullAddress = properties.full_address
      const lng = properties.coordinates.longitude
      const lat = properties.coordinates.latitude

      console.log(lat, lng)
      
      if (properties) {
        // Update marker on the map
        if (mapRef.current && properties.coordinates) {
            // Add marker to map
            if (markerRef.current) {
                markerRef.current
                    .setLngLat([lng, lat])
                    .addTo(mapRef.current);
                
                // Fly to the location
                mapRef.current.flyTo({
                    center: [lng, lat],
                    // zoom: 18,
                });
            }
        }
      }
    };

    const handleMapClick = async (e: mapboxgl.MapMouseEvent) => {
      setParcelData(null);
      setZoningData(null);

      const features = mapRef?.current?.queryRenderedFeatures(e.point, {
        layers: [PARCEL_FILL_LAYER_ID],
      });
      
      if (!features || features.length === 0) return;
      
      const props = features[0].properties as { [k: string]: unknown }
      const address = (props.address ?? '') as string
      const city = (props.city ?? props.scity ?? '') as string
      const state = (props.state2 ?? props.state ?? '') as string
      const zip = (props.szip ?? props.szip5 ?? '') as string
      const fullAddress = address + ', ' + city + ', ' + state + ' ' + zip
      
      const { lng, lat } = e.lngLat;

      // update the center of the map
      if (markerRef.current && mapRef.current) {
        mapRef.current.flyTo({
          center: [lng, lat],
        });

        markerRef.current
          .setLngLat([lng, lat])
          .addTo(mapRef.current);
      }

      router.push(`/explorer?view=property_detail&address=${fullAddress}`);
    };

    const handleClosePropertyDetail = () => {
      router.push('/explorer');
      router.refresh();
    }

    return (
        <div className="flex flex-row h-full w-full">
            {/* Property data card panel - Only show when an address is selected or during loading */}
            {(view == "property_detail") ? (
                <div className="w-1/4 min-w-[400px] flex flex-col overflow-y-auto max-h-[calc(100vh-48px)]">
                    <PropertyDetail 
                        parcel={parcelData} 
                        parcelZoning={zoningData}
                        onClose={handleClosePropertyDetail}
                    />
                </div>
            ) : null }
            
            {/* Map container - Full width when no property is selected, reduced width when property is showing */}
            <div className={`relative ${(view == "property_detail") ? 'w-3/4' : 'w-full'} h-full`}>
              <div className='absolute top-4 left-4 z-10 w-[400px]'>
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
                  placeholder='Search for an address, city, zip, etc'
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
              <div className="absolute bottom-4 left-4 z-10 bg-white p-2 rounded-md shadow-md text-xs text-gray-500">
                <p>Click anywhere on the map to select an address</p>
              </div>
              <div id="map-container" ref={mapContainerRef} className="w-full h-full" />
            </div>
        </div>
    );
}

export default Map;