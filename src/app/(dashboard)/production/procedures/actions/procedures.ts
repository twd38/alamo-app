'use server';

import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { Prisma, InstructionStatus, ActionType } from '@prisma/client';

const procedureSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  status: z.nativeEnum(InstructionStatus).optional().default('DRAFT'),
});

const procedureStepSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  instructions: z.string(),
  estimatedTime: z.coerce.number().min(0, 'Time must be positive'),
  requiredTools: z.array(z.string()).optional().default([]),
  safetyNotes: z.string().optional().nullable(),
  qualityChecks: z.array(z.string()).optional().default([]),
});

export interface GetProceduresParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: InstructionStatus;
}

export async function getProcedures(params: GetProceduresParams = {}) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const {
    page = 1,
    pageSize = 10,
    search = '',
    sortBy = 'createdAt',
    sortOrder = 'desc',
    status
  } = params;

  const where: Prisma.ProcedureWhereInput = {};

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (status) {
    where.status = status;
  }

  const orderBy: any = {};
  if (sortBy) {
    orderBy[sortBy] = sortOrder;
  }

  const [procedures, total] = await Promise.all([
    prisma.procedure.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        operations: {
          include: {
            workCenter: true,
          },
        },
        steps: {
          include: {
            actions: true,
            files: true,
          },
          orderBy: {
            stepNumber: 'asc',
          },
        },
      },
    }),
    prisma.procedure.count({ where }),
  ]);

  return {
    data: procedures,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getProcedureById(id: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const procedure = await prisma.procedure.findUnique({
    where: { id },
    include: {
      operations: {
        include: {
          workCenter: true,
        },
      },
      steps: {
        include: {
          actions: true,
          files: true,
        },
        orderBy: {
          stepNumber: 'asc',
        },
      },
    },
  });

  return procedure;
}

export async function createProcedure(data: z.infer<typeof procedureSchema>) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const validatedData = procedureSchema.parse(data);

  // Check if code is unique
  const existing = await prisma.procedure.findUnique({
    where: { code: validatedData.code },
  });

  if (existing) {
    throw new Error('Procedure code already exists');
  }

  const procedure = await prisma.procedure.create({
    data: {
      ...validatedData,
      version: 1,
    },
    include: {
      operations: {
        include: {
          workCenter: true,
        },
      },
      steps: {
        include: {
          actions: true,
          files: true,
        },
      },
    },
  });

  revalidatePath('/production/procedures');
  return procedure;
}

export async function updateProcedure(
  id: string,
  data: Partial<z.infer<typeof procedureSchema>>
) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  // Check if procedure exists
  const existing = await prisma.procedure.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error('Procedure not found');
  }

  const procedure = await prisma.procedure.update({
    where: { id },
    data,
    include: {
      operations: {
        include: {
          workCenter: true,
        },
      },
      steps: {
        include: {
          actions: true,
          files: true,
        },
      },
    },
  });

  revalidatePath('/production/procedures');
  return procedure;
}

export async function deleteProcedure(id: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  // Check if procedure exists
  const existing = await prisma.procedure.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error('Procedure not found');
  }

  await prisma.procedure.delete({
    where: { id },
  });

  revalidatePath('/production/procedures');
  return { success: true };
}

// Procedure Step Actions
export async function createProcedureStep(
  procedureId: string,
  data?: Partial<z.infer<typeof procedureStepSchema>>
) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  // Get the next step number
  const existingSteps = await prisma.procedureStep.findMany({
    where: { procedureId },
    orderBy: { stepNumber: 'desc' },
    take: 1,
  });

  const nextStepNumber = existingSteps.length > 0 
    ? existingSteps[0].stepNumber + 1 
    : 1;

  const step = await prisma.procedureStep.create({
    data: {
      procedureId,
      stepNumber: nextStepNumber,
      title: data?.title || `Step ${nextStepNumber}`,
      instructions: data?.instructions || '{"type": "doc", "content": []}',
      estimatedTime: data?.estimatedTime || 15,
      requiredTools: data?.requiredTools || [],
      safetyNotes: data?.safetyNotes || null,
      qualityChecks: data?.qualityChecks || [],
    },
    include: {
      actions: true,
      files: true,
    },
  });

  revalidatePath('/production/procedures');
  return step;
}

export async function updateProcedureStep(
  stepId: string,
  data: Partial<z.infer<typeof procedureStepSchema> & { actions?: any[] }>
) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  // If actions are provided, handle them separately
  if (data.actions) {
    const { actions, ...stepData } = data;
    
    // Delete existing actions
    await prisma.procedureStepAction.deleteMany({
      where: { stepId },
    });

    // Create new actions
    if (actions.length > 0) {
      await prisma.procedureStepAction.createMany({
        data: actions.map(action => ({
          stepId,
          description: action.description,
          notes: action.notes,
          isRequired: action.isRequired,
          signoffRoles: action.signoffRoles || [],
          targetValue: action.targetValue,
          tolerance: action.tolerance,
          unit: action.unit,
          actionType: action.actionType,
        })),
      });
    }

    // Update the step without actions
    const step = await prisma.procedureStep.update({
      where: { id: stepId },
      data: stepData,
      include: {
        actions: true,
        files: true,
      },
    });

    revalidatePath('/production/procedures');
    return step;
  }

  // Regular update without actions
  const { actions, ...stepData } = data as any;
  const step = await prisma.procedureStep.update({
    where: { id: stepId },
    data: stepData,
    include: {
      actions: true,
      files: true,
    },
  });

  revalidatePath('/production/procedures');
  return step;
}

export async function deleteProcedureStep(stepId: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const step = await prisma.procedureStep.findUnique({
    where: { id: stepId },
    select: { procedureId: true, stepNumber: true },
  });

  if (!step) {
    throw new Error('Step not found');
  }

  // Delete the step
  await prisma.procedureStep.delete({
    where: { id: stepId },
  });

  // Reorder remaining steps
  await prisma.procedureStep.updateMany({
    where: {
      procedureId: step.procedureId,
      stepNumber: { gt: step.stepNumber },
    },
    data: {
      stepNumber: { decrement: 1 },
    },
  });

  revalidatePath('/production/procedures');
}

export async function reorderProcedureSteps(
  procedureId: string,
  stepIds: string[]
) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  // Update step numbers based on the new order
  const updates = stepIds.map((stepId, index) =>
    prisma.procedureStep.update({
      where: { id: stepId },
      data: { stepNumber: index + 1 },
    })
  );

  await prisma.$transaction(updates);
  revalidatePath('/production/procedures');
}

export async function addFilesToProcedureStep(
  stepId: string,
  files: Prisma.FileCreateInput[]
) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  await prisma.file.createMany({
    data: files.map(file => ({
      ...file,
      procedureStepId: stepId,
    })),
  });

  revalidatePath('/production/procedures');
}

export async function deleteFilesFromProcedureStep(
  stepId: string,
  fileIds: string[]
) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  await prisma.file.deleteMany({
    where: {
      id: { in: fileIds },
      procedureStepId: stepId,
    },
  });

  revalidatePath('/production/procedures');
}

// Get all operations for dropdown
export async function getOperationsForSelect() {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const operations = await prisma.operation.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      code: true,
      name: true,
      procedureId: true,
      workCenter: {
        select: {
          id: true,
          name: true,
        },
      },
      procedure: {
        select: {
          id: true,
          code: true,
          title: true,
        },
      },
    },
  });

  return operations;
}

// Assign a procedure to an operation
export async function assignProcedureToOperation(
  operationId: string,
  procedureId: string | null
) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const operation = await prisma.operation.update({
    where: { id: operationId },
    data: {
      procedureId,
    },
    include: {
      procedure: true,
      workCenter: true,
    },
  });

  revalidatePath('/production/operations');
  revalidatePath('/production/procedures');
  return operation;
}

// Get all procedures for dropdown selection
export async function getProceduresForSelect() {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const procedures = await prisma.procedure.findMany({
    where: { status: 'APPROVED' },
    orderBy: { title: 'asc' },
    select: {
      id: true,
      code: true,
      title: true,
      description: true,
      operations: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
    },
  });

  return procedures;
}