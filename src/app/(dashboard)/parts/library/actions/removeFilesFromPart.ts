'use server';

import { prisma } from '@/lib/db';

/**
 * Remove files from a part
 */
export async function removeFilesFromPart(partId: string, fileIds: string[]) {
  try {
    await prisma.part.update({
      where: { id: partId },
      data: {
        files: {
          deleteMany: {
            id: { in: fileIds }
          }
        }
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error removing files from part:', error);
    return { success: false, error: 'Failed to remove files from part' };
  }
}
