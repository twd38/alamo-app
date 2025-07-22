'use server';
import { prisma } from 'src/lib/db';
import { revalidatePath } from 'next/cache';
import { WorkOrderStatus, Color } from '@prisma/client';
import { auth } from 'src/lib/auth';
import {
  Task,
  Part,
  TrackingType,
  BOMType,
  Prisma,
  PartType,
  ActionType,
  TaskTag,
  File as PrismaFile
} from '@prisma/client';
import {
  deleteFileFromR2,
  getSignedDownloadUrl,
  getUploadUrl,
  getSignedDownloadUrlFromPublicUrl,
  getKeyFromPublicUrl
} from '@/lib/server/r2';
import {
  generateRandomColor,
  generateNewPartNumberSimpleSix
} from '@/lib/utils';
import { checkFeasibility } from '@/lib/site-engine/feasibility';
import { buildYield } from '@/lib/site-engine/yield';
import { runFinance } from '@/lib/site-engine/finance';
import { SCHEMES } from '@/lib/site-engine/templates';
import type { Lot } from '@/lib/site-engine/types';
import { assumptions } from '@/lib/config'; // centralised assumptions
import { notify } from './server/notification-service';
import { convertStepFileToGltf } from './actions/cad-actions';

const appUrl = process.env.NEXT_PUBLIC_APP_URL;

// Helper function to check if a file is a File instance
function isFileInstance(
  file:
    | File
    | {
        id: string;
        url: string;
        key: string;
        name: string;
        type: string;
        size: number;
        taskId: string;
        jobId: string;
      }
): file is File {
  return file instanceof File;
}

export async function createWorkInstruction({
  partId,
  title,
  description,
  steps,
  instructionNumber
}: Prisma.WorkInstructionCreateWithoutPartInput & {
  partId: string;
  steps:
    | Prisma.WorkInstructionStepCreateWithoutWorkInstructionInput[]
    | undefined;
}) {
  //Prisma.WorkInstructionStepCreateWithoutWorkInstructionInput[] | undefined,
  try {
    const result = await prisma.workInstruction.create({
      data: {
        title,
        description,
        instructionNumber: `WI-${Date.now()}`,
        steps: {
          create: steps
        },
        part: {
          connect: {
            id: partId
          }
        }
      }
    });
    return { success: true, data: result };
  } catch (error: any) {
    console.error('Error creating work instruction:', error);
    return { success: false, error: 'Failed to create work instruction' };
  }
}

export async function createWorkInstructionStep({
  workInstructionId,
  stepNumber,
  title,
  instructions,
  estimatedLabourTime
}: Prisma.WorkInstructionStepCreateWithoutWorkInstructionInput & {
  workInstructionId: string;
}) {
  try {
    const result = await prisma.workInstructionStep.create({
      data: {
        workInstructionId,
        stepNumber,
        title,
        instructions,
        estimatedLabourTime
      }
    });
    return { success: true, data: result };
  } catch (error: any) {
    console.error('Error creating work instruction step:', error);
    return { success: false, error: 'Failed to create work instruction step' };
  }
}

export async function updateWorkInstructionStep({
  stepId,
  title,
  instructions,
  estimatedLabourTime,
  files
}: {
  stepId: string;
  title?: string;
  instructions?: string;
  estimatedLabourTime?: number;
  files?: Prisma.FileCreateInput[];
}) {
  try {
    const result = await prisma.workInstructionStep.update({
      where: { id: stepId },
      data: {
        title,
        instructions,
        estimatedLabourTime,
        files: {
          connect: files?.map((file) => ({ id: file.id }))
        }
      }
    });
    return { success: true, data: result };
  } catch (error) {
    console.error('Error updating work instruction step:', error);
    return { success: false, error: 'Failed to update work instruction step' };
  }
}

export async function deleteWorkInstructionStepFile(
  stepId: string,
  fileId: string
) {
  try {
    const result = await prisma.workInstructionStep.update({
      where: { id: stepId },
      data: {
        files: {
          delete: {
            id: fileId
          }
        }
      }
    });

    return { success: true, data: result };
  } catch (error) {
    console.error('Error deleting work instruction step file:', error);
    return {
      success: false,
      error: 'Failed to delete work instruction step file'
    };
  }
}

export async function createWorkInstructionStepAction(
  data: Prisma.WorkInstructionStepActionCreateWithoutStepInput & {
    stepId: string;
  }
) {
  const {
    stepId,
    actionType,
    description,
    targetValue,
    unit,
    tolerance,
    signoffRoles,
    isRequired,
    notes
  } = data;
  try {
    const result = await prisma.workInstructionStepAction.create({
      data: {
        stepId,
        actionType,
        description,
        targetValue: targetValue || null,
        unit: unit || null,
        tolerance: tolerance || null,
        signoffRoles: signoffRoles || [],
        isRequired,
        notes: notes || null
      }
    });
    return { success: true, data: result };
  } catch (error: any) {
    console.error('Error creating work instruction step action:', error.stack);
    return {
      success: false,
      error: 'Failed to create work instruction step action'
    };
  }
}

export async function updateWorkInstructionStepAction({
  actionId,
  actionType,
  description,
  targetValue,
  unit,
  tolerance,
  signoffRoles,
  isRequired,
  notes,
  uploadedFileId
}: {
  actionId: string;
  actionType?: ActionType;
  description?: string;
  targetValue?: number;
  unit?: string;
  tolerance?: number;
  signoffRoles?: string[];
  isRequired?: boolean;
  notes?: string;
  uploadedFileId?: string | null;
}) {
  try {
    const result = await prisma.workInstructionStepAction.update({
      where: { id: actionId },
      data: {
        actionType,
        description,
        targetValue,
        unit,
        tolerance,
        signoffRoles,
        isRequired,
        notes,
        uploadedFileId
      }
    });
    return { success: true, data: result };
  } catch (error) {
    console.error('Error updating work instruction step action:', error);
    return {
      success: false,
      error: 'Failed to update work instruction step action'
    };
  }
}

export async function addFilesToWorkInstructionStep(
  stepId: string,
  files: Prisma.FileCreateInput[]
) {
  try {
    const result = await prisma.workInstructionStep.update({
      where: { id: stepId },
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
    return { success: true, data: result };
  } catch (error) {
    console.error('Error adding files to work instruction step:', error);
    return {
      success: false,
      error: 'Failed to add files to work instruction step'
    };
  }
}

export async function deleteFilesFromWorkInstructionStep(
  stepId: string,
  fileIds: string[]
) {
  try {
    const result = await prisma.workInstructionStep.update({
      where: { id: stepId },
      data: {
        files: {
          deleteMany: {
            id: { in: fileIds }
          }
        }
      }
    });
    return { success: true, data: result };
  } catch (error) {
    console.error('Error deleting files from work instruction step:', error);
    return {
      success: false,
      error: 'Failed to delete files from work instruction step'
    };
  }
}

export async function deleteWorkInstructionStepAction(actionId: string) {
  try {
    await prisma.workInstructionStepAction.delete({
      where: { id: actionId }
    });
    return { success: true };
  } catch (error) {
    console.error('Error deleting work instruction step action:', error);
    return {
      success: false,
      error: 'Failed to delete work instruction step action'
    };
  }
}

// Work Order Work Instruction Actions

export async function updateWorkOrderWorkInstructionStep({
  stepId,
  title,
  instructions,
  estimatedLabourTime,
  files
}: {
  stepId: string;
  title: string;
  instructions: string;
  estimatedLabourTime: number;
  files?: Prisma.FileCreateInput[];
}) {
  try {
    const result = await prisma.workOrderWorkInstructionStep.update({
      where: { id: stepId },
      data: {
        title,
        instructions,
        estimatedLabourTime,
        files: {
          connect: files?.map((file) => ({ id: file.id }))
        }
      }
    });
    return { success: true, data: result };
  } catch (error) {
    console.error('Error updating work order work instruction step:', error);
    return {
      success: false,
      error: 'Failed to update work order work instruction step'
    };
  }
}

export async function createWorkOrderWorkInstructionStep({
  workOrderInstructionId,
  stepNumber,
  title,
  instructions,
  estimatedLabourTime,
  files
}: {
  workOrderInstructionId: string;
  stepNumber: number;
  title: string;
  instructions: string;
  estimatedLabourTime: number;
  files?: Prisma.FileCreateInput[];
}) {
  try {
    const result = await prisma.workOrderWorkInstructionStep.create({
      data: {
        workOrderInstructionId,
        stepNumber,
        title,
        instructions,
        estimatedLabourTime,
        requiredTools: [],
        status: 'PENDING',
        activeWorkers: 0,
        files: {
          connect: files?.map((file) => ({ id: file.id }))
        }
      }
    });
    return { success: true, data: result };
  } catch (error) {
    console.error('Error creating work order work instruction step:', error);
    return {
      success: false,
      error: 'Failed to create work order work instruction step'
    };
  }
}

export async function deleteWorkOrderWorkInstructionStep(stepId: string) {
  try {
    const result = await prisma.workOrderWorkInstructionStep.delete({
      where: { id: stepId }
    });
    return { success: true, data: result };
  } catch (error) {
    console.error('Error deleting work order work instruction step:', error);
    return {
      success: false,
      error: 'Failed to delete work order work instruction step'
    };
  }
}

export async function reorderWorkOrderWorkInstructionSteps(
  workOrderInstructionId: string,
  stepIds: string[]
) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      for (let i = 0; i < stepIds.length; i++) {
        await tx.workOrderWorkInstructionStep.update({
          where: { id: stepIds[i] },
          data: { stepNumber: i + 1 }
        });
      }
    });
    return { success: true, data: result };
  } catch (error) {
    console.error('Error reordering work order work instruction steps:', error);
    return {
      success: false,
      error: 'Failed to reorder work order work instruction steps'
    };
  }
}

export async function addFilesToWorkOrderWorkInstructionStep(
  stepId: string,
  files: Prisma.FileCreateInput[]
) {
  try {
    const result = await prisma.workOrderWorkInstructionStep.update({
      where: { id: stepId },
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
    return { success: true, data: result };
  } catch (error) {
    console.error(
      'Error adding files to work order work instruction step:',
      error
    );
    return {
      success: false,
      error: 'Failed to add files to work order work instruction step'
    };
  }
}

export async function deleteFilesFromWorkOrderWorkInstructionStep(
  stepId: string,
  fileIds: string[]
) {
  try {
    const result = await prisma.workOrderWorkInstructionStep.update({
      where: { id: stepId },
      data: {
        files: {
          deleteMany: {
            id: { in: fileIds }
          }
        }
      }
    });
    return { success: true, data: result };
  } catch (error) {
    console.error(
      'Error deleting files from work order work instruction step:',
      error
    );
    return {
      success: false,
      error: 'Failed to delete files from work order work instruction step'
    };
  }
}

export async function createWorkOrderWorkInstructionStepAction(
  data: Prisma.WorkOrderWorkInstructionStepActionCreateWithoutStepInput & {
    stepId: string;
  }
) {
  const {
    stepId,
    actionType,
    description,
    targetValue,
    unit,
    tolerance,
    signoffRoles,
    isRequired,
    notes
  } = data;
  try {
    const result = await prisma.workOrderWorkInstructionStepAction.create({
      data: {
        stepId,
        actionType,
        description,
        targetValue: targetValue || null,
        unit: unit || null,
        tolerance: tolerance || null,
        signoffRoles: signoffRoles || [],
        isRequired,
        notes: notes || null
      }
    });
    return { success: true, data: result };
  } catch (error: any) {
    console.error(
      'Error creating work order work instruction step action:',
      error.stack
    );
    return {
      success: false,
      error: 'Failed to create work order work instruction step action'
    };
  }
}

export async function deleteWorkOrderWorkInstructionStepAction(
  actionId: string
) {
  try {
    const result = await prisma.workOrderWorkInstructionStepAction.delete({
      where: { id: actionId }
    });
    return { success: true, data: result };
  } catch (error) {
    console.error(
      'Error deleting work order work instruction step action:',
      error
    );
    return {
      success: false,
      error: 'Failed to delete work order work instruction step action'
    };
  }
}

export async function updateWorkOrderWorkInstructionStepAction({
  actionId,
  actionType,
  description,
  targetValue,
  unit,
  tolerance,
  signoffRoles,
  isRequired,
  notes,
  uploadedFileId
}: {
  actionId: string;
  actionType?: ActionType;
  description?: string;
  targetValue?: number | null;
  unit?: string | null;
  tolerance?: number | null;
  signoffRoles?: string[];
  isRequired?: boolean;
  notes?: string | null;
  uploadedFileId?: string | null;
}) {
  try {
    const result = await prisma.workOrderWorkInstructionStepAction.update({
      where: { id: actionId },
      data: {
        actionType,
        description,
        targetValue,
        unit,
        tolerance,
        signoffRoles,
        isRequired,
        notes,
        uploadedFileId
      }
    });
    return { success: true, data: result };
  } catch (error) {
    console.error(
      'Error updating work order work instruction step action:',
      error
    );
    return {
      success: false,
      error: 'Failed to update work order work instruction step action'
    };
  }
}

export async function evaluateLot(lot: Lot) {
  return SCHEMES.map((scheme) => {
    const gate = checkFeasibility(lot, scheme);
    if (!gate.feasible)
      return {
        scheme: scheme.name,
        status: 'blocked',
        blocking: gate.blocking
      };

    const yld = buildYield(lot, scheme);
    const fin = runFinance(lot, scheme, yld, assumptions);
    return { scheme: scheme.name, status: 'feasible', yld, fin };
  });
}

export async function createBoardView(
  name: string,
  filters: any,
  boardId: string
) {
  try {
    // Get user from auth
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    const result = await prisma.boardView.create({
      data: {
        name,
        filters,
        createdById: userId,
        boardId
      }
    });

    revalidatePath('/board');
    return { success: true, data: result };
  } catch (error) {
    console.error('Error creating board view:', error);
    return { success: false, error: 'Failed to create board view' };
  }
}

export async function updateBoardView(
  boardViewId: string,
  data: {
    name?: string;
    filters?: any;
  }
) {
  try {
    // Get user from auth
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    // Verify the user has permission to update this board view
    // const boardView = await prisma.boardView.findFirst({
    //   where: {
    //     id: boardViewId,
    //     createdById: userId
    //   }
    // });

    // if (!boardView) {
    //   return { success: false, error: 'Board view not found or you do not have permission to update it' };
    // }

    const result = await prisma.boardView.update({
      where: { id: boardViewId },
      data: {
        name: data.name,
        filters: data.filters
      }
    });

    revalidatePath('/board');
    return { success: true, data: result };
  } catch (error) {
    console.error('Error updating board view:', error);
    return { success: false, error: 'Failed to update board view' };
  }
}

// Board CRUD operations
type Board = {
  name: string;
  isPrivate: boolean;
  collaboratorIds: string[];
  icon?: string;
};

export async function createBoard({
  name,
  isPrivate,
  collaboratorIds,
  icon
}: Board) {
  try {
    // Get user from auth
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    // Create the board
    const board = await prisma.board.create({
      data: {
        name,
        private: isPrivate,
        icon,
        createdById: userId,
        collaborators: {
          connect: collaboratorIds.map((id) => ({ id }))
        }
      },
      include: {
        createdBy: true,
        collaborators: true
      }
    });

    revalidatePath('/board');
    return { success: true, data: board };
  } catch (error) {
    console.error('Error creating board:', error);
    return { success: false, error: 'Failed to create board' };
  }
}

export async function updateBoard(
  boardId: string,
  {
    name,
    private: isPrivate,
    collaboratorIds,
    icon
  }: {
    name?: string;
    private?: boolean;
    collaboratorIds?: string[];
    icon?: string;
  }
) {
  try {
    // Import RBAC functions
    const { requirePermission, PERMISSIONS, canAccessResource } = await import(
      '@/lib/rbac'
    );

    // Get user from auth first to handle the case where requirePermission fails
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    // Check permission to update this specific board using RBAC
    const hasAccess = await canAccessResource(
      userId,
      PERMISSIONS.BOARDS.UPDATE,
      'board',
      boardId
    );

    if (!hasAccess) {
      return {
        success: false,
        error: 'You do not have permission to update this board'
      };
    }

    // Update the board
    const updatedBoard = await prisma.board.update({
      where: { id: boardId },
      data: {
        name,
        private: isPrivate,
        icon,
        collaborators: collaboratorIds
          ? {
              set: collaboratorIds.map((id) => ({ id }))
            }
          : undefined
      },
      include: {
        createdBy: true,
        collaborators: true
      }
    });

    revalidatePath('/board');
    return { success: true, data: updatedBoard };
  } catch (error) {
    console.error('Error updating board:', error);
    return { success: false, error: 'Failed to update board' };
  }
}

export async function deleteBoard(boardId: string) {
  try {
    // Get user from auth
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    // Verify the user has permission to delete this board
    const board = await prisma.board.findFirst({
      where: {
        id: boardId,
        createdById: userId
      }
    });

    if (!board) {
      return {
        success: false,
        error: 'Board not found or you do not have permission to delete it'
      };
    }

    // Delete the board
    await prisma.board.delete({
      where: { id: boardId }
    });

    revalidatePath('/board');
    return { success: true };
  } catch (error) {
    console.error('Error deleting board:', error);
    return { success: false, error: 'Failed to delete board' };
  }
}

// -----------------------------------------------------------------------------
// Work Order actions
// -----------------------------------------------------------------------------

export async function createWorkOrder({
  partId,
  partQty,
  operation,
  status = WorkOrderStatus.TODO,
  timeEstimate = '',
  dueDate,
  assigneeIds = [],
  notes = '',
  tagIds = []
}: {
  partId: string;
  partQty: number;
  operation: string;
  status?: WorkOrderStatus;
  timeEstimate?: string;
  dueDate?: Date;
  assigneeIds?: string[];
  notes?: string;
  tagIds?: string[];
}) {
  try {
    // Validate input parameters
    if (!partId?.trim()) {
      return { success: false, error: 'Part ID is required' };
    }

    if (partQty <= 0) {
      return { success: false, error: 'Part quantity must be greater than 0' };
    }

    if (!operation?.trim()) {
      return { success: false, error: 'Operation description is required' };
    }

    // Import RBAC functions
    let userId: string;
    try {
      const { requirePermission, PERMISSIONS } = await import('@/lib/rbac');
      userId = await requirePermission(PERMISSIONS.WORK_ORDERS.CREATE);
    } catch (rbacError) {
      console.error('RBAC authorization failed:', rbacError);
      if (
        rbacError instanceof Error &&
        rbacError.message.includes('permission')
      ) {
        return {
          success: false,
          error: 'You do not have permission to create work orders'
        };
      }
      return { success: false, error: 'Authorization failed' };
    }

    // Helper to generate incremental WO number e.g. WO-000123
    const generateWorkOrderNumber = async (): Promise<string> => {
      try {
        const lastWO = await prisma.workOrder.findFirst({
          orderBy: {
            workOrderNumber: 'desc'
          },
          select: {
            workOrderNumber: true
          }
        });

        const lastSeq = lastWO?.workOrderNumber?.replace(/[^0-9]/g, '') || '0';
        const nextSeq = String(Number(lastSeq) + 1).padStart(6, '0');
        return `WO-${nextSeq}`;
      } catch (error) {
        console.error('Error generating work order number:', error);
        throw new Error('Failed to generate work order number');
      }
    };

    let workOrderNumber: string;
    try {
      workOrderNumber = await generateWorkOrderNumber();
    } catch (error) {
      console.error('Work order number generation failed:', error);
      return { success: false, error: 'Failed to generate work order number' };
    }

    // Get part with work instructions to create snapshots
    let part: any;
    try {
      part = await prisma.part.findUnique({
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
          }
        }
      });
    } catch (error) {
      console.error('Error fetching part:', error);
      return { success: false, error: 'Failed to fetch part information' };
    }

    if (!part) {
      return { success: false, error: 'Part not found' };
    }

    // Validate assignee user IDs exist if provided
    if (assigneeIds.length > 0) {
      try {
        const users = await prisma.user.findMany({
          where: { id: { in: assigneeIds } },
          select: { id: true }
        });

        const foundUserIds = users.map((u) => u.id);
        const invalidUserIds = assigneeIds.filter(
          (id) => !foundUserIds.includes(id)
        );

        if (invalidUserIds.length > 0) {
          return {
            success: false,
            error: `Invalid assignee user IDs: ${invalidUserIds.join(', ')}`
          };
        }
      } catch (error) {
        console.error('Error validating assignee IDs:', error);
        return {
          success: false,
          error: 'Failed to validate assignee user IDs'
        };
      }
    }

    // Use transaction to ensure all data is created atomically
    let result: any;
    try {
      result = await prisma.$transaction(
        async (tx) => {
          // 1. Create the work order
          const workOrderData: Prisma.WorkOrderUncheckedCreateInput = {
            id: undefined, // let Prisma generate cuid
            workOrderNumber,
            operation,
            status,
            dueDate: dueDate ?? null,
            createdById: userId,
            partId,
            partQty,
            notes,
            deletedOn: null,
            assignees: {
              create: assigneeIds.map((uid) => ({ userId: uid }))
            },
            tags: {
              connect: tagIds.map((tagId) => ({ id: tagId }))
            }
          };

          const workOrder = await tx.workOrder.create({
            data: workOrderData,
            include: {
              assignees: true,
              tags: true
            }
          });

          // 2. Create work order instruction snapshot (take the first instruction if multiple exist)
          const firstInstruction = part.workInstructions[0];
          if (firstInstruction) {
            try {
              // Create work order instruction
              const workOrderInstruction =
                await tx.workOrderWorkInstruction.create({
                  data: {
                    workOrderId: workOrder.id,
                    originalInstructionId: firstInstruction.id,
                    title: firstInstruction.title,
                    description: firstInstruction.description,
                    createdAt: new Date(),
                    updatedAt: new Date()
                  }
                });

              // Create work order instruction steps
              for (const step of firstInstruction.steps) {
                const workOrderStep =
                  await tx.workOrderWorkInstructionStep.create({
                    data: {
                      workOrderInstructionId: workOrderInstruction.id,
                      originalStepId: step.id,
                      stepNumber: step.stepNumber,
                      title: step.title,
                      instructions: step.instructions,
                      estimatedLabourTime: step.estimatedLabourTime,
                      requiredTools: step.requiredTools,
                      createdAt: new Date(),
                      updatedAt: new Date(),
                      // Initialize execution state
                      status: 'PENDING',
                      activeWorkers: 0,
                      // Copy files from original work instruction step
                      files: {
                        create:
                          step.files?.map((file: PrismaFile) => ({
                            url: file.url,
                            key: file.key,
                            name: file.name,
                            type: file.type,
                            size: file.size
                          })) || []
                      }
                    }
                  });

                // Create work order instruction step actions
                for (const action of step.actions) {
                  await tx.workOrderWorkInstructionStepAction.create({
                    data: {
                      stepId: workOrderStep.id,
                      originalActionId: action.id,
                      description: action.description,
                      notes: action.notes,
                      isRequired: action.isRequired,
                      signoffRoles: action.signoffRoles,
                      targetValue: action.targetValue,
                      tolerance: action.tolerance,
                      unit: action.unit,
                      uploadedFileId: action.uploadedFileId,
                      actionType: action.actionType
                      // Execution fields start as null (not executed yet)
                    }
                  });
                }
              }
            } catch (instructionError) {
              console.error(
                'Error creating work instruction snapshots:',
                instructionError
              );
              throw new Error('Failed to create work instruction snapshots');
            }
          }

          return workOrder;
        },
        {
          timeout: 30000, // 30 second timeout for complex transactions
          maxWait: 5000 // Maximum time to wait for a transaction slot
        }
      );
    } catch (transactionError) {
      console.error('Transaction failed:', transactionError);

      if (transactionError instanceof Error) {
        if (transactionError.message.includes('timeout')) {
          return {
            success: false,
            error: 'Work order creation timed out. Please try again.'
          };
        }
        if (transactionError.message.includes('Unique constraint')) {
          return {
            success: false,
            error: 'Work order number already exists. Please try again.'
          };
        }
        if (transactionError.message.includes('Foreign key constraint')) {
          return {
            success: false,
            error: 'Invalid reference data. Please check your inputs.'
          };
        }
      }

      return {
        success: false,
        error: 'Failed to create work order in database'
      };
    }

    // Send notifications to assigned users (non-blocking)
    if (assigneeIds.length > 0) {
      try {
        await notify({
          recipientIds: assigneeIds,
          message: `You have been assigned a new Work order: <${appUrl}/production/${result.id}|${result.workOrderNumber}>`
        });
      } catch (notificationError) {
        // Log notification errors but don't fail the entire operation
        console.error(
          'Failed to send work order assignment notifications:',
          notificationError
        );
        // Could optionally store notification failures for retry later
      }
    }

    // Revalidate production page so new WO shows up
    try {
      revalidatePath('/production');
    } catch (revalidationError) {
      console.error('Failed to revalidate production page:', revalidationError);
      // This is not critical, so we don't fail the operation
    }

    return { success: true, data: result };
  } catch (error) {
    console.error('Unexpected error creating work order:', error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('connect')) {
        return {
          success: false,
          error: 'Database connection failed. Please try again.'
        };
      }
      if (error.message.includes('timeout')) {
        return {
          success: false,
          error: 'Operation timed out. Please try again.'
        };
      }
    }

    return { success: false, error: 'Failed to create work order' };
  }
}

export async function createWorkOrderTag(name: string) {
  try {
    // Validate input
    if (!name || name.trim().length === 0) {
      return { success: false, error: 'Tag name is required' };
    }

    if (name.length > 50) {
      return {
        success: false,
        error: 'Tag name must be 50 characters or less'
      };
    }

    const trimmedName = name.trim();

    // Check if tag with this name already exists
    const existingTag = await prisma.workOrderTag.findUnique({
      where: { name: trimmedName }
    });

    if (existingTag) {
      return { success: false, error: 'A tag with this name already exists' };
    }

    // Create the new tag
    const newTag = await prisma.workOrderTag.create({
      data: {
        name: trimmedName,
        color: 'slate' // Default color
      }
    });

    return { success: true, data: newTag };
  } catch (error) {
    console.error('Error creating work order tag:', error);
    return { success: false, error: 'Failed to create work order tag' };
  }
}

export async function updateWorkOrder({
  workOrderId,
  dueDate,
  partQty,
  assigneeIds,
  notes,
  operation,
  status
}: {
  workOrderId: string;
  dueDate?: Date | null;
  partQty?: number;
  assigneeIds?: string[];
  notes?: string;
  operation?: string;
  status?: WorkOrderStatus;
}) {
  try {
    // Import RBAC functions
    let userId: string;
    try {
      const { requirePermission, PERMISSIONS } = await import('@/lib/rbac');
      userId = await requirePermission(PERMISSIONS.WORK_ORDERS.UPDATE);
    } catch (rbacError) {
      console.error('RBAC authorization failed:', rbacError);
      if (
        rbacError instanceof Error &&
        rbacError.message.includes('permission')
      ) {
        return {
          success: false,
          error: 'You do not have permission to update work orders'
        };
      }
      return { success: false, error: 'Authorization failed' };
    }

    // Validate work order exists
    const existingWorkOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      select: { id: true }
    });

    if (!existingWorkOrder) {
      return { success: false, error: 'Work order not found' };
    }

    // Validate assignee user IDs exist if provided
    if (assigneeIds && assigneeIds.length > 0) {
      const users = await prisma.user.findMany({
        where: { id: { in: assigneeIds } },
        select: { id: true }
      });

      const foundUserIds = users.map((u) => u.id);
      const invalidUserIds = assigneeIds.filter(
        (id) => !foundUserIds.includes(id)
      );

      if (invalidUserIds.length > 0) {
        return {
          success: false,
          error: `Invalid assignee user IDs: ${invalidUserIds.join(', ')}`
        };
      }
    }

    // Prepare update data
    const updateData: Prisma.WorkOrderUpdateInput = {};

    if (dueDate !== undefined) {
      updateData.dueDate = dueDate;
    }

    if (partQty !== undefined) {
      if (partQty <= 0) {
        return {
          success: false,
          error: 'Part quantity must be greater than 0'
        };
      }
      updateData.partQty = partQty;
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    if (operation !== undefined) {
      updateData.operation = operation;
    }

    if (status !== undefined) {
      updateData.status = status;
    }

    // Use transaction to handle assignees update and quantity-related actions
    const result = await prisma.$transaction(async (tx) => {
      // Update basic work order fields
      const updatedWorkOrder = await tx.workOrder.update({
        where: { id: workOrderId },
        data: updateData
      });

      // Handle assignees update if provided
      if (assigneeIds !== undefined) {
        // Remove existing assignees
        await tx.workOrderAssignee.deleteMany({
          where: { workOrderId }
        });

        // Add new assignees
        if (assigneeIds.length > 0) {
          await tx.workOrderAssignee.createMany({
            data: assigneeIds.map((userId) => ({
              workOrderId,
              userId
            }))
          });
        }
      }

      // Update QUANTITY_INPUT actions target values if partQty was updated
      if (partQty !== undefined) {
        // Find all QUANTITY_INPUT actions for this work order and update their target values
        await tx.workOrderWorkInstructionStepAction.updateMany({
          where: {
            step: {
              workOrderInstruction: {
                workOrderId
              }
            },
            actionType: 'QUANTITY_INPUT'
          },
          data: {
            targetValue: partQty
          }
        });
      }

      return updatedWorkOrder;
    });

    revalidatePath(`/production/${workOrderId}`);
    revalidatePath(`/production/${workOrderId}/edit`);
    return { success: true, data: result };
  } catch (error: any) {
    console.error('Error updating work order:', error);
    return {
      success: false,
      error: `Failed to update work order: ${error.message || 'Unknown error'}`
    };
  }
}

export async function deleteWorkInstructionStep(stepId: string) {
  try {
    await prisma.workInstructionStep.delete({
      where: { id: stepId }
    });
    return { success: true };
  } catch (error) {
    console.error('Error deleting work instruction step:', error);
    return { success: false, error: 'Failed to delete work instruction step' };
  }
}

export async function reorderWorkInstructionSteps(
  workInstructionId: string,
  stepIds: string[]
) {
  try {
    // Use a transaction to ensure all updates are atomic
    const updates = await prisma.$transaction(
      stepIds.map((stepId, index) => {
        return prisma.workInstructionStep.update({
          where: { id: stepId },
          data: { stepNumber: index + 1 }
        });
      })
    );

    // revalidatePath('/parts/library/[partNumber]/manufacturing');
    return { success: true, data: updates };
  } catch (error) {
    console.error('Error reordering work instruction steps:', error);
    return { success: false, error: 'Failed to reorder steps' };
  }
}

// -----------------------------------------------------------------------------
// Work Order Production actions
// -----------------------------------------------------------------------------

export async function clockInUsersToWorkOrder(
  userIds: string[],
  workOrderId: string
) {
  // Create clock-in entries for multiple users with the current time
  const clockInTime = new Date();

  const clockInEntries = await prisma.clockInEntry.createMany({
    data: userIds.map((userId) => ({
      userId,
      workOrderId,
      clockInTime
    }))
  });

  // Revalidate the production page to show updated clocked-in users
  revalidatePath('/production');

  return { success: true, data: clockInEntries };
}

export async function clockOutUsersFromWorkOrder(
  userIds: string[],
  workOrderId: string
) {
  // Update clock-in entries to set clock-out time
  const clockOutTime = new Date();

  const result = await prisma.clockInEntry.updateMany({
    where: {
      userId: { in: userIds },
      workOrderId,
      clockOutTime: null // Only update entries that haven't been clocked out yet
    },
    data: {
      clockOutTime
    }
  });

  // Revalidate the production page to show updated clocked-in users
  revalidatePath('/production');

  return { success: true, data: result };
}

export async function startWorkOrderProduction(workOrderId: string) {
  // Create workOrderTimeEntry for each user currently clocked in to the work order
  const clockInEntries = await prisma.clockInEntry.findMany({
    where: {
      workOrderId,
      clockOutTime: null
    }
  });

  // Create a workOrderTimeEntry for each clockInEntry
  const startTime = new Date();
  const workOrderTimeEntries = await prisma.workOrderTimeEntry.createMany({
    data: clockInEntries.map((clockInEntry) => ({
      userId: clockInEntry.userId,
      workOrderId,
      startTime
    }))
  });

  // Update the work order status to IN_PROGRESS
  await prisma.workOrder.update({
    where: { id: workOrderId },
    data: { status: WorkOrderStatus.IN_PROGRESS }
  });

  // The first step is already initialized when creating the work order

  revalidatePath('/production');

  return { success: true, data: workOrderTimeEntries };
}

export async function pauseWorkOrderProduction(workOrderId: string) {
  // Stop all active workOrderTimeEntries for the work order
  const activeTimeEntries = await prisma.workOrderTimeEntry.findMany({
    where: {
      workOrderId,
      stopTime: null
    }
  });

  await prisma.workOrderTimeEntry.updateMany({
    where: {
      workOrderId,
      stopTime: null
    },
    data: {
      stopTime: new Date()
    }
  });

  // Calculate the time taken so far and update the work order
  const timeTakenForCurrentEntry =
    new Date().getTime() - activeTimeEntries[0].startTime.getTime();

  // Get current work order to add to existing timeTaken
  const currentWorkOrder = await prisma.workOrder.findUnique({
    where: { id: workOrderId },
    select: { timeTaken: true }
  });

  // Update the work order status to PAUSED and add to timeTaken
  await prisma.workOrder.update({
    where: { id: workOrderId },
    data: {
      status: WorkOrderStatus.PAUSED,
      timeTaken: (currentWorkOrder?.timeTaken || 0) + timeTakenForCurrentEntry
    }
  });

  revalidatePath('/production');

  return { success: true, data: { count: activeTimeEntries.length } };
}

export async function startWorkOrderTimeEntry(
  userId: string,
  workOrderId: string
) {
  // Create a new WorkOrderTimeEntry with the current time
  const workOrderTimeEntry = await prisma.workOrderTimeEntry.create({
    data: {
      userId,
      workOrderId,
      startTime: new Date()
    }
  });

  return { success: true, data: workOrderTimeEntry };
}

export async function stopWorkOrderTimeEntry(
  userId: string,
  workOrderId: string
) {
  // Get the latest WorkOrderTimeEntry for the user and work order that is not clocked out
  const activeWorkOrder = await prisma.workOrderTimeEntry.findFirst({
    where: {
      userId,
      workOrderId,
      stopTime: null
    }
  });

  // If no active work order time entry is found, return an error
  if (!activeWorkOrder) {
    return { success: false, error: 'No active work order time entry found' };
  }

  // Update the WorkOrderTimeEntry with the current time
  const workOrderTimeEntry = await prisma.workOrderTimeEntry.update({
    where: { id: activeWorkOrder.id },
    data: { stopTime: new Date() }
  });

  return { success: true, data: workOrderTimeEntry };
}

/**
 * Complete a work order (change status to COMPLETED, stop timer)
 * This is called when the last step is completed
 */
export async function completeWorkOrder(workOrderId: string) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    // Get all active time entries
    const activeTimeEntries = await prisma.workOrderTimeEntry.findMany({
      where: {
        workOrderId,
        stopTime: null
      }
    });

    // Get the work order to verify it exists and get current timeTaken
    const currentWorkOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      select: {
        id: true,
        status: true,
        timeTaken: true
      }
    });

    if (!currentWorkOrder) {
      return { success: false, error: 'Work order not found' };
    }

    if (currentWorkOrder.status !== WorkOrderStatus.IN_PROGRESS) {
      return {
        success: false,
        error: 'Work order must be in progress to complete'
      };
    }

    // Calculate the time taken for current session and stop all active time entries
    let timeTakenForCurrentEntry = 0;
    if (activeTimeEntries.length > 0) {
      // Stop all active time entries
      await prisma.workOrderTimeEntry.updateMany({
        where: {
          workOrderId,
          stopTime: null
        },
        data: {
          stopTime: new Date()
        }
      });

      // Calculate the time taken for current entry (like pauseWorkOrderProduction does)
      timeTakenForCurrentEntry =
        new Date().getTime() - activeTimeEntries[0].startTime.getTime();
    }

    // Update the work order status to COMPLETED and add current session time to existing timeTaken
    const updatedWorkOrder = await prisma.workOrder.update({
      where: { id: workOrderId },
      data: {
        status: WorkOrderStatus.COMPLETED,
        timeTaken: (currentWorkOrder.timeTaken || 0) + timeTakenForCurrentEntry
      }
    });

    revalidatePath(`/production/${workOrderId}`);
    revalidatePath('/production');

    return { success: true, data: updatedWorkOrder };
  } catch (error) {
    console.error('Error completing work order:', error);
    return { success: false, error: 'Failed to complete work order' };
  }
}

/**
 * Complete work order and clock out all users
 * This is called from the completion dialog
 */
export async function completeWorkOrderAndClockOut(workOrderId: string) {
  try {
    // Get all users currently clocked in to this work order
    const clockedInUsers = await prisma.clockInEntry.findMany({
      where: {
        workOrderId,
        clockOutTime: null
      },
      select: { userId: true }
    });

    // Clock out all users
    if (clockedInUsers.length > 0) {
      const userIds = clockedInUsers.map((entry) => entry.userId);
      await clockOutUsersFromWorkOrder(userIds, workOrderId);
    }

    return { success: true, data: { message: 'All users clocked out.' } };
  } catch (error) {
    console.error('Error completing work order and clocking out users:', error);
    return {
      success: false,
      error: 'Failed to complete work order and clock out users'
    };
  }
}

/**
 * Mark labels as printed for a work order
 */
export async function markLabelsAsPrinted(workOrderId: string) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    // Verify work order exists
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      select: { id: true }
    });

    if (!workOrder) {
      return { success: false, error: 'Work order not found' };
    }

    // Update labelsPrinted field
    const updatedWorkOrder = await prisma.workOrder.update({
      where: { id: workOrderId },
      data: { labelsPrinted: true }
    });

    revalidatePath(`/production/${workOrderId}`);

    return { success: true, data: updatedWorkOrder };
  } catch (error) {
    console.error('Error marking labels as printed:', error);
    return { success: false, error: 'Failed to mark labels as printed' };
  }
}

// -----------------------------------------------------------------------------
// Work Order Step Execution actions
// -----------------------------------------------------------------------------

/**
 * Initialize a single step execution for a work order
 * Since execution is now embedded in WorkOrderWorkInstructionStep, this function
 * just ensures the step exists and returns it
 */
export async function initializeStepExecution(
  workOrderId: string,
  stepId: string
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    // Find the work order step (execution tracking is embedded)
    const workOrderStep = await prisma.workOrderWorkInstructionStep.findFirst({
      where: {
        workOrderInstruction: {
          workOrderId
        },
        originalStepId: stepId
      }
    });

    if (!workOrderStep) {
      return { success: false, error: 'Work order step not found' };
    }

    return { success: true, data: workOrderStep };
  } catch (error) {
    console.error('Error initializing step execution:', error);
    return { success: false, error: 'Failed to initialize step execution' };
  }
}

/**
 * Initialize step executions for a work order
 * Since execution is now embedded in WorkOrderWorkInstructionStep, this function
 * returns the existing work order instruction steps
 * Note: Steps are automatically created when creating a work order with work instructions.
 */
export async function initializeWorkOrderStepExecutions(workOrderId: string) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    // Get work order with its work instruction steps
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: {
        workInstruction: {
          include: {
            steps: {
              orderBy: { stepNumber: 'asc' }
            }
          }
        }
      }
    });

    if (!workOrder) {
      return { success: false, error: 'Work order not found' };
    }

    if (!workOrder.workInstruction) {
      return {
        success: false,
        error: 'No work instructions found for this work order'
      };
    }

    // Return the existing work order instruction steps (execution tracking is embedded)
    const steps = workOrder.workInstruction.steps;

    return { success: true, data: steps };
  } catch (error) {
    console.error('Error initializing step executions:', error);
    return { success: false, error: 'Failed to initialize step executions' };
  }
}

/**
 * Start execution of a specific step
 */
export async function startStepExecution({
  workOrderId,
  stepId
}: {
  workOrderId: string;
  stepId: string;
}) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    // Check if work order is in progress
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId }
    });

    if (!workOrder) {
      return { success: false, error: 'Work order not found' };
    }

    if (workOrder.status !== 'IN_PROGRESS') {
      return {
        success: false,
        error: 'Work order must be in progress to start steps'
      };
    }

    // Get the work order step (execution tracking is embedded)
    const workOrderStep = await prisma.workOrderWorkInstructionStep.findFirst({
      where: {
        workOrderInstruction: {
          workOrderId
        },
        originalStepId: stepId
      }
    });

    if (!workOrderStep) {
      return { success: false, error: 'Work order step not found' };
    }

    // Start the step execution
    const updatedStepExecution =
      await prisma.workOrderWorkInstructionStep.update({
        where: { id: workOrderStep.id },
        data: {
          status: 'IN_PROGRESS',
          startedAt: new Date(),
          activeWorkers: { increment: 1 }
        }
      });

    revalidatePath(`/production/${workOrderId}`);
    return { success: true, data: updatedStepExecution };
  } catch (error) {
    console.error('Error starting step execution:', error);
    return { success: false, error: 'Failed to start step execution' };
  }
}

/**
 * Complete a step action execution
 */
export async function completeStepAction({
  workOrderId,
  workOrderInstructionStepActionId,
  value,
  notes,
  uploadedFileId
}: {
  workOrderId: string;
  workOrderInstructionStepActionId: string;
  value?: number | boolean | string;
  notes?: string;
  uploadedFileId?: string;
}) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    // Get the action to check its type
    const action = await prisma.workOrderWorkInstructionStepAction.findUnique({
      where: { id: workOrderInstructionStepActionId },
      select: { actionType: true }
    });

    if (!action) {
      return { success: false, error: 'Action not found' };
    }

    // Prepare update data based on action type and value type
    const updateData: any = {
      executionNotes: notes,
      completedAt: new Date(),
      completedBy: userId,
      executionFileId: uploadedFileId
    };

    // Set the appropriate value field based on action type
    switch (action.actionType) {
      case 'VALUE_INPUT':
        if (typeof value === 'number') {
          updateData.executedNumberValue = value;
        }
        break;

      case 'CHECKBOX':
        if (typeof value === 'boolean') {
          updateData.executedBooleanValue = value;
        }
        break;

      case 'UPLOAD_IMAGE':
        // File uploads are handled via executionFileId, no value needed
        break;

      case 'SIGNOFF':
        // Signoffs only need completion timestamp, no value needed
        break;

      default:
        // For any future string-based actions
        if (typeof value === 'string') {
          updateData.executedStringValue = value;
        }
        break;
    }

    // Update the action with execution data (execution tracking is embedded)
    const updatedAction =
      await prisma.workOrderWorkInstructionStepAction.update({
        where: { id: workOrderInstructionStepActionId },
        data: updateData
      });

    revalidatePath(`/production/${workOrderId}`);
    return { success: true, data: updatedAction };
  } catch (error) {
    console.error('Error completing step action:', error);
    return { success: false, error: 'Failed to complete step action' };
  }
}

/**
 * Complete a work order instruction step
 * Validates that all required actions are completed
 */
export async function completeWorkOrderWorkInstructionStep({
  workOrderId,
  stepId
}: {
  workOrderId: string;
  stepId: string; // This is now the WorkOrderWorkInstructionStep ID
}) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    // Get the work order step with actions (execution tracking is embedded)
    const workOrderStep = await prisma.workOrderWorkInstructionStep.findUnique({
      where: {
        id: stepId
      },
      include: {
        actions: true,
        workOrderInstruction: true
      }
    });

    if (!workOrderStep) {
      return { success: false, error: 'Work order step not found' };
    }

    // Verify this step belongs to the correct work order
    if (workOrderStep.workOrderInstruction.workOrderId !== workOrderId) {
      return {
        success: false,
        error: 'Step does not belong to this work order'
      };
    }

    // Check if all required actions are completed
    const requiredActions = workOrderStep.actions.filter(
      (action) => action.isRequired
    );
    const completedRequiredActions = workOrderStep.actions.filter(
      (action) => action.isRequired && action.completedAt
    );

    // Only validate required actions if there are any
    if (
      requiredActions.length > 0 &&
      completedRequiredActions.length < requiredActions.length
    ) {
      return {
        success: false,
        error: `${requiredActions.length - completedRequiredActions.length} required actions still need to be completed`
      };
    }

    // Complete the step
    const updatedStepExecution =
      await prisma.workOrderWorkInstructionStep.update({
        where: { id: workOrderStep.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          activeWorkers: 0
        }
      });

    revalidatePath(`/production/${workOrderId}`);
    return { success: true, data: updatedStepExecution };
  } catch (error) {
    console.error('Error completing step execution:', error);
    return { success: false, error: 'Failed to complete step execution' };
  }
}

/**
 * Skip a work order instruction step
 */
export async function skipStepExecution({
  workOrderId,
  stepId,
  reason
}: {
  workOrderId: string;
  stepId: string; // This is now the WorkOrderWorkInstructionStep ID
  reason?: string;
}) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    // Get the work order step (execution tracking is embedded)
    const workOrderStep = await prisma.workOrderWorkInstructionStep.findUnique({
      where: {
        id: stepId
      },
      include: {
        workOrderInstruction: true
      }
    });

    if (!workOrderStep) {
      return { success: false, error: 'Work order step not found' };
    }

    // Verify this step belongs to the correct work order
    if (workOrderStep.workOrderInstruction.workOrderId !== workOrderId) {
      return {
        success: false,
        error: 'Step does not belong to this work order'
      };
    }

    // Skip the step
    const updatedStepExecution =
      await prisma.workOrderWorkInstructionStep.update({
        where: { id: workOrderStep.id },
        data: {
          status: 'SKIPPED',
          completedAt: new Date(),
          activeWorkers: 0
        }
      });

    revalidatePath(`/production/${workOrderId}`);
    return { success: true, data: updatedStepExecution };
  } catch (error) {
    console.error('Error skipping step execution:', error);
    return { success: false, error: 'Failed to skip step execution' };
  }
}

/**
 * Get step execution status for a work order
 */
export async function getStepExecutionStatus(workOrderId: string) {
  try {
    const workOrderSteps = await prisma.workOrderWorkInstructionStep.findMany({
      where: {
        workOrderInstruction: {
          workOrderId
        }
      },
      include: {
        actions: {
          select: {
            id: true,
            isRequired: true,
            completedAt: true
          }
        }
      },
      orderBy: {
        stepNumber: 'asc'
      }
    });

    const statusSummary = workOrderSteps.map((step: any) => {
      const requiredActions = step.actions.filter((a: any) => a.isRequired);
      const completedRequiredActions = step.actions.filter(
        (action: any) => action.isRequired && action.completedAt
      );

      return {
        stepId: step.id,
        stepNumber: step.stepNumber,
        stepTitle: step.title,
        status: step.status,
        startedAt: step.startedAt,
        completedAt: step.completedAt,
        timeTaken: step.timeTaken,
        activeWorkers: step.activeWorkers,
        requiredActionsCount: requiredActions.length,
        completedRequiredActionsCount: completedRequiredActions.length,
        canComplete: completedRequiredActions.length === requiredActions.length
      };
    });

    return { success: true, data: statusSummary };
  } catch (error) {
    console.error('Error getting step execution status:', error);
    return { success: false, error: 'Failed to get step execution status' };
  }
}

export async function deleteWorkOrder(workOrderId: string) {
  try {
    // Import RBAC functions
    let userId: string;
    try {
      const { requirePermission, PERMISSIONS } = await import('@/lib/rbac');
      userId = await requirePermission(PERMISSIONS.WORK_ORDERS.DELETE);
    } catch (rbacError) {
      console.error('RBAC authorization failed:', rbacError);
      if (
        rbacError instanceof Error &&
        rbacError.message.includes('permission')
      ) {
        return {
          success: false,
          error: 'You do not have permission to delete work orders'
        };
      }
      return { success: false, error: 'Authorization failed' };
    }

    // Validate work order exists and is not already deleted
    const existingWorkOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      select: {
        id: true,
        workOrderNumber: true,
        deletedOn: true
      }
    });

    if (!existingWorkOrder) {
      return { success: false, error: 'Work order not found' };
    }

    if (existingWorkOrder.deletedOn) {
      return { success: false, error: 'Work order is already deleted' };
    }

    // Soft delete the work order by setting deletedOn timestamp
    const deletedWorkOrder = await prisma.workOrder.update({
      where: { id: workOrderId },
      data: {
        deletedOn: new Date()
      }
    });

    // Revalidate production pages to reflect deletion
    revalidatePath('/production');

    return { success: true, data: deletedWorkOrder };
  } catch (error: any) {
    console.error('Error deleting work order:', error);
    return {
      success: false,
      error: `Failed to delete work order: ${error.message || 'Unknown error'}`
    };
  }
}

/**
 * Add STEP file to a part with automatic GLTF conversion
 * This action:
 * 1. Accepts a .stp or .step file
 * 2. Converts it to GLTF using Zoo API
 * 3. Uploads both files to R2
 * 4. Creates File records and updates Part with references
 */
export async function addStepFileWithGltfConversion({
  partId,
  stepFile
}: {
  partId: string;
  stepFile: File;
}): Promise<{
  success: boolean;
  data?: {
    cadFile: Prisma.FileCreateInput;
    gltfFile: Prisma.FileCreateInput;
    updatedPart: Part;
  };
  error?: string;
}> {
  try {
    // Validate input file is a STEP file
    const isValidStepFile =
      stepFile.name.toLowerCase().endsWith('.step') ||
      stepFile.name.toLowerCase().endsWith('.stp');

    if (!isValidStepFile) {
      return {
        success: false,
        error: 'Invalid file type. Please provide a STEP (.step or .stp) file.'
      };
    }

    // Verify part exists
    const existingPart = await prisma.part.findUnique({
      where: { id: partId }
    });

    if (!existingPart) {
      return {
        success: false,
        error: 'Part not found'
      };
    }

    // Convert STEP file to GLTF using Zoo API
    const conversionResult = await convertStepFileToGltf(stepFile);

    if (
      !conversionResult.success ||
      !conversionResult.data ||
      !conversionResult.fileName
    ) {
      return {
        success: false,
        error: `STEP to GLTF conversion failed: ${conversionResult.error}`
      };
    }

    // Upload original STEP file to R2
    const stepFileUpload = await getUploadUrl(
      stepFile.name,
      stepFile.type || 'application/octet-stream',
      'parts/cad'
    );

    const stepUploadResponse = await fetch(stepFileUpload.url, {
      method: 'PUT',
      body: stepFile,
      headers: {
        'Content-Type': stepFile.type || 'application/octet-stream'
      }
    });

    if (!stepUploadResponse.ok) {
      return {
        success: false,
        error: 'Failed to upload STEP file to storage'
      };
    }

    // Upload converted GLTF file to R2
    const gltfFileUpload = await getUploadUrl(
      conversionResult.fileName,
      'model/gltf+json',
      'parts/gltf'
    );

    const gltfUploadResponse = await fetch(gltfFileUpload.url, {
      method: 'PUT',
      body: conversionResult.data,
      headers: {
        'Content-Type': 'model/gltf+json'
      }
    });

    if (!gltfUploadResponse.ok) {
      return {
        success: false,
        error: 'Failed to upload GLTF file to storage'
      };
    }

    // Create file records in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create STEP file record
      const cadFileRecord = await tx.file.create({
        data: {
          url: stepFileUpload.publicUrl,
          key: stepFileUpload.key,
          name: stepFile.name,
          type: stepFile.type || 'application/octet-stream',
          size: stepFile.size,
          partId
        }
      });

      // Create GLTF file record
      const gltfFileRecord = await tx.file.create({
        data: {
          url: gltfFileUpload.publicUrl,
          key: gltfFileUpload.key,
          name: conversionResult.fileName!,
          type: 'model/gltf+json',
          size: conversionResult.data!.length,
          partId
        }
      });

      return {
        cadFile: cadFileRecord,
        gltfFile: gltfFileRecord
      };
    });

    // Update part with CAD and GLTF file references outside transaction
    const updatedPart = await prisma.part.update({
      where: { id: partId },
      data: {
        // @ts-ignore - cadFileId and gltfFileId exist in schema but types may be outdated
        cadFileId: result.cadFile.id,
        // @ts-ignore - cadFileId and gltfFileId exist in schema but types may be outdated
        gltfFileId: result.gltfFile.id
      }
    });

    // Revalidate the part page
    revalidatePath(`/parts/library/${partId}`);

    return {
      success: true,
      data: {
        cadFile: result.cadFile,
        gltfFile: result.gltfFile,
        updatedPart
      }
    };
  } catch (error) {
    console.error('Error adding STEP file with GLTF conversion:', error);

    let errorMessage = 'Failed to process STEP file';
    if (error instanceof Error) {
      errorMessage = `${errorMessage}: ${error.message}`;
    }

    return {
      success: false,
      error: errorMessage
    };
  }
}
