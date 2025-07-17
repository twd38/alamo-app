'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { requirePermission, PERMISSIONS } from '@/lib/rbac';

export async function createUser(userData: {
  name: string;
  email: string;
  image?: string | null;
}) {
  try {
    await requirePermission(PERMISSIONS.SYSTEM.USER_MANAGEMENT);

    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    });

    if (existingUser) {
      return { success: false, error: 'A user with this email already exists' };
    }

    // Create the user
    const user = await prisma.user.create({
      data: {
        name: userData.name,
        email: userData.email,
        image: userData.image
      }
    });

    revalidatePath('/admin');
    return { success: true, data: user };
  } catch (error) {
    console.error('Error creating user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create user'
    };
  }
}
