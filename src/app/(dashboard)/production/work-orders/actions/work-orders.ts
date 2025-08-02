'use server';

import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { WorkOrderStatus } from '@prisma/client';

const workOrderSchema = z.object({
  partId: z.string().min(1, 'Part is required'),
  routingId: z.string().optional(), // Selected routing for this work order
  partQty: z.coerce.number().min(1, 'Quantity must be at least 1'),
  dueDate: z.coerce.date().optional().nullable(),
  operation: z.string().default('Production'),
  notes: z.string().optional().nullable(),
});

export async function createWorkOrder(data: z.infer<typeof workOrderSchema>) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const validatedData = workOrderSchema.parse(data);

  // Generate work order number
  const lastWorkOrder = await prisma.workOrder.findFirst({
    orderBy: { workOrderNumber: 'desc' },
    select: { workOrderNumber: true },
  });

  const nextNumber = lastWorkOrder 
    ? `WO-${(parseInt(lastWorkOrder.workOrderNumber.replace('WO-', '')) + 1).toString().padStart(6, '0')}`
    : 'WO-000001';

  // If routing is specified, validate it belongs to the part
  if (validatedData.routingId) {
    const partRouting = await prisma.partRouting.findUnique({
      where: {
        partId_routingId: {
          partId: validatedData.partId,
          routingId: validatedData.routingId,
        },
      },
    });

    if (!partRouting) {
      throw new Error('Selected routing is not valid for this part');
    }
  } else {
    // If no routing specified, try to get the default routing
    const defaultRouting = await prisma.partRouting.findFirst({
      where: {
        partId: validatedData.partId,
        isDefault: true,
      },
    });

    if (defaultRouting) {
      validatedData.routingId = defaultRouting.routingId;
    }
  }

  const workOrder = await prisma.workOrder.create({
    data: {
      workOrderNumber: nextNumber,
      partId: validatedData.partId,
      partQty: validatedData.partQty,
      dueDate: validatedData.dueDate,
      operation: validatedData.operation,
      status: WorkOrderStatus.TODO,
      createdById: session.user.id,
      // Store the selected routing ID in notes
      // You might want to add a routingId field to the WorkOrder model
      notes: validatedData.notes 
        ? `${validatedData.notes}\n\nRouting: ${validatedData.routingId}`
        : `Routing: ${validatedData.routingId}`,
    },
    include: {
      part: true,
    },
  });

  revalidatePath('/production/work-orders');
  return workOrder;
}

export async function updateWorkOrder(
  id: string, 
  data: z.infer<typeof workOrderSchema>
) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const validatedData = workOrderSchema.parse(data);

  // Validate routing if changed
  if (validatedData.routingId) {
    const partRouting = await prisma.partRouting.findUnique({
      where: {
        partId_routingId: {
          partId: validatedData.partId,
          routingId: validatedData.routingId,
        },
      },
    });

    if (!partRouting) {
      throw new Error('Selected routing is not valid for this part');
    }
  }

  const workOrder = await prisma.workOrder.update({
    where: { id },
    data: {
      partId: validatedData.partId,
      partQty: validatedData.partQty,
      dueDate: validatedData.dueDate,
      operation: validatedData.operation,
      notes: validatedData.notes,
    },
    include: {
      part: true,
    },
  });

  revalidatePath('/production/work-orders');
  return workOrder;
}

// Get routings for a specific part
export async function getRoutingsForPart(partId: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const partRoutings = await prisma.partRouting.findMany({
    where: { 
      partId,
      routing: {
        isActive: true,
      },
    },
    include: {
      routing: {
        include: {
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
      },
    },
    orderBy: {
      isDefault: 'desc', // Default routing first
    },
  });

  return partRoutings.map(pr => ({
    ...pr.routing,
    isDefault: pr.isDefault,
  }));
}

// Get all parts for dropdown
export async function getPartsForWorkOrder() {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const parts = await prisma.part.findMany({
    where: {
      partRoutings: {
        some: {}, // Only parts that have at least one routing
      },
    },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      partNumber: true,
      name: true,
      description: true,
      _count: {
        select: {
          partRoutings: true,
        },
      },
    },
  });

  return parts;
}