'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { requirePermission, PERMISSIONS, hasPermission } from '@/lib/rbac';
import { auth } from '@/lib/auth';

/**
 * Create a new role
 */
export async function createRole(roleData: {
  name: string;
  description?: string | null;
}) {
  try {
    await requirePermission(PERMISSIONS.SYSTEM.ROLE_MANAGEMENT);

    // Check if role with this name already exists
    const existingRole = await prisma.role.findUnique({
      where: { name: roleData.name }
    });

    if (existingRole) {
      return { success: false, error: 'A role with this name already exists' };
    }

    // Create the role
    const role = await prisma.role.create({
      data: {
        name: roleData.name,
        description: roleData.description
      }
    });

    revalidatePath('/admin');
    return { success: true, data: role };
  } catch (error) {
    console.error('Error creating role:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create role'
    };
  }
}
