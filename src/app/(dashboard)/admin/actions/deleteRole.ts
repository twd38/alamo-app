'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { requirePermission, PERMISSIONS, hasPermission } from '@/lib/rbac';
import { auth } from '@/lib/auth';

/**
 * Delete a role
 */
export async function deleteRole(roleId: string) {
  try {
    await requirePermission(PERMISSIONS.SYSTEM.ROLE_MANAGEMENT);

    // Check if role is assigned to any users
    const userRoles = await prisma.userRole.findMany({
      where: { roleId }
    });

    if (userRoles.length > 0) {
      return {
        success: false,
        error:
          'Cannot delete role that is assigned to users. Remove all user assignments first.'
      };
    }

    // Delete the role
    await prisma.role.delete({
      where: { id: roleId }
    });

    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('Error deleting role:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete role'
    };
  }
}
