'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function getKanbanSections(boardId: string) {
  const session = await auth();
  const userId = session?.user?.id;

  // If boardId = 'my-tasks', return all kanban sections for the user
  if (boardId === 'my-tasks') {
    return await prisma.kanbanSection.findMany({
      where: {
        deletedOn: null,
        tasks: {
          some: {
            assignees: {
              some: {
                id: userId
              }
            }
          }
        }
      },
      include: {
        tasks: {
          where: {
            deletedOn: null,
            private: false,
            assignees: {
              some: {
                id: userId
              }
            }
          },
          orderBy: {
            taskOrder: 'asc'
          },
          include: {
            assignees: true,
            createdBy: true,
            files: true,
            tags: true
          }
        }
      },
      orderBy: {
        kanbanOrder: 'asc'
      }
    });
  }

  return await prisma.kanbanSection.findMany({
    where: {
      deletedOn: null,
      boardId: boardId
    },
    include: {
      tasks: {
        where: {
          deletedOn: null,
          OR: [
            { private: false },
            {
              private: true,
              createdById: userId
            }
          ]
        },
        orderBy: {
          taskOrder: 'asc'
        },
        include: {
          assignees: true,
          createdBy: true,
          files: true,
          tags: true
        }
      }
    },
    orderBy: {
      kanbanOrder: 'asc'
    }
  });
}
