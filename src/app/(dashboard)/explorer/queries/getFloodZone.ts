'use server';

/**
 * Interface representing FEMA flood zone data for a location.
 */
export interface FloodZoneData {
  floodZone: string | null; // e.g., "A", "AE", "X", "VE"
  floodRisk: 'high' | 'moderate' | 'low' | 'minimal' | null;
  specialFloodHazardArea: boolean;
  panelNumber: string | null;
  effectiveDate: string | null;
  source: 'FEMA' | 'unknown';
}

/**
 * Determines the flood risk level based on FEMA flood zone code.
 * Reference: https://www.fema.gov/flood-zones
 */
function getFloodRiskLevel(
  zoneCode: string | null
): 'high' | 'moderate' | 'low' | 'minimal' | null {
  if (!zoneCode) return null;

  const zone = zoneCode.toUpperCase().trim();

  // High-risk zones (Special Flood Hazard Areas - SFHA)
  // A, AE, AH, AO, AR, A99 - riverine flooding
  // V, VE - coastal flooding with wave action
  if (
    zone === 'A' ||
    zone.startsWith('AE') ||
    zone.startsWith('AH') ||
    zone.startsWith('AO') ||
    zone.startsWith('AR') ||
    zone === 'A99' ||
    zone === 'V' ||
    zone.startsWith('VE')
  ) {
    return 'high';
  }

  // Moderate-risk zones
  // X (shaded), B - 0.2% annual chance of flooding
  if (zone === 'B' || zone === 'X SHADED' || zone === 'X (SHADED)') {
    return 'moderate';
  }

  // Low/Minimal risk zones
  // X (unshaded), C, D - minimal flood hazard
  if (
    zone === 'C' ||
    zone === 'D' ||
    zone === 'X' ||
    zone === 'X UNSHADED' ||
    zone === 'X (UNSHADED)'
  ) {
    return 'minimal';
  }

  // Default for unknown zones
  return 'low';
}

/**
 * Checks if a flood zone is a Special Flood Hazard Area (SFHA).
 * SFHA zones have a 1% annual chance of flooding.
 */
function isSpecialFloodHazardArea(zoneCode: string | null): boolean {
  if (!zoneCode) return false;

  const zone = zoneCode.toUpperCase().trim();

  // All A and V zones are SFHA
  return (
    zone === 'A' ||
    zone.startsWith('AE') ||
    zone.startsWith('AH') ||
    zone.startsWith('AO') ||
    zone.startsWith('AR') ||
    zone === 'A99' ||
    zone === 'V' ||
    zone.startsWith('VE')
  );
}

/**
 * Fetches FEMA flood zone data for a given latitude/longitude.
 * Uses the FEMA National Flood Hazard Layer (NFHL) ArcGIS REST API.
 *
 * @param lat - Latitude of the location
 * @param lng - Longitude of the location
 * @returns An object with success flag and flood zone data
 */
export async function getFloodZone(
  lat: number,
  lng: number
): Promise<{ success: boolean; data?: FloodZoneData; error?: string }> {
  try {
    // FEMA NFHL ArcGIS REST API - Query the Flood Hazard Zones layer (layer 28)
    // Documentation: https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer
    const baseUrl =
      'https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/28/query';

    const params = new URLSearchParams({
      geometry: JSON.stringify({
        x: lng,
        y: lat,
        spatialReference: { wkid: 4326 }
      }),
      geometryType: 'esriGeometryPoint',
      spatialRel: 'esriSpatialRelIntersects',
      outFields: 'FLD_ZONE,ZONE_SUBTY,SFHA_TF,STATIC_BFE,DFIRM_ID,EFF_DATE',
      returnGeometry: 'false',
      f: 'json'
    });

    const response = await fetch(`${baseUrl}?${params.toString()}`, {
      headers: {
        Accept: 'application/json'
      },
      // Cache for 1 day since flood zones don't change frequently
      next: { revalidate: 60 * 60 * 24 }
    });

    if (!response.ok) {
      throw new Error(`FEMA API error: ${response.status}`);
    }

    const json = await response.json();

    // Check for API errors
    if (json.error) {
      throw new Error(
        `FEMA API error: ${json.error.message || JSON.stringify(json.error)}`
      );
    }

    // If no features returned, location might be outside flood map coverage
    if (!json.features || json.features.length === 0) {
      return {
        success: true,
        data: {
          floodZone: null,
          floodRisk: null,
          specialFloodHazardArea: false,
          panelNumber: null,
          effectiveDate: null,
          source: 'FEMA'
        }
      };
    }

    // Get the first (most relevant) feature
    const feature = json.features[0];
    const attributes = feature.attributes || {};

    const floodZone = attributes.FLD_ZONE || null;
    const zoneSubtype = attributes.ZONE_SUBTY || null;
    const sfhaTf = attributes.SFHA_TF; // 'T' for true (SFHA), 'F' for false
    const dfirmId = attributes.DFIRM_ID || null;
    const effDate = attributes.EFF_DATE || null;

    // Format flood zone with subtype if available
    let formattedZone = floodZone;
    if (floodZone && zoneSubtype && zoneSubtype !== 'null') {
      formattedZone = `${floodZone} (${zoneSubtype})`;
    }

    // Parse effective date if available
    let effectiveDate: string | null = null;
    if (effDate && typeof effDate === 'number') {
      effectiveDate = new Date(effDate).toISOString().split('T')[0];
    }

    const data: FloodZoneData = {
      floodZone: formattedZone,
      floodRisk: getFloodRiskLevel(floodZone),
      specialFloodHazardArea:
        sfhaTf === 'T' || isSpecialFloodHazardArea(floodZone),
      panelNumber: dfirmId,
      effectiveDate,
      source: 'FEMA'
    };

    return { success: true, data };
  } catch (error) {
    console.error('Error fetching FEMA flood zone data:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to fetch flood zone data'
    };
  }
}
