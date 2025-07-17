'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function getAllTasks() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return [];

  return await prisma.task.findMany({
    where: {
      deletedOn: null,
      assignees: {
        some: {
          id: userId
        }
      }
    },
    include: {
      assignees: true,
      createdBy: true,
      files: true,
      tags: true
    }
  });
}
