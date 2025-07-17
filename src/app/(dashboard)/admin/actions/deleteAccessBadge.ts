'use server';

import { prisma } from '@/lib/db';
import { PERMISSIONS, hasPermission } from '@/lib/rbac';
import { auth } from '@/lib/auth';

/**
 * Deletes an access badge
 */
export async function deleteAccessBadge(badgeId: string) {
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

    // Delete the badge
    await prisma.accessBadge.delete({
      where: { id: badgeId }
    });

    return { success: true };
  } catch (error) {
    console.error('Delete access badge error:', error);
    return { success: false, error: 'Failed to delete access badge' };
  }
}
