'use server';

import { prisma } from '@/lib/db';

export async function getWorkOrderTags() {
  return await prisma.workOrderTag.findMany({
    orderBy: {
      name: 'asc'
    }
  });
}
