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
    return await prisma.workInstruction.findMany({
        where: {
            part: {
                partNumber: partNumber
            }
        },
        include: {
            steps: {
                include: {
                    actions: true
                }
            }
        }
    })
}
export type PartWorkInstructions = Prisma.PromiseReturnType<typeof getPartWorkInstructions>