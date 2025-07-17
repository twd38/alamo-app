'use server';

import { prisma } from '@/lib/db';

export async function getPartsCount({ query }: { query: string }) {
  return await prisma.part.count({
    where: {
      OR: [
        {
          description: {
            contains: query,
            mode: 'insensitive'
          }
        },
        {
          partNumber: {
            contains: query,
            mode: 'insensitive'
          }
        }
      ]
    }
  });
}
