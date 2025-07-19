'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function updateKanbanSectionKanbanOrder(
  id: string,
  kanbanOrder: number
) {
  await prisma.kanbanSection.update({
    where: { id },
    data: { kanbanOrder }
  });
  revalidatePath('/production');
}
