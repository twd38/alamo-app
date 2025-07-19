'use server';

import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

type NewFileInput = Omit<Prisma.FileCreateInput, 'id'>;

/**
 * Add new files to a part (preserves existing files)
 */
export async function addFilesToPart(partId: string, files: NewFileInput[]) {
  try {
    await prisma.part.update({
      where: { id: partId },
      data: {
        files: {
          create: files.map((file) => ({
            url: file.url,
            key: file.key,
            name: file.name,
            type: file.type,
            size: file.size
          }))
        }
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error adding files to part:', error);
    return { success: false, error: 'Failed to add files to part' };
  }
}
