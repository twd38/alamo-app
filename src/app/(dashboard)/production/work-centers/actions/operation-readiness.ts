'use server';

import { auth } from '@/lib/auth';
import { OperationReadinessService } from '@/lib/services/operation-readiness';
import { revalidatePath } from 'next/cache';

export async function calculateOperationReadiness(operationId: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  try {
    const readiness = await OperationReadinessService.calculateReadiness(operationId);
    
    revalidatePath('/production/work-centers');
    revalidatePath('/production/schedule');
    
    return { success: true, data: readiness };
  } catch (error) {
    console.error('Error calculating operation readiness:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to calculate readiness' 
    };
  }
}

export async function calculateWorkOrderReadiness(workOrderId: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  try {
    const readinessMap = await OperationReadinessService.calculateWorkOrderReadiness(workOrderId);
    
    // Convert Map to plain object for serialization
    const readinessData: Record<string, any> = {};
    readinessMap.forEach((value, key) => {
      readinessData[key] = value;
    });
    
    revalidatePath('/production/work-centers');
    revalidatePath('/production/schedule');
    revalidatePath(`/production/${workOrderId}`);
    
    return { success: true, data: readinessData };
  } catch (error) {
    console.error('Error calculating work order readiness:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to calculate work order readiness' 
    };
  }
}

export async function getReadyOperationsForWorkCenter(workCenterId: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  try {
    const operations = await OperationReadinessService.getReadyOperations(workCenterId);
    
    return { success: true, data: operations };
  } catch (error) {
    console.error('Error getting ready operations:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get ready operations' 
    };
  }
}

export async function updateWorkCenterQueue(workCenterId: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  try {
    await OperationReadinessService.updateWorkCenterQueue(workCenterId);
    
    revalidatePath('/production/work-centers');
    revalidatePath(`/production/work-centers/${workCenterId}`);
    
    return { success: true };
  } catch (error) {
    console.error('Error updating work center queue:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update work center queue' 
    };
  }
}

export async function onOperationStatusChange(operationId: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  try {
    await OperationReadinessService.onOperationStatusChange(operationId);
    
    revalidatePath('/production/work-centers');
    revalidatePath('/production/schedule');
    revalidatePath('/production/work-orders');
    
    return { success: true };
  } catch (error) {
    console.error('Error handling operation status change:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to handle status change' 
    };
  }
}