'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import { SearchBox } from '@mapbox/search-js-react'
import 'mapbox-gl/dist/mapbox-gl.css';
import { ReactNode } from 'react'
import { getParcelDetail, ParcelDetail, getParcelZoningDetail, ParcelZoningDetail } from '@/lib/queries'
import { PropertyDetail } from './property-detail'
import { formatCurrency } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, MapPin } from 'lucide-react'

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
    const mapboxAccessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ''

    const [center, setCenter] = useState(INITIAL_CENTER)
    const [zoom, setZoom] = useState(INITIAL_ZOOM)
    const [searchValue, setSearchValue] = useState('')
    const [selectedAddress, setSelectedAddress] = useState<{
      street: string;
      city: string;
      state: string;
      zip?: string;
    } | null>(null)
    const [parcelData, setParcelData] = useState<ParcelDetail | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isGeocodingLoading, setIsGeocodingLoading] = useState(false)
    const [zoningData, setZoningData] = useState<ParcelZoningDetail | null>(null)

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
            color: '#FF0000'
        });

        // Add map click handler
        mapRef.current.on('click', handleMapClick);

        // Update the center and zoom state when the map moves
        mapRef.current.on('move', () => {
            if (!mapRef.current) return;

            // get the current center coordinates and zoom level from the map
            const mapCenter = mapRef.current.getCenter()
            const mapZoom = mapRef.current.getZoom()
        
            // update state
            setCenter([ mapCenter.lng, mapCenter.lat ])
            setZoom(mapZoom)
        });

        // Add map navigation controls
        mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

        // Change cursor to pointer when hovering over clickable areas
        mapRef.current.getCanvas().style.cursor = 'pointer';

        return () => {
            mapRef.current?.off('click', handleMapClick);
            mapRef.current?.remove();
        }
    }, []);

    // Fetch parcel data when an address is selected
    useEffect(() => {
      const fetchParcelData = async () => {
        if (!selectedAddress) return;
        
        setIsLoading(true);
        setError(null);
        
        try {
          const addressString = `${selectedAddress.street}, ${selectedAddress.city}, ${selectedAddress.state}${selectedAddress.zip ? ` ${selectedAddress.zip}` : ''}`;

          const [parcelResult, zoningResult] = await Promise.all([
            getParcelDetail(addressString),
            getParcelZoningDetail(addressString)
          ]);

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
        } catch (err) {
          setError('An unexpected error occurred');
          setParcelData(null);
          setZoningData(null);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchParcelData();
    }, [selectedAddress]);

    const handleMapClick = async (e: mapboxgl.MapMouseEvent) => {
        if (!mapRef.current) return;

        const { lng, lat } = e.lngLat;
        
        // Show loading indicator
        setIsGeocodingLoading(true);
        
        try {
            // Use Mapbox Geocoding API to get address from coordinates
            const response = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxAccessToken}&types=address`
            );
            
            if (!response.ok) {
                throw new Error('Geocoding failed');
            }
            
            const data = await response.json();
            
            // Check if we have results
            if (data.features && data.features.length > 0) {
                const feature = data.features[0];
                console.log('Geocoded address:', feature);
                
                // Extract address components
                const addressParts = {
                    street: '',
                    city: '',
                    state: '',
                    zip: ''
                };
                
                // Parse the address from context and place_name
                feature.context?.forEach((ctx: any) => {
                    if (ctx.id.startsWith('place')) {
                        addressParts.city = ctx.text;
                    } else if (ctx.id.startsWith('region')) {
                        addressParts.state = ctx.short_code?.replace('US-', '') || ctx.text;
                    } else if (ctx.id.startsWith('postcode')) {
                        addressParts.zip = ctx.text;
                    }
                });
                
                // Extract street address from place name
                // Example: "1600 Pennsylvania Avenue Northwest, Washington, District of Columbia 20500, United States"
                const placeName = feature.place_name;
                const firstCommaIndex = placeName.indexOf(',');
                if (firstCommaIndex > 0) {
                    addressParts.street = placeName.substring(0, firstCommaIndex);
                }
                
                // Only proceed if we have the minimum required address components
                if (addressParts.street && addressParts.city && addressParts.state) {
                    console.log('Setting address:', addressParts);
                    
                    // Update the marker position
                    if (markerRef.current) {
                        markerRef.current
                            .setLngLat([lng, lat])
                            .addTo(mapRef.current);
                    }
                    
                    // Set the selected address
                    setSelectedAddress(addressParts);
                } else {
                    setError('Could not determine a complete address at this location. Try clicking on a building or street.');
                }
            } else {
                setError('No address found at this location. Try clicking closer to a building or street.');
            }
        } catch (err) {
            console.error('Error during geocoding:', err);
            setError('Failed to find address at this location');
        } finally {
            setIsGeocodingLoading(false);
        }
    };

    const handleButtonClick = () => {
        if (!mapRef.current) return;
        
        mapRef.current.flyTo({
          center: INITIAL_CENTER,
          zoom: INITIAL_ZOOM
        });
    }

    const handleSearchChange = (value: string) => {
        setSearchValue(value);
    }

    const handleSearchResultSelected = (result: any) => {
      // Extract address components from the search result
      const { properties } = result;
      
      if (properties) {
        const addressComponents = {
          street: `${properties.address_number || ''} ${properties.street || ''}`.trim(),
          city: properties.city || '',
          state: properties.region_code || '',
          zip: properties.postcode || '',
        };
        
        console.log('Selected address:', addressComponents);
        
        // Update marker on the map
        if (mapRef.current && properties.coordinates) {
            const [lng, lat] = properties.coordinates;
            
            // Add marker to map
            if (markerRef.current) {
                markerRef.current
                    .setLngLat([lng, lat])
                    .addTo(mapRef.current);
                
                // Fly to the location
                mapRef.current.flyTo({
                    center: [lng, lat],
                    zoom: 16
                });
            }
        }
        
        setSelectedAddress(addressComponents);
      }
    };

    return (
        <div className="flex flex-row h-full w-full">
            {/* Property data card panel - Only show when an address is selected or during loading */}
            {(selectedAddress || isLoading || isGeocodingLoading) ? (
                <div className="w-1/4 min-w-[400px] flex flex-col overflow-y-auto max-h-[calc(100vh-48px)]">
                    <PropertyDetail 
                        parcel={parcelData} 
                        parcelZoning={zoningData}
                        onClose={() => setSelectedAddress(null)}
                    />
                </div>
            ) : null }
            
            {/* Map container - Full width when no property is selected, reduced width when property is showing */}
            <div className={`relative ${(selectedAddress || isLoading || isGeocodingLoading) ? 'w-3/4' : 'w-full'} h-full`}>
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