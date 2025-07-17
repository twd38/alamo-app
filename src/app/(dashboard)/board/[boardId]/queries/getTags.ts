'use server';

import { prisma } from '@/lib/db';

export async function getTags(boardId?: string) {
  return await prisma.taskTag.findMany({
    where: {
      boardId: boardId
    },
    select: {
      id: true,
      name: true,
      color: true
    }
  });
}
