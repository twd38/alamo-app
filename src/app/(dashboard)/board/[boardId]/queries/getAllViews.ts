'use server';

import { prisma } from '@/lib/db';

export async function getAllViews(boardId?: string) {
  return await prisma.boardView.findMany({
    where: {
      boardId: boardId
    },
    include: {
      createdBy: true
    },
    orderBy: {
      createdAt: 'asc'
    }
  });
}
