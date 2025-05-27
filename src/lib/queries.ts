'use server'
import { prisma } from "./db"
import { auth } from "./auth"
import { Prisma } from "@prisma/client"
import { createHash } from "crypto"

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

export async function getAllTasks() {
    return await prisma.task.findMany({
        where: {
            deletedOn: null
        },
        include: {
            assignees: true,
            createdBy: true,
            files: true,
            tags: true
        }
    })
}

export async function getBoards() {
    const session = await auth();
    const userId = session?.user?.id;
    
    if (!userId) return [];
    
    // Use prisma's standard API
    return await prisma.board.findMany({
        where: {
            OR: [
                { private: false },
                { createdById: userId },
                {
                    // Find boards where user is a collaborator
                    collaborators: {
                        some: { id: userId }
                    }
                }
            ]
        },
        include: {
            createdBy: true,
            collaborators: true,
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
}

export async function getBoard(boardId: string) {
    const session = await auth();
    const userId = session?.user?.id;
    
    if (!userId) return null;
    
    return await prisma.board.findFirst({
        where: {
            id: boardId,
            OR: [
                { private: false },
                { createdById: userId },
                {
                    // Find boards where user is a collaborator
                    collaborators: {
                        some: { id: userId }
                    }
                }
            ]
        },
        include: {
            createdBy: true,
            collaborators: true,
        }
    });
}

export async function getKanbanSections(boardId: string) {
    const session = await auth()
    const userId = session?.user?.id
    
    // If boardId = 'my-tasks', return all kanban sections for the user
    if (boardId === 'my-tasks') {
        return await prisma.kanbanSection.findMany({
            where: {
                deletedOn: null,
            },
            include: {
                tasks: {
                    where: {
                        deletedOn: null,
                        OR: [
                            { private: false },
                            { 
                                private: true,
                                assignees: {
                                    some: {
                                        id: userId
                                    }
                                }
                            }
                        ]
                    },
                    orderBy: {
                        taskOrder: 'asc'
                    },
                    include: {
                        assignees: true,
                        createdBy: true,
                        files: true,
                        tags: true
                    }
                }
            },
            orderBy: {
                kanbanOrder: 'asc'
            }
        })
    }
    
    return await prisma.kanbanSection.findMany({
        where: {
            deletedOn: null,
            boardId: boardId
        },
        include: {
            tasks: {
                where: {
                    deletedOn: null,
                    OR: [
                        { private: false },
                        { 
                            private: true,
                            createdById: userId
                        }
                    ]
                },
                orderBy: {
                    taskOrder: 'asc'
                },
                include: {
                    assignees: true,
                    createdBy: true,
                    files: true,
                    tags: true
                }
            }
        },
        orderBy: {
            kanbanOrder: 'asc'
        }
    })
}

export async function getAllTags(boardId?: string) {
    return await prisma.taskTag.findMany({
        where: {
            boardId: boardId
        },
        select: {
            id: true,
            name: true,
            color: true
        }
    })
}

export async function getKanbanSection(kanbanSectionId: string) {
    return await prisma.kanbanSection.findUnique({
        where: {
            id: kanbanSectionId
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
export async function getParcelDetail(address: string): Promise<{ success: boolean; data?: ParcelDetail; error?: string }> {
    try {
        /* ----------------------------------------------------------------------
         * Validate prerequisites & build request URL
         * ------------------------------------------------------------------- */
        const token = process.env.REGRID_API_TOKEN ?? process.env.NEXT_PUBLIC_REGRID_TILES_TOKEN;
        if (!token) {
            throw new Error("Missing REGRID_API_TOKEN or NEXT_PUBLIC_REGRID_TILES_TOKEN environment variable");
        }

        const endpointBase = "https://app.regrid.com/api/v2/parcels/address";
        const params = new URLSearchParams({
            query: address,
            limit: "1",
            token
        });

        const url = `${endpointBase}?${params.toString()}`;

        /* ------------------------------------------------------------------ */
        const response = await fetch(url, {
            headers: {
                "Content-Type": "application/json"
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
            return { success: false, error: "No parcel found for the provided address" };
        }

        /* ------------------------------------------------------------------ */
        // Helper for safe numeric parsing
        const toNum = (val: unknown): number | null => {
            if (val === undefined || val === null || val === "" || val === "NA") return null;
            const num = Number(String(val).replace(/[^0-9.\-]/g, ""));
            return Number.isFinite(num) ? num : null;
        };

        // Extract common sub‑objects from Regrid JSON
        const fields = feature?.properties?.fields ?? {};
        const geom = feature?.geometry;

        // Latitude/longitude – prefer explicit fields, fall back to geometry centroid
        let latitude: number | null = toNum(fields.lat) ?? null;
        let longitude: number | null = toNum(fields.lon) ?? null;

        if ((latitude === null || longitude === null) && geom?.type === "Polygon" && Array.isArray(geom.coordinates)) {
            // crude centroid for first polygon ring
            const ring: number[][] = geom.coordinates[0] as any;
            if (Array.isArray(ring) && ring.length > 0) {
                const [sumX, sumY] = ring.reduce<[number, number]>((acc, coord) => [acc[0] + coord[0], acc[1] + coord[1]], [0, 0]);
                const count = ring.length;
                longitude = longitude ?? sumX / count;
                latitude = latitude ?? sumY / count;
            }
        }

        /* ---------------------------- Map to schema ------------------------- */
        const detail: ParcelDetail = {
            id: fields.ogc_fid ? String(fields.ogc_fid) : feature.id ?? null,
            geom: latitude !== null && longitude !== null ? { type: "Point", coordinates: [longitude, latitude] } : null,
            lastRefreshByRegrid: fields.ll_updated_at ?? null,
            latitude,
            ll_uuid: fields.ll_uuid ?? null,
            longitude,
            parcelNumber: fields.parcelnumb ?? null,
            region: (fields.city ?? fields.scity ?? "").toLowerCase() || null,
            sourceUrl: `https://app.regrid.com${feature?.properties?.path ?? ""}`,
            yearBuilt: toNum(fields.yearbuilt) ?? null,
            zoning: fields.zoning ?? null,
            zoningDefinitionId: null,
            // Regrid does not directly expose lot dimensions – leave null for now
            dimensions: {
                gisSqft: fields.ll_gissqft ?? null,
                gisAcre: fields.ll_gisacres ?? null,
                lotDepth: null,
                lotWidth: null,
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
            parcelRecords: [{
                parcelId: fields.ogc_fid ? String(fields.ogc_fid) : null,
                address: fields.address ?? null,
                owner: fields.owner ?? null,
                parcelNumber: fields.parcelnumb ?? null,
                parcelValue: toNum(fields.parval),
                useDescription: fields.usedesc ?? null,
                legalDescription: fields.legaldesc ?? null,
                lastRefreshByRegrid: fields.last_refresh ?? null
            }]
        };

        return { success: true, data: detail };
    } catch (error) {
        console.error("Error fetching parcel detail:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to fetch parcel detail"
        };
    }
}

/**
 * Interface representing the translated zoning detail structure derived from the Zoneomics API.
 */
export interface ParcelZoningDetail {
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

        const endpoint = `https://api.zoneomics.com/v2/zoneDetail?api_key=${apiKey}&address=${encodeURIComponent(parcelAddress)}&output_fields=plu,controls&replace_STF=false`;
        const zoneDetailResponse: Response = await fetch(endpoint, {
            headers: { 'Content-Type': 'application/json' },
            // Cache control: cache for 1 day and revalidate thereafter
            next: { revalidate: 60 * 60 * 24 }
        });

        const zoneScreenshotResponse: Response = await fetch(`https://api.zoneomics.com/v2/zoneScreenshot?api_key=${apiKey}&address=${encodeURIComponent(parcelAddress)}`, {
            headers: { 'Content-Type': 'application/json' },
            // Cache control: cache for 1 day and revalidate thereafter
            next: { revalidate: 60 * 60 * 24 }
        });

        if (!zoneDetailResponse.ok) {
            const errorText = await zoneDetailResponse.text();
            throw new Error(`Zoneomics API error: ${zoneDetailResponse.status} – ${errorText}`);
        }

        const json: any = await zoneDetailResponse.json();
        const zoneScreenshot: any = await zoneScreenshotResponse;


        const data = json.data ?? {};
        const meta = data.meta ?? {};
        const zoneDetails = data.zone_details ?? {};
        const permitted = data.permitted_land_uses ?? {};
        const controls = data.controls ?? {};
        const screenshot = zoneScreenshot.url ?? "";

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

export async function getDevelopmentPlan(developmentPlanId: string) {
    const developmentPlan = await prisma.developmentPlan.findUnique({
        where: { id: developmentPlanId },
    });

    return developmentPlan;
}

export async function getAllViews(boardId?: string) {
    return await prisma.boardView.findMany({
        where: {
            boardId: boardId
        },
        include: {
            createdBy: true
        },
        orderBy: {
            createdAt: 'asc'
        }
    })
}
