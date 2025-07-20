'use server';

import { prisma } from '@/lib/db';

/**
 * Optimized function to fetch work orders and count in parallel
 * Eliminates duplicate WHERE clause execution and reduces database round trips
 */

/**
 * Core parcel‑detail structure returned from the Lightbox API after translation.
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
}

/**
 * Fetches detailed parcel information for a given address (single string) using the Regrid "parcels/address"
 * endpoint and maps it into a simplified `ParcelDetail` object.
 *
 * @param parcelId –
 */
export async function getParcelDetail(
  address: string
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
    if (!feature) {
      return {
        success: false,
        error: 'No parcel found for the provided address'
      };
    }

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
      ]
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
