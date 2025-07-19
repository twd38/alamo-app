'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function createKanbanSection(name: string, boardId: string) {
  const result = await prisma.kanbanSection.create({
    data: {
      name,
      kanbanOrder: 0,
      boardId
    }
  });
  revalidatePath('/production');
  return { success: true, data: result };
}
