'use server';

import { prisma } from '@/lib/db';

export async function getParts({
  query,
  page,
  limit,
  sortBy,
  sortOrder
}: {
  query: string;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: string;
}) {
  return await prisma.part.findMany({
    where: {
      OR: [
        {
          name: {
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
    },
    include: {
      partImage: true
    },
    orderBy: {
      [sortBy]: sortOrder
    },
    skip: (page - 1) * limit
    // take: limit
  });
}
