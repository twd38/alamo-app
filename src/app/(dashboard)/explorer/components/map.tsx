'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import { SearchBox } from '@mapbox/search-js-react'
import 'mapbox-gl/dist/mapbox-gl.css';
import { ReactNode } from 'react'
import { getParcelDetail, ParcelDetail, getParcelZoningDetail, ParcelZoningDetail } from '@/lib/queries'
import { PropertyDetail } from './property-detail'
import { useSearchParams, useRouter } from 'next/navigation';
import { throttle } from 'lodash';


// Properly type the SearchBox component
type SearchBoxType = typeof SearchBox & {
  (props: any): ReactNode;
};

const TypedSearchBox = SearchBox as SearchBoxType;

const INITIAL_CENTER: [number, number] = [-97.7431, 30.2672]
const INITIAL_ZOOM = 12

const Map = () => {
    const mapRef = useRef<mapboxgl.Map | undefined>(undefined)
    const mapContainerRef = useRef<HTMLDivElement>(null)
    const markerRef = useRef<mapboxgl.Marker | null>(null)
    const popupRef = useRef<mapboxgl.Popup | null>(null)
    const mapboxAccessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ''
    // Regrid Tiles API token – must be exposed as NEXT_PUBLIC_REGRID_TILES_TOKEN in your env
    const regridToken = process.env.NEXT_PUBLIC_REGRID_TILES_TOKEN || ''

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

    const createCustomLayer = async () => {
      const response = await fetch(`https://tiles.regrid.com/api/v1/sources?token=${regridToken}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: {
            parcel: true
          },
          fields: {
            parcel: ["ogc_fid", "owner", "zoning", "address", "scity", "state2", "szip5", "ll_gissqft"]
          },
          minzoom: 16,
          maxzoom: 21,
        })
      })

      const data = await response.json()

      return data
    }

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

        // Add Regrid parcel tiles once the base style has loaded
        mapRef.current.on('load', async () => {
            if (!regridToken) {
                // eslint-disable-next-line no-console
                console.warn('Regrid token not found. Skipping Regrid parcel layer.');
                return;
            }

            const customLayer = await createCustomLayer()
            const vectorTiles = customLayer?.vector
            const sourceLayerId: string = customLayer.id

            // Add Regrid vector tile source
            if (!mapRef.current?.getSource('regrid-parcels-vt')) {
                // Add the source
                mapRef.current?.addSource('regrid-parcels-vt', {
                    type: 'vector',
                    tiles: vectorTiles,
                    minzoom: 16,
                    maxzoom: 21,
                    promoteId: 'ogc_fid', // Use unique parcel identifier so feature‑state can target individual parcels
                });

                // The tilejson response contains a unique `id` that must be used
                // as the `source-layer` value when styling / querying the tiles.

                // Add the fill layer – use the dynamic source‑layer id that came back
                mapRef.current?.addLayer({
                  id: 'regrid-parcels-fill',
                  type: 'fill',
                  source: 'regrid-parcels-vt',
                  'source-layer': sourceLayerId,
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
                if (!mapRef.current?.getLayer('regrid-parcels-outline')) {
                  mapRef.current?.addLayer({
                    id: 'regrid-parcels-outline',
                    type: 'line',
                    source: 'regrid-parcels-vt',
                    'source-layer': sourceLayerId,
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
                        id: 'regrid-parcels-layer',
                        type: 'fill',
                        source: 'regrid-parcels-vt',
                        'source-layer': sourceLayerId,
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
              'regrid-parcels-fill',
              throttle((e) => {
                if (!e.features?.length) return
                const f = e.features[0] as mapboxgl.MapboxGeoJSONFeature
                const props = f.properties as { [k: string]: unknown }
                const id = f.id as number | string | undefined

                // fields exposed by Regrid tiles
                const address = props.address
                const zoning = props.zoning
                const parcelArea = props.ll_gissqft

                // Manage feature‑state hover toggle
                if (id !== undefined) {
                  if (hoveredParcelId !== null && hoveredParcelId !== id) {
                    mapRef.current?.setFeatureState(
                      { source: 'regrid-parcels-vt', sourceLayer: sourceLayerId, id: hoveredParcelId },
                      { hover: false }
                    )
                  }
                  if (hoveredParcelId !== id) {
                    hoveredParcelId = id
                    mapRef.current?.setFeatureState(
                      { source: 'regrid-parcels-vt', sourceLayer: sourceLayerId, id: hoveredParcelId },
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
            

            mapRef.current?.on('mouseleave', 'regrid-parcels-fill', () => {
              // Remove hover effect & popup
              if (hoveredParcelId !== null) {
                mapRef.current?.setFeatureState(
                  { source: 'regrid-parcels-vt', sourceLayer: sourceLayerId, id: hoveredParcelId },
                  { hover: false }
                )
              }
              hoveredParcelId = null
              popupRef.current?.remove()
            })

            // Register click handler *after* the layer exists to avoid the
            // "The provided layerId parameter is invalid" runtime error.
            mapRef.current?.on('click', 'regrid-parcels-fill', handleMapClick)
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
        layers: ['regrid-parcels-fill'],
      });
      
      if (!features || features.length === 0) return;
      
      const props = features[0].properties as { [k: string]: unknown }
      const address = props.address as string
      const city = props.scity as string
      const state = props.state2 as string
      const zip = props.szip5 as string
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
              <div className="absolute bottom-4 right-4 z-10 bg-white p-2 rounded-md shadow-md text-xs text-gray-500">
                <p>Click anywhere on the map to select an address</p>
              </div>
              <div id="map-container" ref={mapContainerRef} className="w-full h-full" />
            </div>
        </div>
    );
}

export default Map;