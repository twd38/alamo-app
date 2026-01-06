'use server';

import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export interface CreateProjectInput {
  name: string;
  parcelNumber: string | null;
  address: string | null;
  lotAreaSqFt: number | null;
  zoningCode: string | null;
  floodZone: string | null;
  latitude: number | null;
  longitude: number | null;
  maxUnits: number | null;
  buildableArea: number | null;
  estimatedValue: number | null;
  landCost: number | null;
}

export async function createProject(input: CreateProjectInput): Promise<{
  success: boolean;
  data?: { id: string; name: string };
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    // Validate input
    if (!input.name || input.name.trim().length === 0) {
      return { success: false, error: 'Project name is required' };
    }

    if (input.name.length > 200) {
      return { success: false, error: 'Project name must be 200 characters or less' };
    }

    const project = await prisma.project.create({
      data: {
        name: input.name.trim(),
        parcelNumber: input.parcelNumber,
        address: input.address,
        lotAreaSqFt: input.lotAreaSqFt,
        zoningCode: input.zoningCode,
        floodZone: input.floodZone,
        latitude: input.latitude,
        longitude: input.longitude,
        maxUnits: input.maxUnits,
        buildableArea: input.buildableArea,
        estimatedValue: input.estimatedValue,
        landCost: input.landCost,
        createdById: session.user.id,
      },
      select: {
        id: true,
        name: true,
      },
    });

    // Revalidate projects page if it exists
    revalidatePath('/projects');

    return { success: true, data: project };
  } catch (error) {
    console.error('Error creating project:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create project',
    };
  }
}
