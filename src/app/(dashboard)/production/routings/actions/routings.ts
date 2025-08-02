'use server';

import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const routingSchema = z.object({
  partId: z.string().min(1, 'Part is required'),
  routingNumber: z.string().min(1, 'Routing number is required'),
  version: z.coerce.number().min(1, 'Version must be at least 1'),
  isActive: z.boolean().default(true),
  effectiveDate: z.coerce.date(),
  expiryDate: z.coerce.date().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const routingStepSchema = z.object({
  stepNumber: z.coerce.number().min(1, 'Step number must be at least 1'),
  operationId: z.string().min(1, 'Operation is required'),
  workCenterId: z.string().min(1, 'Work center is required'),
  setupTime: z.coerce.number().min(0, 'Setup time must be positive'),
  runTime: z.coerce.number().min(0, 'Run time must be positive'),
  queueTime: z.coerce.number().min(0, 'Queue time must be positive'),
  moveTime: z.coerce.number().min(0, 'Move time must be positive'),
  notes: z.string().optional().nullable(),
});

export interface GetRoutingsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  partId?: string;
  isActive?: boolean;
}

export async function getRoutings(params: GetRoutingsParams = {}) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const {
    page = 1,
    pageSize = 10,
    search = '',
    sortBy = 'routingNumber',
    sortOrder = 'asc',
    partId,
    isActive
  } = params;

  const where: any = {};

  if (search) {
    where.OR = [
      { routingNumber: { contains: search, mode: 'insensitive' } },
      { notes: { contains: search, mode: 'insensitive' } },
      { part: { name: { contains: search, mode: 'insensitive' } } },
    ];
  }

  if (partId) {
    where.partId = partId;
  }

  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  const orderBy: any = {};
  if (sortBy) {
    orderBy[sortBy] = sortOrder;
  }

  const [routings, total] = await Promise.all([
    prisma.routing.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        part: true,
        steps: {
          include: {
            operation: true,
            workCenter: true,
          },
          orderBy: {
            stepNumber: 'asc',
          },
        },
      },
    }),
    prisma.routing.count({ where }),
  ]);

  return {
    data: routings,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function createRouting(data: z.infer<typeof routingSchema>) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const validatedData = routingSchema.parse(data);

  // Check if routing number already exists for this part and version
  const existing = await prisma.routing.findUnique({
    where: {
      partId_routingNumber_version: {
        partId: validatedData.partId,
        routingNumber: validatedData.routingNumber,
        version: validatedData.version,
      },
    },
  });

  if (existing) {
    throw new Error('Routing already exists for this part, number, and version');
  }

  const routing = await prisma.routing.create({
    data: validatedData,
    include: {
      part: true,
      steps: true,
    },
  });

  revalidatePath('/production/routings');
  return routing;
}

export async function updateRouting(id: string, data: z.infer<typeof routingSchema>) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const validatedData = routingSchema.parse(data);

  // Check if routing exists
  const existing = await prisma.routing.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error('Routing not found');
  }

  // Check if unique constraint would be violated
  if (
    validatedData.partId !== existing.partId ||
    validatedData.routingNumber !== existing.routingNumber ||
    validatedData.version !== existing.version
  ) {
    const duplicate = await prisma.routing.findUnique({
      where: {
        partId_routingNumber_version: {
          partId: validatedData.partId,
          routingNumber: validatedData.routingNumber,
          version: validatedData.version,
        },
      },
    });

    if (duplicate) {
      throw new Error('Routing already exists for this part, number, and version');
    }
  }

  const routing = await prisma.routing.update({
    where: { id },
    data: validatedData,
    include: {
      part: true,
      steps: true,
    },
  });

  revalidatePath('/production/routings');
  return routing;
}

export async function deleteRouting(id: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  // Check if routing exists
  const existing = await prisma.routing.findUnique({
    where: { id },
    include: {
      steps: true,
    },
  });

  if (!existing) {
    throw new Error('Routing not found');
  }

  // Delete all routing steps first (due to foreign key constraints)
  await prisma.routingStep.deleteMany({
    where: { routingId: id },
  });

  await prisma.routing.delete({
    where: { id },
  });

  revalidatePath('/production/routings');
  return { success: true };
}

// Routing Steps
export async function createRoutingStep(routingId: string, data: z.infer<typeof routingStepSchema>) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const validatedData = routingStepSchema.parse(data);

  // Check if step number already exists for this routing
  const existing = await prisma.routingStep.findUnique({
    where: {
      routingId_stepNumber: {
        routingId,
        stepNumber: validatedData.stepNumber,
      },
    },
  });

  if (existing) {
    throw new Error('Step number already exists for this routing');
  }

  const routingStep = await prisma.routingStep.create({
    data: {
      ...validatedData,
      routingId,
    },
    include: {
      operation: true,
      workCenter: true,
    },
  });

  revalidatePath('/production/routings');
  return routingStep;
}

export async function updateRoutingStep(id: string, data: z.infer<typeof routingStepSchema>) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const validatedData = routingStepSchema.parse(data);

  // Check if routing step exists
  const existing = await prisma.routingStep.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error('Routing step not found');
  }

  // Check if step number is being changed and if new step number already exists
  if (validatedData.stepNumber !== existing.stepNumber) {
    const duplicate = await prisma.routingStep.findUnique({
      where: {
        routingId_stepNumber: {
          routingId: existing.routingId,
          stepNumber: validatedData.stepNumber,
        },
      },
    });

    if (duplicate && duplicate.id !== id) {
      throw new Error('Step number already exists for this routing');
    }
  }

  const routingStep = await prisma.routingStep.update({
    where: { id },
    data: validatedData,
    include: {
      operation: true,
      workCenter: true,
    },
  });

  revalidatePath('/production/routings');
  return routingStep;
}

export async function deleteRoutingStep(id: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  await prisma.routingStep.delete({
    where: { id },
  });

  revalidatePath('/production/routings');
  return { success: true };
}

// Get all parts for dropdown
export async function getPartsForSelect() {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const parts = await prisma.part.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      partNumber: true,
      name: true,
    },
  });

  return parts;
}

// Clone a routing
export async function cloneRouting(routingId: string, newPartId: string, newRoutingNumber: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  // Get the original routing with all steps
  const original = await prisma.routing.findUnique({
    where: { id: routingId },
    include: {
      steps: true,
    },
  });

  if (!original) {
    throw new Error('Original routing not found');
  }

  // Create the new routing
  const newRouting = await prisma.routing.create({
    data: {
      partId: newPartId,
      routingNumber: newRoutingNumber,
      version: 1,
      isActive: true,
      effectiveDate: new Date(),
      notes: `Cloned from ${original.routingNumber} v${original.version}`,
    },
  });

  // Clone all the steps
  if (original.steps.length > 0) {
    await prisma.routingStep.createMany({
      data: original.steps.map((step) => ({
        routingId: newRouting.id,
        stepNumber: step.stepNumber,
        operationId: step.operationId,
        workCenterId: step.workCenterId,
        setupTime: step.setupTime,
        runTime: step.runTime,
        queueTime: step.queueTime,
        moveTime: step.moveTime,
        notes: step.notes,
      })),
    });
  }

  revalidatePath('/production/routings');
  
  // Return the new routing with steps
  return prisma.routing.findUnique({
    where: { id: newRouting.id },
    include: {
      part: true,
      steps: {
        include: {
          operation: true,
          workCenter: true,
        },
        orderBy: {
          stepNumber: 'asc',
        },
      },
    },
  });
}