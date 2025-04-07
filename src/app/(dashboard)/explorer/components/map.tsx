'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import { SearchBox } from '@mapbox/search-js-react'
import 'mapbox-gl/dist/mapbox-gl.css';
import { ReactNode } from 'react'
import { getParcelByAddress, ParcelData } from '@/lib/queries'
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
    const [parcelData, setParcelData] = useState<ParcelData | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isGeocodingLoading, setIsGeocodingLoading] = useState(false)

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
          const result = await getParcelByAddress(selectedAddress);
          console.log(result)
          
          if (result.success && result.data) {
            setParcelData(result.data);
          } else {
            setError(result.error || 'Failed to fetch property data');
            setParcelData(null);
          }
        } catch (err) {
          setError('An unexpected error occurred');
          setParcelData(null);
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
                <div className="w-1/4 h-full flex flex-col overflow-hidden">
                  <div className="p-4 flex-1 overflow-hidden">
                    <Card className="w-full h-full flex flex-col">
                      {isGeocodingLoading ? (
                        <CardContent className="pt-6 flex items-center justify-center flex-1">
                          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                          <p className="ml-2 text-gray-500">Finding address at clicked location...</p>
                        </CardContent>
                      ) : isLoading ? (
                        <CardContent className="pt-6 flex items-center justify-center flex-1">
                          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                          <p className="ml-2 text-gray-500">Loading property data...</p>
                        </CardContent>
                      ) : error ? (
                        <>
                        <CardHeader>
                          <CardTitle className="text-red-500">Error</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p>{error}</p>
                        </CardContent>
                        </>
                      ) : parcelData ? (
                        <>
                        <CardHeader className="pb-2">
                          <CardTitle>{parcelData.location?.streetAddress || 'Property Details'}</CardTitle>
                          <CardDescription>
                            {parcelData.id && `Parcel ID: ${parcelData.id}`}
                            {parcelData.parcelApn && ` • APN: ${parcelData.parcelApn}`}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto">
                          <div className="space-y-4">
                            <div>
                              <h3 className="font-medium text-lg mb-2">Property Information</h3>
                              <dl className="grid grid-cols-2 gap-2">
                                {parcelData.landUse?.description && (
                                  <>
                                    <dt className="text-sm text-gray-500">Property Type</dt>
                                    <dd>{parcelData.landUse.description}</dd>
                                  </>
                                )}
                                {parcelData.primaryStructure?.yearBuilt && (
                                  <>
                                    <dt className="text-sm text-gray-500">Year Built</dt>
                                    <dd>{parcelData.primaryStructure.yearBuilt}</dd>
                                  </>
                                )}
                                {parcelData.assessment?.lot?.size && (
                                  <>
                                    <dt className="text-sm text-gray-500">Land Area</dt>
                                    <dd>{(parcelData.assessment.lot.size * 10.7639).toLocaleString()} sq ft</dd>
                                  </>
                                )}
                                {parcelData.primaryStructure?.livingArea && (
                                  <>
                                    <dt className="text-sm text-gray-500">Building Area</dt>
                                    <dd>{(parcelData.primaryStructure.livingArea * 10.7639).toLocaleString()} sq ft</dd>
                                  </>
                                )}
                                {parcelData.assessment?.assessedValue?.total && (
                                  <>
                                    <dt className="text-sm text-gray-500">Assessed Value</dt>
                                    <dd>${parcelData.assessment.assessedValue.total.toLocaleString()}</dd>
                                  </>
                                )}
                                {parcelData.assessment?.marketValue?.total && (
                                  <>
                                    <dt className="text-sm text-gray-500">Market Value</dt>
                                    <dd>${parcelData.assessment.marketValue.total.toLocaleString()}</dd>
                                  </>
                                )}
                                {parcelData.tax?.amount && (
                                  <>
                                    <dt className="text-sm text-gray-500">Annual Tax</dt>
                                    <dd>${parcelData.tax.amount.toLocaleString()}</dd>
                                  </>
                                )}
                                {parcelData.location?.locality && (
                                  <>
                                    <dt className="text-sm text-gray-500">City</dt>
                                    <dd>{parcelData.location.locality}</dd>
                                  </>
                                )}
                                {parcelData.location?.postalCode && (
                                  <>
                                    <dt className="text-sm text-gray-500">Zip Code</dt>
                                    <dd>{parcelData.location.postalCode}</dd>
                                  </>
                                )}
                              </dl>
                            </div>

                            {/* Zoning Information Section */}
                            {(parcelData.assessment?.zoning?.assessment || 
                              parcelData.property?.zoning || 
                              parcelData.landUse?.normalized?.description) && (
                              <div>
                                <h3 className="font-medium text-lg mb-2">Zoning Information</h3>
                                <dl className="grid grid-cols-2 gap-2">
                                  {parcelData.assessment?.zoning?.assessment && (
                                    <>
                                      <dt className="text-sm text-gray-500">Zoning Code</dt>
                                      <dd>{parcelData.assessment.zoning.assessment}</dd>
                                    </>
                                  )}
                                  {parcelData.property?.zoning && (
                                    <>
                                      <dt className="text-sm text-gray-500">Zoning Description</dt>
                                      <dd>{parcelData.property.zoning}</dd>
                                    </>
                                  )}
                                  {parcelData.landUse?.normalized?.categoryDescription && (
                                    <>
                                      <dt className="text-sm text-gray-500">Land Use Category</dt>
                                      <dd>{parcelData.landUse.normalized.categoryDescription}</dd>
                                    </>
                                  )}
                                  {parcelData.landUse?.normalized?.description && (
                                    <>
                                      <dt className="text-sm text-gray-500">Normalized Use</dt>
                                      <dd>{parcelData.landUse.normalized.description}</dd>
                                    </>
                                  )}
                                  {parcelData.landUse?.description && (
                                    <>
                                      <dt className="text-sm text-gray-500">Land Use</dt>
                                      <dd>{parcelData.landUse.description}</dd>
                                    </>
                                  )}
                                  {parcelData.opportunityZone !== undefined && (
                                    <>
                                      <dt className="text-sm text-gray-500">Opportunity Zone</dt>
                                      <dd>{parcelData.opportunityZone ? 'Yes' : 'No'}</dd>
                                    </>
                                  )}
                                </dl>
                              </div>
                            )}
                            
                            {parcelData.owner && (
                              <div>
                                <h3 className="font-medium text-lg mb-2">Owner Information</h3>
                                <dl className="grid grid-cols-1 gap-2">
                                  {parcelData.owner.names && parcelData.owner.names.length > 0 && (
                                    <>
                                      <dt className="text-sm text-gray-500">Name(s)</dt>
                                      {parcelData.owner.names.map((name, index) => (
                                        <dd key={index}>{name.fullName}</dd>
                                      ))}
                                    </>
                                  )}
                                  {parcelData.owner.streetAddress && (
                                    <>
                                      <dt className="text-sm text-gray-500">Mailing Address</dt>
                                      <dd>{parcelData.owner.streetAddress}, {parcelData.owner.locality}, {parcelData.owner.regionCode} {parcelData.owner.postalCode}</dd>
                                    </>
                                  )}
                                  {parcelData.occupant?.owner !== undefined && (
                                    <>
                                      <dt className="text-sm text-gray-500">Owner Occupied</dt>
                                      <dd>{parcelData.occupant.owner ? 'Yes' : 'No'}</dd>
                                    </>
                                  )}
                                </dl>
                              </div>
                            )}
                            
                            
                            {/* {parcelData.transaction?.lastMarketSale && (
                              <div>
                                <h3 className="font-medium text-lg mb-2">Last Sale Information</h3>
                                <dl className="grid grid-cols-2 gap-2">
                                  {parcelData.transaction.lastMarketSale.transferDate && (
                                    <>
                                      <dt className="text-sm text-gray-500">Sale Date</dt>
                                      <dd>{new Date(parcelData.transaction.lastMarketSale.transferDate).toLocaleDateString()}</dd>
                                    </>
                                  )}
                                  {parcelData.transaction.lastMarketSale.value && (
                                    <>
                                      <dt className="text-sm text-gray-500">Sale Price</dt>
                                      <dd>${parcelData.transaction.lastMarketSale.value.toLocaleString()}</dd>
                                    </>
                                  )}
                                  {parcelData.transaction.lastMarketSale.buyer && (
                                    <>
                                      <dt className="text-sm text-gray-500">Buyer</dt>
                                      <dd>{parcelData.transaction.lastMarketSale.buyer}</dd>
                                    </>
                                  )}
                                  {parcelData.transaction.lastMarketSale.seller && (
                                    <>
                                      <dt className="text-sm text-gray-500">Seller</dt>
                                      <dd>{parcelData.transaction.lastMarketSale.seller}</dd>
                                    </>
                                  )}
                                </dl>
                              </div>
                            )} */}
                            
                            {/* {parcelData.legalDescription && parcelData.legalDescription.length > 0 && (
                              <div>
                                <h3 className="font-medium text-lg mb-2">Legal Information</h3>
                                <dl className="grid grid-cols-1 gap-2">
                                  <dt className="text-sm text-gray-500">Legal Description</dt>
                                  {parcelData.legalDescription.map((desc, index) => (
                                    <dd key={index}>{desc}</dd>
                                  ))}
                                  {parcelData.subdivision && (
                                    <>
                                      <dt className="text-sm text-gray-500">Subdivision</dt>
                                      <dd>{parcelData.subdivision}</dd>
                                    </>
                                  )}
                                </dl>
                              </div>
                            )} */}
                          </div>
                        </CardContent>
                        </>
                      ) : (
                        <CardContent className="pt-6 flex-1 flex items-center justify-center">
                          <p className="text-gray-500">No property data available for this address.</p>
                        </CardContent>
                      )}
                    </Card>
                  </div>
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