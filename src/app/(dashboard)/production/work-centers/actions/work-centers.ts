'use server';

import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { WorkCenterType } from '@prisma/client';

const workCenterSchema = z.object({
  code: z.string().min(1, 'Code is required').max(20, 'Code must be less than 20 characters'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().nullable(),
  type: z.nativeEnum(WorkCenterType),
  capacity: z.coerce.number().min(0, 'Capacity must be positive'),
  efficiency: z.coerce.number().min(0, 'Efficiency must be between 0 and 1').max(1, 'Efficiency must be between 0 and 1'),
  setupTime: z.coerce.number().min(0, 'Setup time must be positive'),
  costPerHour: z.coerce.number().min(0, 'Cost per hour must be positive'),
  isActive: z.boolean().default(true),
});

export interface GetWorkCentersParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  type?: WorkCenterType;
  isActive?: boolean;
}

export async function getWorkCenters(params: GetWorkCentersParams = {}) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const {
    page = 1,
    pageSize = 10,
    search = '',
    sortBy = 'code',
    sortOrder = 'asc',
    type,
    isActive
  } = params;

  const where: any = {};

  if (search) {
    where.OR = [
      { code: { contains: search, mode: 'insensitive' } },
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (type) {
    where.type = type;
  }

  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  const orderBy: any = {};
  if (sortBy) {
    orderBy[sortBy] = sortOrder;
  }

  const [workCenters, total] = await Promise.all([
    prisma.workCenter.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.workCenter.count({ where }),
  ]);

  return {
    data: workCenters,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function createWorkCenter(data: z.infer<typeof workCenterSchema>) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const validatedData = workCenterSchema.parse(data);

  // Check if code already exists
  const existing = await prisma.workCenter.findUnique({
    where: { code: validatedData.code },
  });

  if (existing) {
    throw new Error('Work center code already exists');
  }

  const workCenter = await prisma.workCenter.create({
    data: validatedData,
  });

  revalidatePath('/production/work-centers');
  return workCenter;
}

export async function updateWorkCenter(id: string, data: z.infer<typeof workCenterSchema>) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const validatedData = workCenterSchema.parse(data);

  // Check if work center exists
  const existing = await prisma.workCenter.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error('Work center not found');
  }

  // Check if code is being changed and if new code already exists
  if (validatedData.code !== existing.code) {
    const codeExists = await prisma.workCenter.findUnique({
      where: { code: validatedData.code },
    });

    if (codeExists) {
      throw new Error('Work center code already exists');
    }
  }

  const workCenter = await prisma.workCenter.update({
    where: { id },
    data: validatedData,
  });

  revalidatePath('/production/work-centers');
  return workCenter;
}

export async function deleteWorkCenter(id: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  // Check if work center exists
  const existing = await prisma.workCenter.findUnique({
    where: { id },
    include: {
      operations: true,
      routingSteps: true,
    },
  });

  if (!existing) {
    throw new Error('Work center not found');
  }

  // Check if work center is in use
  if (existing.operations.length > 0 || existing.routingSteps.length > 0) {
    throw new Error('Cannot delete work center that is in use');
  }

  await prisma.workCenter.delete({
    where: { id },
  });

  revalidatePath('/production/work-centers');
  return { success: true };
}