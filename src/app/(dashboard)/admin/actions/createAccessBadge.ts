'use server';

import { prisma } from '@/lib/db';
import { PERMISSIONS, hasPermission } from '@/lib/rbac';
import { auth } from '@/lib/auth';

/**
 * Creates a new access badge for a user
 */
export async function createAccessBadge(userId: string) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    // Check if user has admin permission
    const hasAdminPermission = await hasPermission(
      session.user.id,
      PERMISSIONS.SYSTEM.ADMIN
    );
    if (!hasAdminPermission) {
      return { success: false, error: 'Insufficient permissions' };
    }

    // Check if user already has a badge
    const existingBadge = await prisma.accessBadge.findUnique({
      where: { userId }
    });

    if (existingBadge) {
      return { success: false, error: 'User already has an access badge' };
    }

    // Create the badge
    const badge = await prisma.accessBadge.create({
      data: {
        userId,
        createdById: session.user.id
      },
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
      }
    });

    return { success: true, data: badge };
  } catch (error) {
    console.error('Create access badge error:', error);
    return { success: false, error: 'Failed to create access badge' };
  }
}
