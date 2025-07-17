'use server';

import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function getWorkOrderWorkInstructions(workOrderId: string) {
  try {
    const result = await prisma.workOrderWorkInstruction.findMany({
      where: {
        workOrderId: workOrderId
      },
      include: {
        steps: {
          include: {
            actions: {
              include: {
                uploadedFile: true,
                executionFile: true
              }
            }
          },
          orderBy: {
            stepNumber: 'asc'
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
