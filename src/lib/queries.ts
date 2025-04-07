'use server'
import { prisma } from "./db"
import { auth } from "./auth"
import { Prisma } from "@prisma/client"

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
 * Interface representing the structure of parcel data returned from the LightBox API
 */
export interface ParcelData {
  id?: string;
  fips?: string;
  parcelApn?: string;
  assessment?: {
    alternateApn?: string | null;
    apn?: string;
    assessedValue?: {
      total?: number;
      land?: number;
      improvements?: number;
      year?: string;
    };
    marketValue?: {
      total?: number;
      land?: number;
      improvements?: number;
      year?: string;
    };
    improvementPercent?: number;
    lot?: {
      lotNumber?: string;
      blockNumber?: string | null;
      depth?: number;
      width?: number;
      size?: number;
    };
    poolIndicator?: string | null;
    zoning?: {
      assessment?: string | null;
    };
    book?: string | null;
    page?: string | null;
    avm?: string;
  };
  landUse?: {
    code?: string;
    description?: string;
    normalized?: {
      code?: string;
      description?: string;
      categoryDescription?: string;
    };
  };
  lastLoan?: {
    recordingDate?: string;
    dueDate?: string;
    lender?: string;
    value?: number;
    transactionId?: string;
    interestRates?: string | null;
  };
  legalDescription?: string[];
  location?: {
    streetAddress?: string;
    countryCode?: string;
    locality?: string;
    regionCode?: string;
    postalCode?: string;
    postalCodeExt?: string | null;
    geometry?: {
      wkt?: string;
    };
    representativePoint?: {
      longitude?: number;
      latitude?: number;
      geometry?: {
        wkt?: string;
      };
    };
  };
  neighborhood?: string | null;
  occupant?: {
    owner?: boolean;
    company?: boolean;
  };
  owner?: {
    names?: {
      fullName?: string;
      firstName?: string;
      middleName?: string | null;
      lastName?: string;
    }[];
    streetAddress?: string;
    countryCode?: string;
    locality?: string;
    regionCode?: string;
    postalCode?: string;
    postalCodeExt?: string | null;
    ownerNameStd?: string | null;
    ownershipStatus?: {
      code?: string;
      description?: string;
    };
  };
  opportunityZone?: boolean;
  primaryStructure?: {
    yearBuilt?: string;
    yearRenovated?: string | null;
    units?: number | null;
    livingArea?: number;
  };
  subdivision?: string;
  tax?: {
    year?: string;
    yearDelinquent?: string | null;
    amount?: number;
    taxRateAreaCode?: string | null;
    id?: string | null;
    taxAccountNumber?: string;
    exemption?: string;
  };
  transaction?: {
    lastMarketSale?: {
      pricePerArea?: number | null;
      value?: number | null;
      seller?: string;
      buyer?: string;
      filingDate?: string;
      transferDate?: string;
      documentNumber?: string;
      documentTypeCode?: string;
      documentTypeDescription?: string;
      lender?: string | null;
      loan?: {
        code?: string;
        description?: string;
        first?: number;
        second?: number;
      };
      sale?: {
        code?: string | null;
        description?: string | null;
      };
      titleCompany?: string;
      tdDocumentNumber?: string;
      deedTransactionType?: string;
      lenderType?: string;
    };
    priorMarketSale?: {
      transferDate?: string | null;
      lender?: string;
    };
    multipleApnFlag?: string | null;
  };
  structures?: {
    id?: string;
    isPrimary?: boolean;
  }[];
  // For backward compatibility with UI that might expect the old fields
  address?: {
    streetNumber?: string;
    streetName?: string;
    city?: string;
    state?: string;
    zip?: string;
    fullAddress?: string;
  };
  property?: {
    landArea?: number;
    buildingArea?: number;
    yearBuilt?: string;
    bedrooms?: number;
    bathrooms?: number;
    propertyType?: string;
    zoning?: string;
    taxAssessedValue?: number;
  };
}

export async function getParcelByAddress(address: {
    street: string;
    city: string;
    state: string;
    zip?: string;
}): Promise<{ success: boolean; data?: ParcelData; error?: string }> {
    try {
        // Construct the query parameters
        const queryParams = new URLSearchParams({
            street: address.street,
            city: address.city,
            state: address.state,
        });
        
        // Add optional zip parameter if provided
        if (address.zip) {
            queryParams.append('zip', address.zip);
        }

        const queryText = encodeURIComponent(`${address.street}, ${address.city}, ${address.state}${address.zip ? ` ${address.zip}` : ''}`)
        
        // Make the API request
        const response:any = await fetch(`https://api.lightboxre.com/v1/parcels/address?text=${queryText}`, {
            headers: {
                'x-api-key': `${process.env.LIGHTBOX_CONSUMER_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        // Check if the request was successful
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`LightBox API error: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        const parcelData = data.parcels[0];
        return { success: true, data: parcelData };
    } catch (error) {
        console.error('Error fetching parcel by address:', error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Failed to fetch parcel data'
        };
    }
}

// Keep the original function for backward compatibility
export async function getParcelById(parcelId: string) {
    const response = await fetch(`https://api.lightbox.com/v1/parcels/${parcelId}`, {
        headers: {
            'Authorization': `Bearer ${process.env.LIGHTBOX_CONSUMER_KEY}`
        }
    })
    const data = await response.json()
    return data
}
