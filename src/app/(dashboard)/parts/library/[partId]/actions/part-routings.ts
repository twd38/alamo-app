'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const assignRoutingSchema = z.object({
  partId: z.string(),
  routingId: z.string(),
  isDefault: z.boolean()
});

export async function getPartRoutings(partId: string) {
  const session = await auth();
  if (!session) {
    throw new Error('Unauthorized');
  }

  const partRoutings = await prisma.partRouting.findMany({
    where: {
      partId
    },
    include: {
      routing: {
        include: {
          steps: {
            include: {
              operation: true,
              workCenter: true
            },
            orderBy: {
              stepNumber: 'asc'
            }
          }
        }
      }
    },
    orderBy: [
      { isDefault: 'desc' },
      { createdAt: 'desc' }
    ]
  });

  return partRoutings;
}

export async function getAvailableRoutings() {
  const session = await auth();
  if (!session) {
    throw new Error('Unauthorized');
  }

  const routings = await prisma.routing.findMany({
    where: {
      isActive: true
    },
    include: {
      steps: {
        include: {
          operation: true,
          workCenter: true
        },
        orderBy: {
          stepNumber: 'asc'
        }
      }
    },
    orderBy: {
      routingNumber: 'asc'
    }
  });

  return routings;
}

export async function assignRoutingToPart(
  data: z.infer<typeof assignRoutingSchema>
) {
  const session = await auth();
  if (!session) {
    throw new Error('Unauthorized');
  }

  const validatedData = assignRoutingSchema.parse(data);

  // Check if this routing is already assigned to this part
  const existing = await prisma.partRouting.findUnique({
    where: {
      partId_routingId: {
        partId: validatedData.partId,
        routingId: validatedData.routingId
      }
    }
  });

  if (existing) {
    throw new Error('This routing is already assigned to this part');
  }

  // If setting as default, unset any existing defaults
  if (validatedData.isDefault) {
    await prisma.partRouting.updateMany({
      where: {
        partId: validatedData.partId,
        isDefault: true
      },
      data: {
        isDefault: false
      }
    });
  }

  const partRouting = await prisma.partRouting.create({
    data: {
      partId: validatedData.partId,
      routingId: validatedData.routingId,
      isDefault: validatedData.isDefault
    }
  });

  revalidatePath(`/parts/library/${validatedData.partId}`);
  return partRouting;
}

export async function removeRoutingFromPart(partRoutingId: string) {
  const session = await auth();
  if (!session) {
    throw new Error('Unauthorized');
  }

  const partRouting = await prisma.partRouting.findUnique({
    where: { id: partRoutingId },
    include: { part: true }
  });

  if (!partRouting) {
    throw new Error('Part routing not found');
  }

  await prisma.partRouting.delete({
    where: { id: partRoutingId }
  });

  revalidatePath(`/parts/library/${partRouting.partId}`);
}

export async function setDefaultRouting(partRoutingId: string) {
  const session = await auth();
  if (!session) {
    throw new Error('Unauthorized');
  }

  const partRouting = await prisma.partRouting.findUnique({
    where: { id: partRoutingId }
  });

  if (!partRouting) {
    throw new Error('Part routing not found');
  }

  // Unset any existing defaults for this part
  await prisma.partRouting.updateMany({
    where: {
      partId: partRouting.partId,
      isDefault: true
    },
    data: {
      isDefault: false
    }
  });

  // Set this one as default
  await prisma.partRouting.update({
    where: { id: partRoutingId },
    data: { isDefault: true }
  });

  revalidatePath(`/parts/library/${partRouting.partId}`);
}