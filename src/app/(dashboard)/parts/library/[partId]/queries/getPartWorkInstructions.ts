'use server';

import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function getPartWorkInstructions(partId: string) {
  try {
    const part = await prisma.part.findUnique({
      where: {
        id: partId
      },
      include: {
        workInstructions: true
      }
    });

    const result = await prisma.workInstruction.findUnique({
      where: {
        id: part?.workInstructions[0].id
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
