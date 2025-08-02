'use server';

import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export interface GetPartsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  partType?: string;
  trackingType?: string;
}

export async function getParts(params: GetPartsParams = {}) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const {
    page = 1,
    pageSize = 10,
    search = '',
    sortBy = 'name',
    sortOrder = 'asc',
    partType,
    trackingType,
  } = params;

  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { partNumber: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (partType) {
    where.partType = partType;
  }

  if (trackingType) {
    where.trackingType = trackingType;
  }

  const orderBy: any = {};
  if (sortBy) {
    orderBy[sortBy] = sortOrder;
  }

  const [parts, total] = await Promise.all([
    prisma.part.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        partImage: true,
      },
    }),
    prisma.part.count({ where }),
  ]);

  return {
    data: parts,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function duplicatePart(partId: string, newName: string, newPartNumber: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  // Get the original part
  const originalPart = await prisma.part.findUnique({
    where: { id: partId },
    include: {
      bomParts: true,
      files: true,
    },
  });

  if (!originalPart) {
    throw new Error('Part not found');
  }

  // Create the duplicate
  const duplicatedPart = await prisma.part.create({
    data: {
      name: newName,
      partNumber: newPartNumber,
      description: originalPart.description,
      partRevision: originalPart.partRevision,
      trackingType: originalPart.trackingType,
      partType: originalPart.partType,
      unit: originalPart.unit,
      nxFilePath: originalPart.nxFilePath,
      // Don't copy file references as they should be unique per part
    },
  });

  revalidatePath('/parts/library');
  return duplicatedPart;
}