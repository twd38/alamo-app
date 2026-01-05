'use server';

/**
 * Parcel detail and zoning data from Regrid API.
 * Uses return_zoning=true to get zoning data in a single API call.
 */

/**
 * Zoning data structure from Regrid's standardized zoning API.
 * These fields match Regrid's ZoningSchema.
 */
export interface ParcelZoning {
  /** Unique zoning record ID */
  id: number | null;
  /** Municipality ID */
  municipalityId: number | null;
  /** Municipality name */
  municipalityName: string | null;
  /** Zoning code (e.g., "SF-3", "MF-2") */
  zoning: string | null;
  /** Full zoning description */
  zoningDescription: string | null;
  /** Zoning type (e.g., "residential", "commercial") */
  zoningType: string | null;
  /** Zoning subtype */
  zoningSubtype: string | null;
  /** Zoning guide/objective */
  zoningGuide: string | null;
  /** Link to zoning code documentation */
  zoningCodeLink: string | null;
  /** Comma-separated permitted land use flags */
  landUseFlagsPermitted: string | null;
  /** Comma-separated conditional land use flags */
  landUseFlagsConditional: string | null;
  /** Land use classes by category */
  landuseClasses: Record<string, string[]> | null;
  /** Minimum lot area in square feet */
  minLotAreaSqFt: number;
  /** Minimum lot width in feet */
  minLotWidthFt: number;
  /** Maximum building height in feet */
  maxBuildingHeightFt: number;
  /** Maximum floor area ratio */
  maxFar: number;
  /** Maximum lot coverage percentage */
  maxCoveragePct: number;
  /** Minimum front setback in feet */
  minFrontSetbackFt: number;
  /** Minimum rear setback in feet */
  minRearSetbackFt: number;
  /** Minimum side setback in feet */
  minSideSetbackFt: number;
  /** Maximum impervious coverage percentage */
  maxImperviousCoveragePct: number;
  /** Minimum landscaped space percentage */
  minLandscapedSpacePct: number;
  /** Minimum open space percentage */
  minOpenSpacePct: number;
  /** Maximum dwelling units per acre */
  maxDensityDuPerAcre: number;
  /** Date of zoning data */
  zoningDataDate: string | null;
}

/**
 * Core parcel‑detail structure returned from the Regrid API after translation.
 */
export interface ParcelDetail {
  /** Unique parcel identifier or null if unavailable */
  id: string | null;
  /** GeoJSON Point geometry or null if unavailable */
  geom: {
    type: 'Point';
    coordinates: [number, number];
  } | null;
  /** Last refresh timestamp from Regrid, or null */
  lastRefreshByRegrid: string | null;
  /** Latitude of the parcel's representative point, or null */
  latitude: number | null;
  /** Regrid UUID, or null */
  ll_uuid: string | null;
  /** Longitude of the parcel's representative point, or null */
  longitude: number | null;
  /** Parcel number (APN), or null */
  parcelNumber: string | null;
  /** Lowercase region/locality, or null */
  region: string | null;
  /** Source URL for the parcel, or null */
  sourceUrl: string | null;
  /** Year built, or null */
  yearBuilt: number | null;
  /** Zoning code, or null */
  zoning: string | null;
  /** Zoning definition ID, always null in current implementation */
  zoningDefinitionId: string | null;
  /** Optional nested objects – kept partially filled if data available */
  dimensions?: {
    gisSqft: number | null;
    gisAcre: number | null;
    lotDepth: number | null;
    lotWidth: number | null;
  } | null;
  appraisal?: {
    parcelValue: number | null;
    landValue: number | null;
    improvementValue: number | null;
    parcelId: string | null;
  } | null;
  censusData?: {
    censusBlock: string | null;
    censusTract: string | null;
    censusBlockGroup: string | null;
  } | null;
  attributes?: Record<string, unknown> | null;
  intersections?: Record<string, unknown> | null;
  streetAddress?: {
    address: string | null;
    city: string | null;
    stateAbbreviation: string | null;
    zip: string | null;
    county: string | null;
    neighborhood: string | null;
    subdivision: string | null;
  } | null;
  ownerInfo?: {
    owner: string | null;
    address: string | null;
    isOwnerOccupied: boolean | null;
  } | null;
  parcelRecords?: Array<{
    parcelId: string | null;
    address: string | null;
    owner: string | null;
    parcelNumber: string | null;
    parcelValue: number | null;
    useDescription: string | null;
    legalDescription: string | null;
    lastRefreshByRegrid: string | null;
  }> | null;
  /** Zoning data from Regrid's standardized zoning API */
  zoningData?: ParcelZoning | null;
}

/**
 * TODO: TEMPORARY - Mock parcel data generator for development
 * Remove this function once we have full Regrid API access
 */
function createMockParcelData(
  address: string,
  coords?: { lat: number; lng: number }
): ParcelDetail {
  // Parse address components (basic parsing)
  const parts = address.split(',').map((p) => p.trim());
  const streetAddress = parts[0] || '123 Main St';
  const cityState = parts[1] || 'Austin TX';
  const cityParts = cityState.split(' ');
  const state = cityParts.pop() || 'TX';
  const city = cityParts.join(' ') || 'Austin';
  const zip = parts[2]?.replace(/\D/g, '') || '78701';

  // Generate pseudo-random but consistent values based on address
  const hash = address.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const lotSqFt = 5000 + (hash % 15000); // 5,000 - 20,000 sqft
  const parcelValue = 200000 + (hash % 800000); // $200K - $1M
  const yearBuilt = 1950 + (hash % 70); // 1950-2020

  // Use provided coordinates if available, otherwise generate based on hash
  const baseLat = 30.2672;
  const baseLng = -97.7431;
  const lat = coords?.lat ?? baseLat + ((hash % 100) - 50) * 0.001;
  const lng = coords?.lng ?? baseLng + ((hash % 100) - 50) * 0.001;

  const mockZoning: ParcelZoning = {
    id: 999999,
    municipalityId: 1,
    municipalityName: 'Austin',
    zoning: 'SF-3',
    zoningDescription: 'Single Family Residence - Standard Lot',
    zoningType: 'residential',
    zoningSubtype: 'single-family',
    zoningGuide: 'Permits single-family residential development with standard lot requirements.',
    zoningCodeLink: 'https://library.municode.com/tx/austin/codes/code_of_ordinances',
    landUseFlagsPermitted: 'single_family,accessory_dwelling_unit,home_occupation',
    landUseFlagsConditional: 'group_residential,bed_and_breakfast',
    landuseClasses: {
      residential: ['Single-family dwelling', 'Accessory dwelling unit'],
      other: ['Home occupation', 'Family home (adult or child care)']
    },
    minLotAreaSqFt: 5750,
    minLotWidthFt: 50,
    maxBuildingHeightFt: 35,
    maxFar: 0.4,
    maxCoveragePct: 45,
    minFrontSetbackFt: 25,
    minRearSetbackFt: 10,
    minSideSetbackFt: 5,
    maxImperviousCoveragePct: 45,
    minLandscapedSpacePct: 0,
    minOpenSpacePct: 0,
    maxDensityDuPerAcre: 8,
    zoningDataDate: '2024-01-01'
  };

  return {
    id: `mock-${hash}`,
    geom: { type: 'Point', coordinates: [lng, lat] },
    lastRefreshByRegrid: new Date().toISOString(),
    latitude: lat,
    ll_uuid: `mock-uuid-${hash}`,
    longitude: lng,
    parcelNumber: `${hash}-${hash % 1000}-${hash % 100}`,
    region: city.toLowerCase(),
    sourceUrl: 'https://app.regrid.com',
    yearBuilt,
    zoning: 'SF-3',
    zoningDefinitionId: null,
    dimensions: {
      gisSqft: lotSqFt,
      gisAcre: lotSqFt / 43560,
      lotDepth: Math.round(Math.sqrt(lotSqFt) * 1.2),
      lotWidth: Math.round(Math.sqrt(lotSqFt) * 0.8)
    },
    appraisal: {
      parcelValue,
      landValue: Math.round(parcelValue * 0.3),
      improvementValue: Math.round(parcelValue * 0.7),
      parcelId: `mock-${hash}`
    },
    censusData: null,
    attributes: null,
    intersections: null,
    streetAddress: {
      address: streetAddress,
      city: city.toLowerCase(),
      stateAbbreviation: state,
      zip,
      county: 'travis',
      neighborhood: 'Central Austin',
      subdivision: null
    },
    ownerInfo: {
      owner: 'Mock Owner',
      address: `${streetAddress}, ${city}, ${state} ${zip}`,
      isOwnerOccupied: true
    },
    parcelRecords: [
      {
        parcelId: `mock-${hash}`,
        address: streetAddress,
        owner: 'Mock Owner',
        parcelNumber: `${hash}-${hash % 1000}-${hash % 100}`,
        parcelValue,
        useDescription: 'Single Family Residential',
        legalDescription: `LOT ${hash % 100} BLK ${hash % 10} MOCK SUBDIVISION`,
        lastRefreshByRegrid: new Date().toISOString()
      }
    ],
    zoningData: mockZoning
  };
}
// END TODO: TEMPORARY MOCK FUNCTION

/**
 * Fetches detailed parcel information for a given address (single string) using the Regrid "parcels/address"
 * endpoint and maps it into a simplified `ParcelDetail` object.
 *
 * @param address - The address to look up
 * @param coords - Optional coordinates (used for mock data when API is unavailable)
 */
export async function getParcelDetail(
  address: string,
  coords?: { lat: number; lng: number }
): Promise<{ success: boolean; data?: ParcelDetail; error?: string }> {
  try {
    /* ----------------------------------------------------------------------
     * Validate prerequisites & build request URL
     * ------------------------------------------------------------------- */
    const token =
      process.env.REGRID_API_TOKEN ??
      process.env.NEXT_PUBLIC_REGRID_TILES_TOKEN;
    if (!token) {
      throw new Error(
        'Missing REGRID_API_TOKEN or NEXT_PUBLIC_REGRID_TILES_TOKEN environment variable'
      );
    }

    const endpointBase = 'https://app.regrid.com/api/v2/parcels/address';
    const params = new URLSearchParams({
      query: address,
      limit: '1',
      return_zoning: 'true',
      token
    });

    const url = `${endpointBase}?${params.toString()}`;

    /* ------------------------------------------------------------------ */
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json'
      },
      // Cache the result for five minutes
      next: { revalidate: 60 * 5 }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Regrid API error: ${response.status} – ${errorText}`);
    }

    const json: any = await response.json();
    const feature = json?.parcels?.features?.[0];

    // TODO: TEMPORARY - Return mock data when API doesn't return results
    // Remove this block once we have full API access
    if (!feature) {
      console.warn('[getParcelDetail] No parcel found, using mock data for:', address);
      const mockParcel = createMockParcelData(address, coords);
      return { success: true, data: mockParcel };
    }
    // END TODO: TEMPORARY

    /* ------------------------------------------------------------------ */
    // Helper for safe numeric parsing
    const toNum = (val: unknown): number | null => {
      if (val === undefined || val === null || val === '' || val === 'NA')
        return null;
      const num = Number(String(val).replace(/[^0-9.-]/g, ''));
      return Number.isFinite(num) ? num : null;
    };

    // Extract common sub‑objects from Regrid JSON
    const fields = feature?.properties?.fields ?? {};
    const geom = feature?.geometry;

    // Latitude/longitude – prefer explicit fields, fall back to geometry centroid
    let latitude: number | null = toNum(fields.lat) ?? null;
    let longitude: number | null = toNum(fields.lon) ?? null;

    if (
      (latitude === null || longitude === null) &&
      geom?.type === 'Polygon' &&
      Array.isArray(geom.coordinates)
    ) {
      // crude centroid for first polygon ring
      const ring: number[][] = geom.coordinates[0] as any;
      if (Array.isArray(ring) && ring.length > 0) {
        const [sumX, sumY] = ring.reduce<[number, number]>(
          (acc, coord) => [acc[0] + coord[0], acc[1] + coord[1]],
          [0, 0]
        );
        const count = ring.length;
        longitude = longitude ?? sumX / count;
        latitude = latitude ?? sumY / count;
      }
    }

    /* ---------------------------- Parse zoning data ------------------------- */
    // The zoning data comes as a separate feature collection in the response
    const zoningFeature = json?.zoning?.features?.[0];
    const zoningProps = zoningFeature?.properties ?? {};

    // Helper to parse numeric values with default of 0
    const toNumWithDefault = (val: unknown, defaultVal: number = 0): number => {
      if (val === undefined || val === null || val === '' || val === 'NA')
        return defaultVal;
      const num = Number(String(val).replace(/[^0-9.-]/g, ''));
      return Number.isFinite(num) ? num : defaultVal;
    };

    // TODO: TEMPORARY - Remove this mock data once we have full API access
    // This provides realistic zoning data for development/testing purposes
    const MOCK_ZONING_DATA: ParcelZoning = {
      id: 999999,
      municipalityId: 1,
      municipalityName: 'Austin',
      zoning: fields.zoning ?? 'SF-3',
      zoningDescription: 'Single Family Residence - Standard Lot',
      zoningType: 'residential',
      zoningSubtype: 'single-family',
      zoningGuide: 'Permits single-family residential development with standard lot requirements.',
      zoningCodeLink: 'https://library.municode.com/tx/austin/codes/code_of_ordinances',
      landUseFlagsPermitted: 'single_family,accessory_dwelling_unit,home_occupation',
      landUseFlagsConditional: 'group_residential,bed_and_breakfast',
      landuseClasses: {
        residential: ['Single-family dwelling', 'Accessory dwelling unit'],
        other: ['Home occupation', 'Family home (adult or child care)']
      },
      minLotAreaSqFt: 5750,
      minLotWidthFt: 50,
      maxBuildingHeightFt: 35,
      maxFar: 0.4,
      maxCoveragePct: 45,
      minFrontSetbackFt: 25,
      minRearSetbackFt: 10,
      minSideSetbackFt: 5,
      maxImperviousCoveragePct: 45,
      minLandscapedSpacePct: 0,
      minOpenSpacePct: 0,
      maxDensityDuPerAcre: 8,
      zoningDataDate: '2024-01-01'
    };
    // END TODO: TEMPORARY MOCK DATA

    const zoningData: ParcelZoning | null = zoningFeature
      ? {
          id: toNum(zoningProps.zoning_id) ?? null,
          municipalityId: toNum(zoningProps.municipality_id) ?? null,
          municipalityName: zoningProps.municipality_name ?? null,
          zoning: zoningProps.zoning ?? null,
          zoningDescription: zoningProps.zoning_description ?? null,
          zoningType: zoningProps.zoning_type ?? null,
          zoningSubtype: zoningProps.zoning_subtype ?? null,
          zoningGuide: zoningProps.zoning_guide ?? null,
          zoningCodeLink: zoningProps.zoning_code_link ?? null,
          landUseFlagsPermitted: zoningProps.land_use_flags_permitted ?? null,
          landUseFlagsConditional: zoningProps.land_use_flags_conditional ?? null,
          landuseClasses: zoningProps.landuse_classes ?? null,
          minLotAreaSqFt: toNumWithDefault(zoningProps.min_lot_area_sq_ft),
          minLotWidthFt: toNumWithDefault(zoningProps.min_lot_width_ft),
          maxBuildingHeightFt: toNumWithDefault(zoningProps.max_building_height_ft),
          maxFar: toNumWithDefault(zoningProps.max_far),
          maxCoveragePct: toNumWithDefault(zoningProps.max_coverage_pct),
          minFrontSetbackFt: toNumWithDefault(zoningProps.min_front_setback_ft),
          minRearSetbackFt: toNumWithDefault(zoningProps.min_rear_setback_ft),
          minSideSetbackFt: toNumWithDefault(zoningProps.min_side_setback_ft),
          maxImperviousCoveragePct: toNumWithDefault(zoningProps.max_impervious_coverage_pct),
          minLandscapedSpacePct: toNumWithDefault(zoningProps.min_landscaped_space_pct),
          minOpenSpacePct: toNumWithDefault(zoningProps.min_open_space_pct),
          maxDensityDuPerAcre: toNumWithDefault(zoningProps.max_density_du_per_acre),
          zoningDataDate: zoningProps.zoning_data_date ?? null
        }
      : MOCK_ZONING_DATA; // TODO: TEMPORARY - Change back to `null` once we have full API access

    /* ---------------------------- Map to schema ------------------------- */
    const detail: ParcelDetail = {
      id: fields.ogc_fid ? String(fields.ogc_fid) : (feature.id ?? null),
      geom:
        latitude !== null && longitude !== null
          ? { type: 'Point', coordinates: [longitude, latitude] }
          : null,
      lastRefreshByRegrid: fields.ll_updated_at ?? null,
      latitude,
      ll_uuid: fields.ll_uuid ?? null,
      longitude,
      parcelNumber: fields.parcelnumb ?? null,
      region: (fields.city ?? fields.scity ?? '').toLowerCase() || null,
      sourceUrl: `https://app.regrid.com${feature?.properties?.path ?? ''}`,
      yearBuilt: toNum(fields.yearbuilt) ?? null,
      zoning: fields.zoning ?? null,
      zoningDefinitionId: null,
      // Regrid does not directly expose lot dimensions – leave null for now
      dimensions: {
        gisSqft: fields.ll_gissqft ?? null,
        gisAcre: fields.ll_gisacres ?? null,
        lotDepth: null,
        lotWidth: null
      },
      appraisal: {
        parcelValue: toNum(fields.parval),
        landValue: toNum(fields.landvalue),
        improvementValue: toNum(fields.improvval),
        parcelId: fields.ogc_fid ? String(fields.ogc_fid) : null
      },
      censusData: null,
      attributes: null,
      intersections: null,
      streetAddress: {
        address: fields.address ?? null,
        city: (fields.city ?? fields.scity ?? null)?.toLowerCase() ?? null,
        stateAbbreviation: fields.st_abbrev ?? fields.mail_state2 ?? null,
        zip: fields.szip ?? fields.mail_zip ?? null,
        county: (fields.county ?? null)?.toLowerCase() ?? null,
        neighborhood: fields.neighborhood ?? null,
        subdivision: fields.subdivision ?? null
      },
      ownerInfo: {
        owner: fields.owner ?? null,
        address: fields.mailadd ?? null,
        isOwnerOccupied: null
      },
      parcelRecords: [
        {
          parcelId: fields.ogc_fid ? String(fields.ogc_fid) : null,
          address: fields.address ?? null,
          owner: fields.owner ?? null,
          parcelNumber: fields.parcelnumb ?? null,
          parcelValue: toNum(fields.parval),
          useDescription: fields.usedesc ?? null,
          legalDescription: fields.legaldesc ?? null,
          lastRefreshByRegrid: fields.last_refresh ?? null
        }
      ],
      zoningData
    };

    return { success: true, data: detail };
  } catch (error) {
    console.error('Error fetching parcel detail:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to fetch parcel detail'
    };
  }
}
