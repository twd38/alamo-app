'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { Prisma } from '@prisma/client';

export async function createTask(data: {
  name: string;
  taskNumber: string;
  status: string;
  priority: number;
  dueDate: Date;
  description: string;
  createdById: string;
  assignees: string[];
  kanbanSectionId: string;
  boardId: string;
  taskOrder: number;
  files?: Prisma.FileCreateInput[];
  tags?: string[];
  private?: boolean;
  epicId?: string;
}) {
  try {
    const session = await auth();
    const userId = session?.user?.id || 'cm78gevrb0004kxxg43qs0mqv';

    const result = await prisma.$transaction(async (tx) => {
      // Move all existing tasks in the same Kanban section down by one position
      await tx.task.updateMany({
        where: {
          kanbanSectionId: data.kanbanSectionId,
          deletedOn: null
        },
        data: {
          taskOrder: {
            increment: 1
          }
        }
      });

      // Insert the new task at the beginning (taskOrder = 0)
      const newTask = await tx.task.create({
        data: {
          name: data.name,
          taskNumber: data.taskNumber,
          priority: data.priority,
          dueDate: data.dueDate,
          description: data.description,
          createdById: userId,
          assignees: {
            connect: data.assignees.map((assigneeId) => ({ id: assigneeId }))
          },
          kanbanSectionId: data.kanbanSectionId,
          boardId: data.boardId,
          taskOrder: 0,
          files: {
            create: data.files || []
          },
          tags: {
            connect: data.tags?.map((tag) => ({ id: tag })) || []
          },
          private: data.private ?? false,
          epicId: data.epicId
        },
        include: {
          assignees: true,
          files: true
        }
      });

      return newTask;
    });

    // Revalidate the board and production pages so UI reflects the new task order immediately
    revalidatePath(`/board/${data.boardId}`);
    revalidatePath('/production');

    return { success: true, data: result };
  } catch (error) {
    console.error('Error creating task:', error);
    return { success: false, error: 'Failed to create task' };
  }
}
