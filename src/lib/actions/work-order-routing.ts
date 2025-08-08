'use server';

import { prisma } from '@/lib/db';
import { WorkOrderStatus, OperationStatus, Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';

/**
 * Create a work order with routing and operations
 */
export async function createWorkOrderWithRouting({
  partId,
  partQty,
  routingId,
  status = WorkOrderStatus.DRAFT,
  dueDate,
  assigneeIds = [],
  notes = '',
  tagIds = [],
  operationAssignments = {} // Map of operation sequence number to user ID
}: {
  partId: string;
  partQty: number;
  routingId?: string;
  status?: WorkOrderStatus;
  dueDate?: Date;
  assigneeIds?: string[];
  notes?: string;
  tagIds?: string[];
  operationAssignments?: Record<number, string>;
}) {
  try {
    // Import RBAC functions
    let userId: string;
    try {
      const { requirePermission, PERMISSIONS } = await import('@/lib/rbac');
      userId = await requirePermission(PERMISSIONS.WORK_ORDERS.CREATE);
    } catch (rbacError) {
      console.error('RBAC authorization failed:', rbacError);
      return {
        success: false,
        error: 'You do not have permission to create work orders'
      };
    }

    // Generate work order number
    const generateWorkOrderNumber = async (): Promise<string> => {
      const lastWO = await prisma.workOrder.findFirst({
        orderBy: { workOrderNumber: 'desc' },
        select: { workOrderNumber: true }
      });
      const lastSeq = lastWO?.workOrderNumber?.replace(/[^0-9]/g, '') || '0';
      const nextSeq = String(Number(lastSeq) + 1).padStart(6, '0');
      return `WO-${nextSeq}`;
    };

    const workOrderNumber = await generateWorkOrderNumber();

    // Get part with routings
    const part = await prisma.part.findUnique({
      where: { id: partId },
      include: {
        workInstructions: {
          include: {
            steps: {
              include: {
                actions: true,
                files: true
              },
              orderBy: { stepNumber: 'asc' }
            }
          }
        },
        routings: {
          where: routingId ? { id: routingId } : { isActive: true },
          include: {
            steps: {
              include: {
                operation: true,
                workCenter: true
              },
              orderBy: { stepNumber: 'asc' }
            }
          }
        }
      }
    });

    if (!part) {
      return { success: false, error: 'Part not found' };
    }

    // Use routing if available, otherwise fall back to legacy work instructions
    const routing = routingId 
      ? part.routings.find(r => r.id === routingId)
      : part.routings.find(r => r.isActive);

    const result = await prisma.$transaction(async (tx) => {
      // Create the work order
      const workOrder = await tx.workOrder.create({
        data: {
          workOrderNumber,
          operation: routing ? 'Routing-based Manufacturing' : 'Manufacture',
          status,
          dueDate,
          createdById: userId,
          partId,
          partQty,
          notes,
          assignees: {
            create: assigneeIds.map(id => ({ userId: id }))
          },
          tags: {
            connect: tagIds.map(id => ({ id }))
          }
        }
      });

      // If routing exists, create work order routing and operations
      if (routing) {
        const workOrderRouting = await tx.workOrderRouting.create({
          data: {
            workOrderId: workOrder.id,
            routingId: routing.id,
            operations: {
              create: routing.steps.map(step => ({
                sequenceNumber: step.stepNumber,
                operationId: step.operationId,
                workCenterId: step.workCenterId,
                status: OperationStatus.PENDING,
                plannedQty: partQty,
                plannedSetupTime: step.setupTime,
                plannedRunTime: step.runTime * partQty,
                assignedUserId: operationAssignments[step.stepNumber] === 'unassigned' ? null : operationAssignments[step.stepNumber] || null,
                priority: 0
              }))
            }
          },
          include: {
            operations: {
              include: {
                operation: true,
                workCenter: true
              }
            }
          }
        });

        return { workOrder, workOrderRouting };
      } else {
        // Create work instruction snapshot for backward compatibility
        const workInstruction = part.workInstructions[0];
        if (workInstruction) {
          await tx.workOrderWorkInstruction.create({
            data: {
              workOrderId: workOrder.id,
              originalInstructionId: workInstruction.id,
              title: workInstruction.title,
              description: workInstruction.description,
              steps: {
                create: workInstruction.steps.map((step: any) => ({
                  originalStepId: step.id,
                  stepNumber: step.stepNumber,
                  title: step.title,
                  instructions: step.instructions,
                  estimatedLabourTime: step.estimatedLabourTime,
                  requiredTools: step.requiredTools || [],
                  status: 'PENDING',
                  actions: {
                    create: step.actions.map((action: any) => ({
                      originalActionId: action.id,
                      actionType: action.actionType,
                      description: action.description,
                      notes: action.notes,
                      isRequired: action.isRequired,
                      signoffRoles: action.signoffRoles || [],
                      targetValue: action.targetValue,
                      tolerance: action.tolerance,
                      unit: action.unit
                    }))
                  }
                }))
              }
            }
          });
        }
        
        return { workOrder };
      }
    });

    revalidatePath('/production/work-orders');
    revalidatePath(`/parts/library/${partId}`);

    return { success: true, data: result };
  } catch (error) {
    console.error('Error creating work order with routing:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create work order'
    };
  }
}

/**
 * Update operation status
 */
export async function updateOperationStatus({
  operationId,
  status,
  notes
}: {
  operationId: string;
  status: OperationStatus;
  notes?: string;
}) {
  try {
    const { requirePermission, PERMISSIONS } = await import('@/lib/rbac');
    const userId = await requirePermission(PERMISSIONS.WORK_ORDERS.UPDATE);

    const now = new Date();
    const updateData: Prisma.WorkOrderOperationUpdateInput = {
      status,
      notes,
      updatedAt: now
    };

    // Set timestamps based on status change
    if (status === OperationStatus.SETUP) {
      updateData.startedAt = now;
      updateData.setupByUser = { connect: { id: userId } };
    } else if (status === OperationStatus.RUNNING) {
      updateData.setupCompletedAt = now;
    } else if (status === OperationStatus.COMPLETED) {
      updateData.completedAt = now;
      updateData.completedByUser = { connect: { id: userId } };
    }

    const operation = await prisma.workOrderOperation.update({
      where: { id: operationId },
      data: updateData,
      include: {
        operation: true,
        workCenter: true,
        workOrderRouting: {
          include: {
            workOrder: true
          }
        }
      }
    });

    // Check if all operations are complete to update work order status
    const allOperations = await prisma.workOrderOperation.findMany({
      where: { workOrderRoutingId: operation.workOrderRoutingId }
    });

    const allComplete = allOperations.every(op => 
      op.status === OperationStatus.COMPLETED || 
      op.status === OperationStatus.SKIPPED
    );

    if (allComplete) {
      await prisma.workOrder.update({
        where: { id: operation.workOrderRouting.workOrder.id },
        data: { status: WorkOrderStatus.COMPLETED }
      });
    } else if (status === OperationStatus.RUNNING || status === OperationStatus.SETUP) {
      // Update work order to IN_PROGRESS if any operation is running
      await prisma.workOrder.update({
        where: { id: operation.workOrderRouting.workOrder.id },
        data: { status: WorkOrderStatus.IN_PROGRESS }
      });
    }

    revalidatePath('/production/work-orders');
    revalidatePath(`/production/${operation.workOrderRouting.workOrder.id}`);

    return { success: true, data: operation };
  } catch (error) {
    console.error('Error updating operation status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update operation status'
    };
  }
}

/**
 * Update operation quantities
 */
export async function updateOperationQuantity({
  operationId,
  completedQty,
  scrappedQty
}: {
  operationId: string;
  completedQty?: number;
  scrappedQty?: number;
}) {
  try {
    const { requirePermission, PERMISSIONS } = await import('@/lib/rbac');
    await requirePermission(PERMISSIONS.WORK_ORDERS.UPDATE);

    const updateData: Prisma.WorkOrderOperationUpdateInput = {};
    
    if (completedQty !== undefined) {
      updateData.completedQty = completedQty;
    }
    
    if (scrappedQty !== undefined) {
      updateData.scrappedQty = scrappedQty;
    }

    const operation = await prisma.workOrderOperation.update({
      where: { id: operationId },
      data: updateData
    });

    revalidatePath('/production/work-orders');

    return { success: true, data: operation };
  } catch (error) {
    console.error('Error updating operation quantity:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update operation quantity'
    };
  }
}

/**
 * Assign user to operation
 */
export async function assignUserToOperation({
  operationId,
  userId
}: {
  operationId: string;
  userId: string | null;
}) {
  try {
    const { requirePermission, PERMISSIONS } = await import('@/lib/rbac');
    await requirePermission(PERMISSIONS.WORK_ORDERS.UPDATE);

    const operation = await prisma.workOrderOperation.update({
      where: { id: operationId },
      data: { assignedUserId: userId }
    });

    revalidatePath('/production/work-orders');

    return { success: true, data: operation };
  } catch (error) {
    console.error('Error assigning user to operation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to assign user to operation'
    };
  }
}

/**
 * Get operations by work center
 */
export async function getOperationsByWorkCenter(workCenterId?: string) {
  try {
    const where: Prisma.WorkOrderOperationWhereInput = {
      status: {
        notIn: [OperationStatus.COMPLETED, OperationStatus.SKIPPED]
      }
    };

    if (workCenterId) {
      where.workCenterId = workCenterId;
    }

    const operations = await prisma.workOrderOperation.findMany({
      where,
      include: {
        operation: true,
        workCenter: true,
        assignedUser: true,
        workOrderRouting: {
          include: {
            workOrder: {
              include: {
                part: true
              }
            }
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { workOrderRouting: { workOrder: { dueDate: 'asc' } } },
        { sequenceNumber: 'asc' }
      ]
    });

    return { success: true, data: operations };
  } catch (error) {
    console.error('Error fetching operations by work center:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch operations'
    };
  }
}