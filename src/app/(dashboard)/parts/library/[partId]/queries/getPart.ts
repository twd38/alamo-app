'use server';

import { prisma } from '@/lib/db';

export async function getPart(partId: string) {
  return await prisma.part.findUnique({
    where: {
      id: partId
    },
    include: {
      partImage: true,
      files: true,
      basePartTo: true,
      bomParts: {
        include: {
          part: true
        }
      },
      cadFile: true,
      gltfFile: true
    }
  });
}
