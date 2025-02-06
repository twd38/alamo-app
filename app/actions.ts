'use server'
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function getWorkstations() {
    return await prisma.workStation.findMany({
      include: {
        jobs: true
      }
    })
  }

export async function createWorkStation(name: string) {
    await prisma.workStation.create({
      data: {
        name,
        kanbanOrder: 0
      }
    })
    revalidatePath('/production')
    // redirect('/production')
  }