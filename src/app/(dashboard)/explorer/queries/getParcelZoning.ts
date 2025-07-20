'use server';

/**
 * Interface representing the translated zoning detail structure derived from the Zoneomics API.
 */
export interface ParcelZoning {
  id: string | null;
  screenshot: string | null;
  geoid: string | null;
  municipalityId: number | null;
  municipalityName: string | null;
  zoning: string | null;
  zoningDescription: string | null;
  zoningType: string | null;
  zoningSubtype: string | null;
  zoningObjective: string | null;
  zoningCodeLink: string | null;
  permittedLandUses: {
    other: string[];
    lodging: string[];
    community: string[];
    mechanical: string[];
    agriculture: string[];
    residential: string[];
  };
  permittedLandUsesAsOfRight: string | null;
  permittedLandUsesConditional: string | null;
  minLotAreaSqFt: number;
  minLotWidthFt: number;
  maxBuildingHeightFt: number;
  maxFar: number;
  minFrontSetbackFt: number;
  minRearSetbackFt: number;
  minSideSetbackFt: number;
  maxCoveragePct: number;
  maxImperviousCoveragePct: number;
  minLandscapedSpacePct: number;
  minOpenSpacePct: number;
  maxDensityDuPerAcre: number;
}

/**
 * Fetches zoning‑detail information for a given address via the Zoneomics API and
 * normalises the result into a `ParcelZoning` object.
 *
 * @param parcelAddress – Full parcel street address (e.g. "123 Main St, Austin, TX 78701")
 * @returns   An object whose `success` flag indicates whether the request succeeded and,
 *            when successful, contains the translated `ParcelZoning` in `data`.
 */
export async function getParcelZoning(
  parcelAddress: string
): Promise<{ success: boolean; data?: ParcelZoning; error?: string }> {
  try {
    const apiKey = process.env.ZONEOMICS_API_KEY;
    if (!apiKey) {
      throw new Error('Missing ZONEOMICS_API_KEY environment variable');
    }

    const endpoint = `https://api.zoneomics.com/v2/zoneDetail?api_key=${apiKey}&address=${encodeURIComponent(parcelAddress)}&output_fields=plu,controls&replace_STF=false`;
    const zoneDetailResponse: Response = await fetch(endpoint, {
      headers: { 'Content-Type': 'application/json' },
      // Cache control: cache for 1 day and revalidate thereafter
      next: { revalidate: 60 * 60 * 24 }
    });

    const zoneScreenshotResponse: Response = await fetch(
      `https://api.zoneomics.com/v2/zoneScreenshot?api_key=${apiKey}&address=${encodeURIComponent(parcelAddress)}`,
      {
        headers: { 'Content-Type': 'application/json' },
        // Cache control: cache for 1 day and revalidate thereafter
        next: { revalidate: 60 * 60 * 24 }
      }
    );

    if (!zoneDetailResponse.ok) {
      const errorText = await zoneDetailResponse.text();
      throw new Error(
        `Zoneomics API error: ${zoneDetailResponse.status} – ${errorText}`
      );
    }

    const json: any = await zoneDetailResponse.json();
    const zoneScreenshot: any = await zoneScreenshotResponse;

    const data = json.data ?? {};
    const meta = data.meta ?? {};
    const zoneDetails = data.zone_details ?? {};
    const permitted = data.permitted_land_uses ?? {};
    const controls = data.controls ?? {};
    const screenshot = zoneScreenshot.url ?? '';

    /* --------------------------- Helper functions --------------------------- */
    const parseNum = (value: unknown): number => {
      if (value === undefined || value === null || value === 'NA') return 0;
      const str = String(value).replace(/[^0-9.-]/g, '');
      const num = Number(str);
      return Number.isFinite(num) ? num : 0;
    };

    const parseSideSetback = (
      value: unknown
    ): number | 'not-applicable' | 'too-complex' => {
      if (value === undefined || value === null) return 'not-applicable';
      const numeric = parseNum(value);
      return typeof numeric === 'number' ? numeric : 'too-complex';
    };

    /** Categorises a single land‑use string into one of the predefined buckets. */
    const categoriseUse = (
      use: string
    ): keyof ParcelZoning['permittedLandUses'] => {
      const u = use.toLowerCase();
      const hasAny = (keywords: string[]) =>
        keywords.some((k) => u.includes(k));
      if (
        hasAny([
          'residential',
          'dwelling',
          'housing',
          'duplex',
          'single family',
          'two unit',
          'condominium',
          'multifamily'
        ])
      )
        return 'residential';
      if (hasAny(['bed and breakfast', 'hotel', 'motel', 'short term rental']))
        return 'lodging';
      if (
        hasAny([
          'school',
          'educational',
          'university',
          'hospital',
          'medical',
          'public',
          'community',
          'religious'
        ])
      )
        return 'community';
      if (
        hasAny([
          'communication',
          'tower',
          'utility',
          'terminal',
          'equipment',
          'storage'
        ])
      )
        return 'mechanical';
      if (
        hasAny([
          'agricultur',
          'farm',
          'crop',
          'horticulture',
          'nursery',
          'animal'
        ])
      )
        return 'agriculture';
      return 'other';
    };

    /* ------------------------ Build translated object ----------------------- */
    const categories: ParcelZoning['permittedLandUses'] = {
      other: [],
      lodging: [],
      community: [],
      mechanical: [],
      agriculture: [],
      residential: []
    };

    (permitted.as_of_right as string[] | undefined)?.forEach((use) => {
      const key = categoriseUse(use);
      categories[key].push(use);
    });

    const permittedFlags = Object.entries(permitted)
      .filter(([k, v]) => typeof v === 'boolean' && v === true)
      .map(([k]) => k)
      .join(', ');

    const detail: ParcelZoning = {
      id: zoneDetails.id ?? null,
      screenshot: screenshot ?? null,
      geoid: meta.geoid ?? null,
      municipalityId: meta.city_id ?? null,
      municipalityName: meta.city_name ?? null,
      zoning: zoneDetails.zone_code ?? null,
      zoningDescription: zoneDetails.zone_name ?? null,
      zoningType: zoneDetails.zone_type ?? null,
      zoningSubtype: zoneDetails.zone_sub_type ?? null,
      zoningObjective: zoneDetails.zone_guide ?? null,
      zoningCodeLink: zoneDetails.link ?? null,
      permittedLandUses: categories,
      permittedLandUsesAsOfRight: permittedFlags || null,
      permittedLandUsesConditional: null,
      minLotAreaSqFt: parseNum(
        controls?.lot_standard?.standard?.min_lot_area_sq_ft
      ),
      minLotWidthFt: parseNum(
        controls?.lot_width_standard?.standard?.min_lot_width_ft
      ),
      maxBuildingHeightFt: parseNum(
        controls?.building_height_standard?.standard?.max_building_height_ft
      ),
      maxFar: parseNum(controls?.far_standard?.standard?.max_far),
      minFrontSetbackFt: parseNum(
        controls?.front_setback_standard?.standard?.min_front_yard_ft
      ),
      minRearSetbackFt: parseNum(
        controls?.rear_setback_standard?.standard?.min_rear_yard_ft
      ),
      minSideSetbackFt:
        controls?.side_setback_standard?.standard?.min_side_yard_ft,
      maxCoveragePct: parseNum(
        controls?.coverage_standard?.standard?.max_coverage
      ),
      maxImperviousCoveragePct: parseNum(
        controls?.coverage_standard?.standard
          ?.max_impervious_coverage_percentage
      ),
      minLandscapedSpacePct: parseNum(
        controls?.pervious_standard?.standard?.min_landscaped_space_percentage
      ),
      minOpenSpacePct: parseNum(
        controls?.pervious_standard?.standard?.open_space_percentage
      ),
      maxDensityDuPerAcre: parseNum(
        controls?.density_standard?.standard?.max_density_du_per_acre
      )
    };

    return { success: true, data: detail };
  } catch (error) {
    console.error('Error fetching parcel zoning detail:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to fetch zoning detail'
    };
  }
}
