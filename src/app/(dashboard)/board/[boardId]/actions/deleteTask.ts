'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function deleteTask(taskId: string) {
  try {
    const result = await prisma.task.update({
      where: { id: taskId },
      data: {
        deletedOn: new Date(),
        kanbanSectionId: null
      },
      include: {
        board: true
      }
    });

    // Revalidate both the board and production pages
    revalidatePath(`/board/${result.boardId}`);
    revalidatePath('/production');
    return { success: true, data: result };
  } catch (error) {
    console.error('Error deleting task:', error);
    return { success: false, error: 'Failed to delete task' };
  }
}
