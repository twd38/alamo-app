'use server';

import { prisma } from '@/lib/db';
import { Color } from '@prisma/client';

export async function createTaskTag({
  name,
  color,
  boardId
}: {
  name: string;
  color: Color;
  boardId: string;
}) {
  const result = await prisma.taskTag.create({
    data: {
      name,
      color,
      boardId
    }
  });
  return { success: true, data: result };
}
