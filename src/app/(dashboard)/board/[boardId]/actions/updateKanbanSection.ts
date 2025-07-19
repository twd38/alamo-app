'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function updateKanbanSection(id: string, data: { name: string }) {
  try {
    const result = await prisma.kanbanSection.update({
      where: { id },
      data: { name: data.name }
    });

    revalidatePath('/production');
    return { success: true, data: result };
  } catch (error) {
    console.error('Error updating kanban section:', error);
    return { success: false, error: 'Failed to update kanban section' };
  }
}
