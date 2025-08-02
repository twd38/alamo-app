'use server';

import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const procedureSchema = z.object({
  operationId: z.string().min(1, 'Operation is required'),
  stepNumber: z.coerce.number().min(1, 'Step number must be at least 1'),
  title: z.string().min(1, 'Title is required'),
  instructions: z.string().min(1, 'Instructions are required'),
  estimatedTime: z.coerce.number().min(1, 'Estimated time must be at least 1 minute'),
  requiredTools: z.array(z.string()).default([]),
  safetyNotes: z.string().optional().nullable(),
  qualityChecks: z.array(z.string()).default([]),
  imageUrls: z.array(z.string()).default([]),
  videoUrl: z.string().optional().nullable(),
});

export interface GetProceduresParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  operationId?: string;
}

export async function getProcedures(params: GetProceduresParams = {}) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const {
    page = 1,
    pageSize = 10,
    search = '',
    sortBy = 'stepNumber',
    sortOrder = 'asc',
    operationId
  } = params;

  const where: any = {};

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { instructions: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (operationId) {
    where.operationId = operationId;
  }

  const orderBy: any = {};
  if (sortBy) {
    orderBy[sortBy] = sortOrder;
  }

  const [procedures, total] = await Promise.all([
    prisma.procedure.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        operation: {
          include: {
            workCenter: true,
          },
        },
      },
    }),
    prisma.procedure.count({ where }),
  ]);

  return {
    data: procedures,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function createProcedure(data: z.infer<typeof procedureSchema>) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const validatedData = procedureSchema.parse(data);

  // Check if operation exists
  const operation = await prisma.operation.findUnique({
    where: { id: validatedData.operationId },
  });

  if (!operation) {
    throw new Error('Operation not found');
  }

  // Check if step number already exists for this operation
  const existing = await prisma.procedure.findUnique({
    where: {
      operationId_stepNumber: {
        operationId: validatedData.operationId,
        stepNumber: validatedData.stepNumber,
      },
    },
  });

  if (existing) {
    throw new Error('Step number already exists for this operation');
  }

  const procedure = await prisma.procedure.create({
    data: validatedData,
    include: {
      operation: {
        include: {
          workCenter: true,
        },
      },
    },
  });

  revalidatePath('/production/procedures');
  return procedure;
}

export async function updateProcedure(id: string, data: z.infer<typeof procedureSchema>) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const validatedData = procedureSchema.parse(data);

  // Check if procedure exists
  const existing = await prisma.procedure.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error('Procedure not found');
  }

  // Check if step number is being changed and if new step number already exists
  if (validatedData.operationId !== existing.operationId || validatedData.stepNumber !== existing.stepNumber) {
    const stepExists = await prisma.procedure.findUnique({
      where: {
        operationId_stepNumber: {
          operationId: validatedData.operationId,
          stepNumber: validatedData.stepNumber,
        },
      },
    });

    if (stepExists && stepExists.id !== id) {
      throw new Error('Step number already exists for this operation');
    }
  }

  const procedure = await prisma.procedure.update({
    where: { id },
    data: validatedData,
    include: {
      operation: {
        include: {
          workCenter: true,
        },
      },
    },
  });

  revalidatePath('/production/procedures');
  return procedure;
}

export async function deleteProcedure(id: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  // Check if procedure exists
  const existing = await prisma.procedure.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error('Procedure not found');
  }

  await prisma.procedure.delete({
    where: { id },
  });

  revalidatePath('/production/procedures');
  return { success: true };
}

// Get all operations for dropdown
export async function getOperationsForSelect() {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const operations = await prisma.operation.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      code: true,
      name: true,
      workCenter: {
        select: {
          name: true,
        },
      },
    },
  });

  return operations;
}