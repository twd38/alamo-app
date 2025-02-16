'use server'
import { prisma } from "./db"
import { auth } from "./auth"


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

export async function getWorkstations() {
    return await prisma.workStation.findMany({
        where: {
            deletedOn: null
        },
        include: {
            jobs: true,
            tasks: {
                include: {
                    assignees: true,
                    createdBy: true,
                    files: true
                }
            }
        }
    })
}

export async function getJobs() {
    return await prisma.job.findMany()
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

export async function getAllWorkStations() {
    return await prisma.workStation.findMany()
}

export async function getJob(jobId: string) {
    return await prisma.job.findUnique({
        where: {
            id: jobId
        }
    })
}