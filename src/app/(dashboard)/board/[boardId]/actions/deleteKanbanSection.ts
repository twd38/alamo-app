'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function deleteKanbanSection(id: string) {
  await prisma.kanbanSection.update({
    where: { id },
    data: { deletedOn: new Date() }
  });
  revalidatePath('/production');
}
