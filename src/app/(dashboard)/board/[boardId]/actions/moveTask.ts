'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function moveTask(
  taskId: string,
  targetWorkStationId: string,
  newOrder: number
) {
  try {
    console.log(
      `Moving task ${taskId} to workstation ${targetWorkStationId} with order ${newOrder}`
    );

    await prisma.$transaction(async (tx) => {
      // Get all tasks in the target workstation
      const targetTasks = await tx.task.findMany({
        where: {
          kanbanSectionId: targetWorkStationId,
          deletedOn: null,
          id: { not: taskId }
        },
        orderBy: {
          taskOrder: 'asc'
        }
      });

      // Insert the tasks at their new positions
      const updatedTasks = [
        ...targetTasks.slice(0, newOrder),
        { id: taskId },
        ...targetTasks.slice(newOrder)
      ];

      // Update all tasks with their new order
      await Promise.all(
        updatedTasks.map((task, index) =>
          tx.task.update({
            where: { id: task.id },
            data: {
              kanbanSectionId: targetWorkStationId,
              taskOrder: index
            }
          })
        )
      );
    });

    console.log('Task moved successfully');
    revalidatePath('/production');
    return { success: true };
  } catch (error) {
    console.error('Error moving task:', error);
    return { success: false, error: 'Failed to move task' };
  }
}
