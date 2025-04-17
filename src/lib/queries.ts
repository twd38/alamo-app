'use server'
import { prisma } from "./db"
import { auth } from "./auth"
import { Prisma } from "@prisma/client"
import { metersToSquareFeet, metersToFeet } from "./utils"

export async function getUser() {
    const session = await auth()
    return await prisma.user.findUnique({
        where: {
            id: session?.user?.id
        }
    })
}

export async function getAllUsers() {
    return await prisma.user.findMany()
}

export async function getJobs() {
    return await prisma.job.findMany()
}

export async function getWorkstations() {
    return await prisma.workStation.findMany({
        where: {
            deletedOn: null
        },
        include: {
            jobs: true,
            tasks: {
                where: {
                    deletedOn: null
                },
                orderBy: {
                    taskOrder: 'asc'
                },
                include: {
                    assignees: true,
                    createdBy: true,
                    files: true
                }
            }
        }
    })
}

export async function getWorkstationJobs(workstationId: string) {
    return await prisma.job.findMany({
        where: {
            workStationId: workstationId
        }
    })
}

export async function getWorkstation(workstationId: string) {
    return await prisma.workStation.findUnique({
        where: {
            id: workstationId
        }
    })
}

export async function getJob(jobId: string) {
    return await prisma.job.findUnique({
        where: {
            id: jobId
        }
    })
}

export async function getParts({
    query,
    page,
    limit,
    sortBy,
    sortOrder
}: {
    query: string;
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: string;
}) {
    return await prisma.part.findMany({
        where: {
            OR: [
                {
                    description: { 
                        contains: query,
                        mode: 'insensitive'
                    }
                },
                {
                    partNumber: { 
                        contains: query,
                        mode: 'insensitive'
                    }
                }
            ]
        },
        orderBy: {
            [sortBy]: sortOrder
        },
        skip: (page - 1) * limit,
        take: limit
    })
}

export async function getPartsCount({
    query
}: {
    query: string;
}) {
    return await prisma.part.count({
        where: {
            OR: [
                {
                    description: { 
                        contains: query,
                        mode: 'insensitive'
                    }
                },
                {
                    partNumber: { 
                        contains: query,
                        mode: 'insensitive'
                    }
                }
            ]
        }
    })
}

export async function getPart(partId: string) {
    return await prisma.part.findUnique({
        where: {
            id: partId
        },
        include: {
            partImage: true,
            files: true,
            basePartTo: true,
            bomParts: true
        }
    })
}

export async function getPartByPartNumber(partNumber: string) {
    return await prisma.part.findUnique({
        where: {
            partNumber: partNumber
        },
        include: {
            partImage: true,
            files: true,
            basePartTo: true,
            bomParts: true
        }
    })
}

export async function getPartWorkInstructions(partNumber: string) {
    try {
        const result = await prisma.workInstruction.findMany({
            where: {
                part: {
                    partNumber: partNumber
                }
            },
            include: {
                steps: {
                    include: {
                        actions: {
                            include: {
                                uploadedFile: true
                            }
                        },
                        images: true,
                    },
                    orderBy: {
                        stepNumber: 'asc'
                    }
                }
            }
        });
        return result;
    } catch (error) {
        console.error('Error fetching work instructions:', error);
        throw error;
    }
}

export type PartWorkInstructions = Prisma.PromiseReturnType<typeof getPartWorkInstructions>

/**
 * Fetches all orders from the database, ordered by creation date (newest first)
 * @returns Array of Order objects
 */
export async function getOrders() {
    return await prisma.order.findMany({
        orderBy: {
            createdAt: 'desc' // Most recent orders first
        }
    })
}

export type Order = Prisma.PromiseReturnType<typeof getOrders>[0]

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
    /** Lightbox UUID, or null */
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
        lotDepth: number | null;
        lotWidth: number | null;
        parcelId: string | null;
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
 * Fetches detailed parcel information for a given address (single string) using the LightBox API
 * and maps it into a simplified `ParcelDetail` object.
 *
 * @param address – Full street address (e.g. "513 PECAN GROVE RD Austin, TX 78704")
 */
export async function getParcelDetail(address: string): Promise<{ success: boolean; data?: ParcelDetail; error?: string }> {
    try {
        const encoded = encodeURIComponent(address);
        const url = `https://api.lightboxre.com/v1/parcels/address?text=${encoded}`;

        const response = await fetch(url, {
            headers: {
                'x-api-key': `${process.env.LIGHTBOX_CONSUMER_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`LightBox API error: ${response.status} – ${errorText}`);
        }

        const json: any = await response.json();
        const parcel = (json.parcels && json.parcels.length > 0) ? json.parcels[0] : null;
        if (!parcel) {
            return { success: false, error: 'No parcel found for the provided address' };
        }

        console.log(parcel);

        const repPt = parcel.location?.representativePoint ?? {};
        const latitude = typeof repPt.latitude === 'number' ? repPt.latitude : null;
        const longitude = typeof repPt.longitude === 'number' ? repPt.longitude : null;

        const detail: ParcelDetail = {
            id: parcel.id ?? null,
            geom: latitude !== null && longitude !== null ? { type: 'Point', coordinates: [longitude, latitude] } : null,
            lastRefreshByRegrid: parcel.lastRefreshByRegrid ?? null,
            latitude,
            ll_uuid: parcel.ll_uuid ?? null,
            longitude,
            parcelNumber: parcel.parcelApn ?? parcel.assessment?.apn ?? null,
            region: parcel.location?.locality?.toLowerCase() ?? null,
            sourceUrl: `https://stage.travis.prodigycad.com/property-detail/${parcel.parcelApn ?? ''}`,
            yearBuilt: parcel.primaryStructure?.yearBuilt ? Number(parcel.primaryStructure.yearBuilt) : null,
            zoning: parcel.assessment?.zoning?.assessment ?? null,
            zoningDefinitionId: null,
            dimensions: parcel.assessment?.lot ? {
                gisSqft: metersToSquareFeet(parcel.assessment.lot.size) ?? null,
                lotDepth: metersToFeet(parcel.assessment.lot.depth) ?? null,
                lotWidth: metersToFeet(parcel.assessment.lot.width) ?? null,
                parcelId: parcel.id ?? null
            } : null,
            appraisal: parcel.assessment ? {
                parcelValue: parcel.assessment.marketValue?.total ?? null,
                landValue: parcel.assessment.marketValue?.land ?? null,
                improvementValue: parcel.assessment.marketValue?.improvements ?? null,
                parcelId: parcel.id ?? null
            } : null,
            censusData: parcel.census ? {
                censusBlock: parcel.census.blockGroup ? parcel.fips + parcel.census.tract + parcel.census.blockGroup : null,
                censusTract: parcel.census.tract ?? null,
                censusBlockGroup: parcel.census.blockGroup ?? null
            } : null,
            attributes: null,
            intersections: null,
            streetAddress: parcel.location ? {
                address: parcel.location.streetAddress,
                city: parcel.location.locality?.toLowerCase(),
                stateAbbreviation: parcel.location.regionCode,
                zip: parcel.location.postalCode,
                county: parcel.county?.toLowerCase()
            } : null,
            ownerInfo: parcel.owner ? {
                owner: parcel.owner.names?.[0]?.fullName ?? null,
                address: parcel.owner.streetAddress ?? null,
                isOwnerOccupied: parcel.occupant?.owner ?? null
            } : null,
            parcelRecords: parcel ? [{
                parcelId: parcel.id ?? null,
                address: parcel.location?.streetAddress ?? null,
                owner: parcel.owner?.names?.[0]?.fullName ?? null,
                parcelNumber: parcel.parcelApn ?? null,
                parcelValue: parcel.assessment?.marketValue?.total ?? null,
                useDescription: parcel.landUse?.normalized?.description ?? null,
                legalDescription: parcel.legalDescription?.[0] ?? null,
                lastRefreshByRegrid: null
            }] : null
        };

        return { success: true, data: detail };
    } catch (error) {
        console.error('Error fetching parcel detail:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch parcel detail'
        };
    }
}

/** @deprecated Use `getParcelDetail` instead */
export const getParcelByAddress = getParcelDetail;

/**
 * Interface representing the translated zoning detail structure derived from the Zoneomics API.
 */
export interface ParcelZoningDetail {
    /** Unique identifier for the zoning detail (if provided by Zoneomics, otherwise null) */
    readonly id: string | null;
    /** Five–digit FIPS (GEOID) for the county/municipality (if provided, otherwise null) */
    readonly geoid: string | null;
    /** Municipality identifier supplied by Zoneomics */
    readonly municipalityId: number | null;
    /** Municipality name supplied by Zoneomics */
    readonly municipalityName: string | null;
    /** Zoning code */
    readonly zoning: string | null;
    /** Zoning description */
    readonly zoningDescription: string | null;
    /** Zoning type (e.g. Planned, Base) */
    readonly zoningType: string | null;
    /** Zoning subtype */
    readonly zoningSubtype: string | null;
    /** Zoning objective/guide, if any */
    readonly zoningObjective: string | null;
    /** Link to the detailed zoning code */
    readonly zoningCodeLink: string | null;

    /** Categorised permitted land‑uses */
    readonly permittedLandUses: {
        other: string[];
        lodging: string[];
        community: string[];
        mechanical: string[];
        agriculture: string[];
        residential: string[];
    };

    /** Comma separated list of boolean flags that are permitted as‑of‑right */
    readonly permittedLandUsesAsOfRight: string | null;
    /** Placeholder for conditional land‑uses (currently not parsed, kept for future use) */
    readonly permittedLandUsesConditional: string | null;

    /** Minimum lot area in square feet */
    readonly minLotAreaSqFt: number ;
    /** Minimum lot width in feet */
    readonly minLotWidthFt: number ;
    /** Maximum building height in feet */
    readonly maxBuildingHeightFt: number ;
    /** Maximum floor‑area ratio */
    readonly maxFar: number ;
    /** Minimum front setback in feet */
    readonly minFrontSetbackFt: number ;
    /** Minimum rear setback in feet */
    readonly minRearSetbackFt: number;
    /** Minimum side setback in feet or the string literal 'too-complex' when non‑numeric */
    readonly minSideSetbackFt: number;
    /** Maximum building coverage percentage */
    readonly maxCoveragePct: number ;
    /** Maximum impervious coverage percefntage */
    readonly maxImperviousCoveragePct: number;
    /** Minimum landscaped space percentage */
    readonly minLandscapedSpacePct: number;
    /** Minimum open space percentage */
    readonly minOpenSpacePct: number ;
    /** Maximum dwelling‑unit density per acre */
    readonly maxDensityDuPerAcre: number ;
}

/**
 * Fetches zoning‑detail information for a given address via the Zoneomics API and
 * normalises the result into a `ParcelZoningDetail` object.
 *
 * @param parcelAddress – Full parcel street address (e.g. "123 Main St, Austin, TX 78701")
 * @returns   An object whose `success` flag indicates whether the request succeeded and,
 *            when successful, contains the translated `ParcelZoningDetail` in `data`.
 */
export async function getParcelZoningDetail(parcelAddress: string): Promise<{ success: boolean; data?: ParcelZoningDetail; error?: string }> {
    try {
        const apiKey = process.env.ZONEOMICS_API_KEY;
        if (!apiKey) {
            throw new Error('Missing ZONEOMICS_API_KEY environment variable');
        }

        const endpoint = `https://api.zoneomics.com/v2/zoneDetail?api_key=${apiKey}&address=${encodeURIComponent(parcelAddress)}&output_fields=plu,controls`;
        const response: Response = await fetch(endpoint, {
            headers: { 'Content-Type': 'application/json' },
            // Cache control: cache for 1 day and revalidate thereafter
            next: { revalidate: 60 * 60 * 24 }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Zoneomics API error: ${response.status} – ${errorText}`);
        }

        const json: any = await response.json();
        if (!json.success) {
            throw new Error('Zoneomics API returned an unsuccessful response');
        }

        console.log(json.data.controls);

        const data = json.data ?? {};
        const meta = data.meta ?? {};
        const zoneDetails = data.zone_details ?? {};
        const permitted = data.permitted_land_uses ?? {};
        const controls = data.controls ?? {};

        /* --------------------------- Helper functions --------------------------- */
        const parseNum = (value: unknown): number  => {
            if (value === undefined || value === null || value === 'NA') return 0;
            const str = String(value).replace(/[^0-9.\-]/g, '');
            const num = Number(str);
            return Number.isFinite(num) ? num : 0;
        };

        const parseSideSetback = (value: unknown): number | 'not-applicable' | 'too-complex' => {
            if (value === undefined || value === null) return 'not-applicable';
            const numeric = parseNum(value);
            return typeof numeric === 'number' ? numeric : 'too-complex';
        };

        /** Categorises a single land‑use string into one of the predefined buckets. */
        const categoriseUse = (use: string): keyof ParcelZoningDetail['permittedLandUses'] => {
            const u = use.toLowerCase();
            const hasAny = (keywords: string[]) => keywords.some((k) => u.includes(k));
            if (hasAny(['residential', 'dwelling', 'housing', 'duplex', 'single family', 'two unit', 'condominium', 'multifamily'])) return 'residential';
            if (hasAny(['bed and breakfast', 'hotel', 'motel', 'short term rental'])) return 'lodging';
            if (hasAny(['school', 'educational', 'university', 'hospital', 'medical', 'public', 'community', 'religious'])) return 'community';
            if (hasAny(['communication', 'tower', 'utility', 'terminal', 'equipment', 'storage'])) return 'mechanical';
            if (hasAny(['agricultur', 'farm', 'crop', 'horticulture', 'nursery', 'animal'])) return 'agriculture';
            return 'other';
        };

        /* ------------------------ Build translated object ----------------------- */
        const categories: ParcelZoningDetail['permittedLandUses'] = {
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

        const detail: ParcelZoningDetail = {
            id: zoneDetails.id ?? null,
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
            minLotAreaSqFt: parseNum(controls?.lot_standard?.standard?.min_lot_area_sq_ft),
            minLotWidthFt: parseNum(controls?.lot_width_standard?.standard?.min_lot_width_ft),
            maxBuildingHeightFt: parseNum(controls?.building_height_standard?.standard?.max_building_height_ft),
            maxFar: parseNum(controls?.far_standard?.standard?.max_far),
            minFrontSetbackFt: parseNum(controls?.front_setback_standard?.standard?.min_front_yard_ft),
            minRearSetbackFt: parseNum(controls?.rear_setback_standard?.standard?.min_rear_yard_ft),
            minSideSetbackFt: controls?.side_setback_standard?.standard?.min_side_yard_ft,
            maxCoveragePct: parseNum(controls?.coverage_standard?.standard?.max_coverage),
            maxImperviousCoveragePct: parseNum(controls?.coverage_standard?.standard?.max_impervious_coverage_percentage),
            minLandscapedSpacePct: parseNum(controls?.pervious_standard?.standard?.min_landscaped_space_percentage),
            minOpenSpacePct: parseNum(controls?.pervious_standard?.standard?.open_space_percentage),
            maxDensityDuPerAcre: parseNum(controls?.density_standard?.standard?.max_density_du_per_acre)
        };

        return { success: true, data: detail };
    } catch (error) {
        console.error('Error fetching parcel zoning detail:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch zoning detail'
        };
    }
}

// Keep the parcel‑by‑ID function for backward compatibility / reference
export async function getParcelById(parcelId: string) {
    const response = await fetch(`https://api.lightbox.com/v1/parcels/${parcelId}`, {
        headers: {
            Authorization: `Bearer ${process.env.LIGHTBOX_CONSUMER_KEY}`
        }
    });
    return await response.json();
}
