'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { requirePermission, PERMISSIONS } from '@/lib/rbac';

/**
 * Update an existing user
 */
export async function updateUser(
  userId: string,
  userData: {
    name: string;
    image?: string | null;
  }
) {
  try {
    await requirePermission(PERMISSIONS.SYSTEM.USER_MANAGEMENT);

    // Update the user
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name: userData.name,
        image: userData.image
      }
    });

    revalidatePath('/admin');
    return { success: true, data: user };
  } catch (error) {
    console.error('Error updating user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update user'
    };
  }
}
