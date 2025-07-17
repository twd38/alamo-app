'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { requirePermission, PERMISSIONS, hasPermission } from '@/lib/rbac';
import { auth } from '@/lib/auth';

/**
 * Update an existing role
 */
export async function updateRole(
  roleId: string,
  roleData: {
    name: string;
    description?: string | null;
  }
) {
  try {
    await requirePermission(PERMISSIONS.SYSTEM.ROLE_MANAGEMENT);

    // Update the role
    const role = await prisma.role.update({
      where: { id: roleId },
      data: {
        name: roleData.name,
        description: roleData.description
      }
    });

    revalidatePath('/admin');
    return { success: true, data: role };
  } catch (error) {
    console.error('Error updating role:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update role'
    };
  }
}
