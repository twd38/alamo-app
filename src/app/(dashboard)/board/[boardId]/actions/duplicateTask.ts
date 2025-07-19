'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function duplicateTask(taskId: string) {
  try {
    // Get the original task with its relationships
    const originalTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignees: true,
        files: true
      }
    });

    if (!originalTask) {
      throw new Error('Task not found');
    }

    // Create a new task with the same data
    const duplicatedTask = await prisma.task.create({
      data: {
        name: `${originalTask.name} (Copy)`,
        taskNumber: `${originalTask.taskNumber}`,
        priority: originalTask.priority,
        dueDate: originalTask.dueDate,
        description: originalTask.description,
        createdById: originalTask.createdById,
        kanbanSectionId: originalTask.kanbanSectionId,
        boardId: originalTask.boardId,
        taskOrder: originalTask.taskOrder + 1,
        epicId: originalTask.epicId,
        assignees: {
          connect: originalTask.assignees.map((assignee) => ({
            id: assignee.id
          }))
        },
        files: {
          create: originalTask.files.map((file) => ({
            url: file.url,
            name: file.name,
            type: file.type,
            size: file.size,
            taskId: taskId
          }))
        }
      },
      include: {
        assignees: true,
        files: true
      }
    });

    // Revalidate both the board and production pages
    revalidatePath(`/board/${originalTask.boardId}`);
    revalidatePath('/production');
    return { success: true, data: duplicatedTask };
  } catch (error) {
    console.error('Error duplicating task:', error);
    return { success: false, error: 'Failed to duplicate task' };
  }
}
