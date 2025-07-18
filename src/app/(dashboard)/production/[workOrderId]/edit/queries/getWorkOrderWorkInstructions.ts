'use server';

import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function getWorkOrderWorkInstructions(workOrderId: string) {
  try {
    const result = await prisma.workOrderWorkInstruction.findMany({
      where: {
        workOrderId: workOrderId
      },
      select: {
        id: true,
        steps: {
          select: {
            id: true,
            stepNumber: true,
            title: true,
            instructions: true,
            estimatedLabourTime: true,
            actions: {
              select: {
                id: true,
                actionType: true,
                description: true,
                uploadedFile: {
                  select: {
                    id: true,
                    name: true,
                    url: true
                  }
                },
                executionFile: {
                  select: {
                    id: true,
                    name: true,
                    url: true
                  }
                }
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
