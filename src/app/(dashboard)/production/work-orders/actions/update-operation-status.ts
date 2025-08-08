'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { OperationStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { OperationReadinessService } from '@/lib/services/operation-readiness';

export async function updateOperationStatus(
  operationId: string,
  status: OperationStatus
) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  try {
    // Update the operation status
    const operation = await prisma.workOrderOperation.update({
      where: { id: operationId },
      data: {
        status,
        startedAt: status === OperationStatus.SETUP ? new Date() : undefined,
        completedAt: status === OperationStatus.COMPLETED ? new Date() : undefined,
        assignedUserId: session.user.id
      },
      include: {
        workOrderRouting: {
          include: {
            workOrder: true
          }
        }
      }
    });

    // Trigger readiness recalculation for dependent operations
    await OperationReadinessService.onOperationStatusChange(operationId);

    // Revalidate relevant paths
    revalidatePath('/production/work-centers');
    revalidatePath('/production/schedule');
    revalidatePath(`/production/${operation.workOrderRouting?.workOrderId}`);
    
    return { success: true, data: operation };
  } catch (error) {
    console.error('Error updating operation status:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update operation status' 
    };
  }
}