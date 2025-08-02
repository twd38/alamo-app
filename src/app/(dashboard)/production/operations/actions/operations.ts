'use server';

import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const operationSchema = z.object({
  code: z.string().min(1, 'Code is required').max(20, 'Code must be less than 20 characters'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().nullable(),
  workCenterId: z.string().min(1, 'Work center is required'),
  defaultDuration: z.coerce.number().min(1, 'Duration must be at least 1 minute'),
  setupTime: z.coerce.number().min(0, 'Setup time must be positive'),
  requiresSkill: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export interface GetOperationsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  workCenterId?: string;
  isActive?: boolean;
}

export async function getOperations(params: GetOperationsParams = {}) {
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
    workCenterId,
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

  if (workCenterId) {
    where.workCenterId = workCenterId;
  }

  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  const orderBy: any = {};
  if (sortBy) {
    orderBy[sortBy] = sortOrder;
  }

  const [operations, total] = await Promise.all([
    prisma.operation.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        workCenter: true,
      },
    }),
    prisma.operation.count({ where }),
  ]);

  return {
    data: operations,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function createOperation(data: z.infer<typeof operationSchema>) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const validatedData = operationSchema.parse(data);

  // Check if code already exists
  const existing = await prisma.operation.findUnique({
    where: { code: validatedData.code },
  });

  if (existing) {
    throw new Error('Operation code already exists');
  }

  const operation = await prisma.operation.create({
    data: validatedData,
    include: {
      workCenter: true,
    },
  });

  revalidatePath('/production/operations');
  return operation;
}

export async function updateOperation(id: string, data: z.infer<typeof operationSchema>) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const validatedData = operationSchema.parse(data);

  // Check if operation exists
  const existing = await prisma.operation.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error('Operation not found');
  }

  // Check if code is being changed and if new code already exists
  if (validatedData.code !== existing.code) {
    const codeExists = await prisma.operation.findUnique({
      where: { code: validatedData.code },
    });

    if (codeExists) {
      throw new Error('Operation code already exists');
    }
  }

  const operation = await prisma.operation.update({
    where: { id },
    data: validatedData,
    include: {
      workCenter: true,
    },
  });

  revalidatePath('/production/operations');
  return operation;
}

export async function deleteOperation(id: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  // Check if operation exists
  const existing = await prisma.operation.findUnique({
    where: { id },
    include: {
      procedures: true,
      routingSteps: true,
    },
  });

  if (!existing) {
    throw new Error('Operation not found');
  }

  // Check if operation is in use
  if (existing.procedures.length > 0 || existing.routingSteps.length > 0) {
    throw new Error('Cannot delete operation that is in use');
  }

  await prisma.operation.delete({
    where: { id },
  });

  revalidatePath('/production/operations');
  return { success: true };
}

// Get all work centers for dropdown
export async function getWorkCentersForSelect() {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const workCenters = await prisma.workCenter.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      code: true,
      name: true,
    },
  });

  return workCenters;
}