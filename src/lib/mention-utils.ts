'use server';

import { prisma } from './db';
import { auth } from './auth';

export interface MentionUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}

/**
 * Get users for mention suggestions (server action)
 * @param query - Optional search query to filter users
 * @param limit - Maximum number of users to return (default: 10)
 * @returns Object with success flag and array of users that can be mentioned
 */
export async function getUsersForMention(
  query?: string,
  limit: number = 10
): Promise<{ success: boolean; data: MentionUser[]; error?: string }> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, data: [], error: 'Not authenticated' };
    }

    const whereClause = query
      ? {
          OR: [
            { name: { contains: query, mode: 'insensitive' as const } },
            { email: { contains: query, mode: 'insensitive' as const } }
          ]
        }
      : {};

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        image: true
      },
      take: limit,
      orderBy: {
        name: 'asc'
      }
    });

    return { success: true, data: users };
  } catch (error) {
    console.error('Error fetching users for mention:', error);
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Failed to fetch users'
    };
  }
}

/**
 * Get a specific user by ID for mention display (server action)
 * @param userId - The user ID
 * @returns Object with success flag and user data or null if not found
 */
export async function getUserForMention(
  userId: string
): Promise<{ success: boolean; data: MentionUser | null; error?: string }> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, data: null, error: 'Not authenticated' };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true
      }
    });

    return { success: true, data: user };
  } catch (error) {
    console.error('Error fetching user for mention:', error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch user'
    };
  }
}
