'use server';

import { prisma } from '@/lib/db';
import { Task } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export async function updateKanbanSectionTasks({
  id,
  tasks
}: {
  id: string;
  tasks: Task[];
}) {
  try {
    const result = await prisma.kanbanSection.update({
      where: { id },
      data: { tasks: { connect: tasks.map((task) => ({ id: task.id })) } }
    });

    revalidatePath('/production');
    return { success: true, data: result };
  } catch (error) {
    console.error('Error updating workstation:', error);
    return { success: false, error: 'Failed to update workstation' };
  }
}
