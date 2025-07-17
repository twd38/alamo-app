'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function getBoards() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return [];

  // Use prisma's standard API
  return await prisma.board.findMany({
    where: {
      OR: [
        { private: false },
        { createdById: userId },
        {
          // Find boards where user is a collaborator
          collaborators: {
            some: { id: userId }
          }
        }
      ]
    },
    include: {
      createdBy: true,
      collaborators: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
}
