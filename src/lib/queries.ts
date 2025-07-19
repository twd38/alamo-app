'use server';
import { prisma } from './db';
import { auth } from './auth';
import { Prisma } from '@prisma/client';
import { createHash } from 'crypto';

export async function getUser() {
  const session = await auth();
  return await prisma.user.findUnique({
    where: {
      id: session?.user?.id
    }
  });
}

export async function getAllUsers() {
  return await prisma.user.findMany();
}

export async function getAccessBadge(badgeId: string) {
  return await prisma.accessBadge.findUnique({
    where: {
      id: badgeId
    },
    include: {
      user: true
    }
  });
}

export async function getUserAccessBadge(userId: string) {
  return await prisma.accessBadge.findUnique({
    where: {
      userId
    }
  });
}

export async function getAllAccessBadges() {
  return await prisma.accessBadge.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true
        }
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
}

export async function getUsersWithoutBadges() {
  return await prisma.user.findMany({
    where: {
      accessBadge: null
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true
    },
    orderBy: {
      name: 'asc'
    }
  });
}

export type AccessBadgeWithUser = Prisma.PromiseReturnType<
  typeof getAccessBadge
>;
export type AccessBadgeWithRelations = Prisma.PromiseReturnType<
  typeof getAllAccessBadges
>[0];
export type UserWithoutBadge = Prisma.PromiseReturnType<
  typeof getUsersWithoutBadges
>[0];

/**
 * Get comments for a specific entity (query version for client components)
 */
export async function getEntityComments(entityType: string, entityId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return [];
  }

  return await prisma.comment.findMany({
    where: {
      entityType: entityType as any,
      entityId,
      parentId: null,
      deletedAt: null
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true
        }
      },
      files: true,
      replies: {
        where: {
          deletedAt: null
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          },
          files: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
}

/**
 * Get comment count for an entity
 */
export async function getEntityCommentCount(
  entityType: string,
  entityId: string
) {
  try {
    return await prisma.comment.count({
      where: {
        entityType: entityType as any,
        entityId,
        deletedAt: null
      }
    });
  } catch (error) {
    console.error('Error counting comments:', error);
    return 0;
  }
}
