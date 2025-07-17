'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { requirePermission, PERMISSIONS, hasPermission } from '@/lib/rbac';
import { auth } from '@/lib/auth';

/**
 * Deletes a user (only for admins)
 */
export async function deleteUser(userId: string) {
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

    // Prevent deleting yourself
    if (session.user.id === userId) {
      return { success: false, error: 'Cannot delete your own account' };
    }

    // Delete the user
    await prisma.user.delete({
      where: { id: userId }
    });

    return { success: true };
  } catch (error) {
    console.error('Delete user error:', error);
    return { success: false, error: 'Failed to delete user' };
  }
}
