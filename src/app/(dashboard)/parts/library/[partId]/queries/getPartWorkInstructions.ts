'use server';

import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function getPartWorkInstructions(partId: string) {
  try {
    const result = await prisma.workInstruction.findMany({
      where: {
        part: {
          id: partId
        }
      },
      include: {
        steps: {
          include: {
            actions: {
              include: {
                uploadedFile: true
              }
            },
            images: true,
            files: true
          },
          orderBy: {
            stepNumber: 'asc'
          }
        }
      }
    });
    return result;
  } catch (error) {
    console.error('Error fetching work instructions:', error);
    throw error;
  }
}

export type PartWorkInstructions = Prisma.PromiseReturnType<
  typeof getPartWorkInstructions
>;
