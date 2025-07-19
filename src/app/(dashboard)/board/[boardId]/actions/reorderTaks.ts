'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function reorderTasks(workstationId: string, taskIds: string[]) {
  try {
    console.log(`Reordering tasks in workstation ${workstationId}:`, taskIds);

    // Update each task's order
    const updates = await Promise.all(
      taskIds.map((taskId, index) => {
        console.log(`Setting task ${taskId} to order ${index}`);
        return prisma.task.update({
          where: { id: taskId },
          data: { taskOrder: index }
        });
      })
    );

    console.log('Tasks reordered successfully:', updates);
    revalidatePath('/production');
    return { success: true };
  } catch (error) {
    console.error('Error reordering tasks:', error);
    return { success: false, error: 'Failed to reorder tasks' };
  }
}
