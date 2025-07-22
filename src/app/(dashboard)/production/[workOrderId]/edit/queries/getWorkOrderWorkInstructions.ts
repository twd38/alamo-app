'use server';

import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function getWorkOrderWorkInstructions(
  workOrderWorkInstructionId: string
) {
  try {
    const result = await prisma.workOrderWorkInstruction.findUnique({
      where: {
        id: workOrderWorkInstructionId
      },
      include: {
        workOrder: true,
        steps: {
          include: {
            actions: {
              include: {
                uploadedFile: true,
                executionFile: true
              }
            },
            files: true
          }
        }
      }
    });
    return result;
  } catch (error) {
    console.error('Error fetching work order work instructions:', error);
    throw error;
  }
}

export type WorkOrderWorkInstructions = Prisma.PromiseReturnType<
  typeof getWorkOrderWorkInstructions
>;
