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
  TaskTag
} from '@prisma/client';
import {
  deleteFileFromR2,
  getSignedDownloadUrl,
  getUploadUrl,
  getSignedDownloadUrlFromPublicUrl,
  getKeyFromPublicUrl
} from '@/lib/r2';
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
import { notify } from './notification-service';
import { convertStepFileToGltf } from './cad-actions';

const appUrl = process.env.NEXT_PUBLIC_APP_URL;

export async function updateDataAndRevalidate(path: string) {
  revalidatePath(path); // Revalidate the specific path
  return { message: 'Data updated and cache revalidated' };
}

export async function getKanbanSections(boardId?: string) {
  const kanbanSections = await prisma.kanbanSection.findMany({
    where: {
      deletedOn: null,
      boardId: boardId
    },
    include: {
      tasks: {
        where: {
          deletedOn: null
        },
        include: {
          assignees: true,
          createdBy: true,
          files: true
        },
        orderBy: {
          taskOrder: 'asc'
        }
      }
    },
    orderBy: {
      kanbanOrder: 'asc'
    }
  });

  console.log(
    'Retrieved workstations:',
    kanbanSections.map((w) => ({
      id: w.id,
      name: w.name,
      taskCount: w.tasks?.length || 0,
      taskOrders: w.tasks?.map((t) => t.taskOrder) || []
    }))
  );

  return kanbanSections;
}

export async function createKanbanSection(name: string, boardId: string) {
  const result = await prisma.kanbanSection.create({
    data: {
      name,
      kanbanOrder: 0,
      boardId
    }
  });
  revalidatePath('/production');
  return { success: true, data: result };
}

export async function updateKanbanSectionTasks({
  id,
  tasks
}: {
  id: string;
  tasks: Task[];
}) {
  try {
    const result = await prisma.kanbanSection.update({
      where: { id },
      data: { tasks: { connect: tasks.map((task) => ({ id: task.id })) } }
    });

    revalidatePath('/production');
    return { success: true, data: result };
  } catch (error) {
    console.error('Error updating workstation:', error);
    return { success: false, error: 'Failed to update workstation' };
  }
}

export async function updateKanbanSectionKanbanOrder(
  id: string,
  kanbanOrder: number
) {
  await prisma.kanbanSection.update({
    where: { id },
    data: { kanbanOrder }
  });
  revalidatePath('/production');
}

export async function deleteKanbanSection(id: string) {
  await prisma.kanbanSection.update({
    where: { id },
    data: { deletedOn: new Date() }
  });
  revalidatePath('/production');
}

export async function updateKanbanSection(id: string, data: { name: string }) {
  try {
    const result = await prisma.kanbanSection.update({
      where: { id },
      data: { name: data.name }
    });

    revalidatePath('/production');
    return { success: true, data: result };
  } catch (error) {
    console.error('Error updating kanban section:', error);
    return { success: false, error: 'Failed to update kanban section' };
  }
}

export async function updateMissionMessage(id: string | null, content: string) {
  if (content === null) {
    return;
  }

  if (id === null) {
    return await prisma.missionMessage.create({
      data: {
        content
      }
    });
  }

  return await prisma.missionMessage.update({
    where: { id },
    data: { content }
  });
}

export async function createTask(data: {
  name: string;
  taskNumber: string;
  status: string;
  priority: number;
  dueDate: Date;
  description: string;
  createdById: string;
  assignees: string[];
  kanbanSectionId: string;
  boardId: string;
  taskOrder: number;
  files?: File[];
  tags?: string[];
  private?: boolean;
  epicId?: string;
}) {
  try {
    const session = await auth();
    const userId = session?.user?.id || 'cm78gevrb0004kxxg43qs0mqv';

    // Handle file uploads if present
    const fileData: Prisma.FileCreateInput[] = [];
    if (data.files && data.files.length > 0) {
      for (const file of data.files) {
        const { key, publicUrl } = await getUploadUrl(
          file.name,
          file.type,
          'tasks'
        );
        fileData.push({
          url: publicUrl,
          key,
          name: file.name,
          type: file.type,
          size: file.size
        });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // Move all existing tasks in the same Kanban section down by one position
      await tx.task.updateMany({
        where: {
          kanbanSectionId: data.kanbanSectionId,
          deletedOn: null
        },
        data: {
          taskOrder: {
            increment: 1
          }
        }
      });

      // Insert the new task at the beginning (taskOrder = 0)
      const newTask = await tx.task.create({
        data: {
          name: data.name,
          taskNumber: data.taskNumber,
          priority: data.priority,
          dueDate: data.dueDate,
          description: data.description,
          createdById: userId,
          assignees: {
            connect: data.assignees.map((assigneeId) => ({ id: assigneeId }))
          },
          kanbanSectionId: data.kanbanSectionId,
          boardId: data.boardId,
          taskOrder: 0,
          files: {
            create: fileData
          },
          tags: {
            connect: data.tags?.map((tag) => ({ id: tag })) || []
          },
          private: data.private ?? false,
          epicId: data.epicId
        },
        include: {
          assignees: true,
          files: true
        }
      });

      return newTask;
    });

    // Revalidate production board so UI reflects the new task order immediately
    revalidatePath('/production');

    return { success: true, data: result };
  } catch (error) {
    console.error('Error creating task:', error);
    return { success: false, error: 'Failed to create task' };
  }
}

export async function moveTask(
  taskId: string,
  targetWorkStationId: string,
  newOrder: number
) {
  try {
    console.log(
      `Moving task ${taskId} to workstation ${targetWorkStationId} with order ${newOrder}`
    );

    await prisma.$transaction(async (tx) => {
      // Get all tasks in the target workstation
      const targetTasks = await tx.task.findMany({
        where: {
          kanbanSectionId: targetWorkStationId,
          deletedOn: null,
          id: { not: taskId }
        },
        orderBy: {
          taskOrder: 'asc'
        }
      });

      // Insert the tasks at their new positions
      const updatedTasks = [
        ...targetTasks.slice(0, newOrder),
        { id: taskId },
        ...targetTasks.slice(newOrder)
      ];

      // Update all tasks with their new order
      await Promise.all(
        updatedTasks.map((task, index) =>
          tx.task.update({
            where: { id: task.id },
            data: {
              kanbanSectionId: targetWorkStationId,
              taskOrder: index
            }
          })
        )
      );
    });

    console.log('Task moved successfully');
    revalidatePath('/production');
    return { success: true };
  } catch (error) {
    console.error('Error moving task:', error);
    return { success: false, error: 'Failed to move task' };
  }
}

export async function reorderTasks(workstationId: string, taskIds: string[]) {
  try {
    console.log(`Reordering tasks in workstation ${workstationId}:`, taskIds);

    // Update each task's order
    const updates = await Promise.all(
      taskIds.map((taskId, index) => {
        console.log(`Setting task ${taskId} to order ${index}`);
        return prisma.task.update({
          where: { id: taskId },
          data: { taskOrder: index }
        });
      })
    );

    console.log('Tasks reordered successfully:', updates);
    revalidatePath('/production');
    return { success: true };
  } catch (error) {
    console.error('Error reordering tasks:', error);
    return { success: false, error: 'Failed to reorder tasks' };
  }
}

export async function deleteTask(taskId: string) {
  try {
    const result = await prisma.task.update({
      where: { id: taskId },
      data: {
        deletedOn: new Date(),
        kanbanSectionId: null
      }
    });

    revalidatePath('/production');
    return { success: true, data: result };
  } catch (error) {
    console.error('Error deleting task:', error);
    return { success: false, error: 'Failed to delete task' };
  }
}

export async function duplicateTask(taskId: string) {
  try {
    // Get the original task with its relationships
    const originalTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignees: true,
        files: true
      }
    });

    if (!originalTask) {
      throw new Error('Task not found');
    }

    // Create a new task with the same data
    const duplicatedTask = await prisma.task.create({
      data: {
        name: `${originalTask.name} (Copy)`,
        taskNumber: `${originalTask.taskNumber}`,
        priority: originalTask.priority,
        dueDate: originalTask.dueDate,
        description: originalTask.description,
        createdById: originalTask.createdById,
        kanbanSectionId: originalTask.kanbanSectionId,
        taskOrder: originalTask.taskOrder + 1,
        epicId: originalTask.epicId,
        assignees: {
          connect: originalTask.assignees.map((assignee) => ({
            id: assignee.id
          }))
        },
        files: {
          create: originalTask.files.map((file) => ({
            url: file.url,
            name: file.name,
            type: file.type,
            size: file.size,
            taskId: taskId
          }))
        }
      },
      include: {
        assignees: true,
        files: true
      }
    });

    revalidatePath('/production');
    return { success: true, data: duplicatedTask };
  } catch (error) {
    console.error('Error duplicating task:', error);
    return { success: false, error: 'Failed to duplicate task' };
  }
}

export async function updateTask(
  taskId: string,
  data: {
    name?: string;
    taskNumber?: string;
    status?: string;
    priority?: number;
    dueDate?: Date | undefined;
    description?: string;
    assignees?: string[];
    kanbanSectionId?: string;
    boardId?: string;
    taskOrder?: number;
    files?: (
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
    )[];
    tags?: string[];
    private?: boolean;
    epicId?: string;
  }
) {
  console.log('Updating task', taskId, data);
  try {
    const session = await auth();
    const actorUserId = session?.user?.id;

    // Get existing task with its relationships
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: { files: true, assignees: true }
    });

    if (!existingTask) {
      throw new Error('Task not found');
    }

    // Prepare update data object
    const updateData: Prisma.TaskUpdateInput = {};

    // Only update fields that are provided
    if (data.name !== undefined) updateData.name = data.name;
    if (data.taskNumber !== undefined) updateData.taskNumber = data.taskNumber;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.epicId !== undefined)
      updateData.epic = { connect: { id: data.epicId } };
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.kanbanSectionId !== undefined)
      updateData.kanbanSection = { connect: { id: data.kanbanSectionId } };
    if (data.boardId !== undefined)
      updateData.board = { connect: { id: data.boardId } };
    if (data.private !== undefined) updateData.private = data.private;
    if (data.taskOrder !== undefined) updateData.taskOrder = data.taskOrder;

    // Handle assignees if provided
    if (data.assignees !== undefined) {
      updateData.assignees = {
        set: data.assignees.map((userId) => ({ id: userId }))
      };
    }

    // Handle tags if provided
    if (data.tags !== undefined) {
      updateData.tags = {
        set: data.tags.map((tag) => ({ id: tag }))
      };
    }

    // Handle file updates if provided
    if (data.files !== undefined) {
      const existingFiles = existingTask.files;
      const newFiles = data.files;

      // Identify files to delete (files that exist but are not in the new list)
      const filesToDelete = existingFiles.filter(
        (existingFile: { id: string; url: string }) =>
          !newFiles.some(
            (
              newFile:
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
            ) =>
              !isFileInstance(newFile) &&
              'id' in newFile &&
              newFile.id === existingFile.id
          )
      );

      // Delete removed files from R2 and database
      for (const file of filesToDelete) {
        try {
          const key = file.key || getKeyFromPublicUrl(file.url);
          if (key) {
            await deleteFileFromR2(key);
          }
        } catch (error) {
          console.error('Failed to delete file:', error);
        }
      }

      // Upload new files
      const fileData = [];
      for (const file of newFiles) {
        if (isFileInstance(file)) {
          // Handle new file upload
          const {
            url: presignedUrl,
            key,
            publicUrl
          } = await getUploadUrl(file.name, file.type, 'tasks');

          // Upload file to R2 with fetch
          const upload = await fetch(presignedUrl, {
            method: 'PUT',
            body: file,
            headers: {
              'Content-Type': file.type
            }
          });

          if (!upload.ok) {
            throw new Error(`Failed to upload ${file.name}`);
          }

          fileData.push({
            url: publicUrl,
            key,
            name: file.name,
            type: file.type,
            size: file.size
          });
        }
      }

      updateData.files = {
        deleteMany: {
          id: {
            in: filesToDelete.map((f) => f.id)
          }
        },
        create: fileData,
        // Keep existing files that weren't deleted
        connect: newFiles
          .filter((f) => !isFileInstance(f) && 'id' in f)
          .map((f) => ({ id: (f as any).id }))
      };
    }

    // Update task with provided data
    const result = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        assignees: true,
        files: true
      }
    });

    // --------------------------------------------------
    // Notify users who have been newly assigned
    // --------------------------------------------------
    if (data.assignees !== undefined) {
      const previousIds = existingTask.assignees.map((a) => a.id);
      const addedIds = data.assignees.filter((id) => !previousIds.includes(id));

      // console.log("addedIds", addedIds)
      // console.log("previousIds", previousIds)

      if (addedIds.length > 0) {
        let actorName: string | undefined;
        if (actorUserId) {
          const actor = await prisma.user.findUnique({
            where: { id: actorUserId },
            select: { name: true }
          });
          actorName = actor?.name ?? undefined;
        }

        const message = `${actorName ?? 'Someone'} assigned you to task <${appUrl}/board/${result.boardId}?taskId=${result.id}|${result.name}>.`;
        await notify({
          recipientIds: addedIds,
          message: message
        });
      }
    }

    return { success: true, data: result };
  } catch (error: any) {
    console.error('Error updating task:', error.stack);
    return { success: false, error: 'Failed to update task' };
  }
}

export async function createTag({
  name,
  color,
  boardId
}: {
  name: string;
  color: Color;
  boardId: string;
}) {
  const result = await prisma.taskTag.create({
    data: {
      name,
      color,
      boardId
    }
  });
  return { success: true, data: result };
}

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

export async function getFileUrlFromKey(key: string, fileName?: string) {
  try {
    const presignedUrl = await getSignedDownloadUrl(key, fileName);

    return { success: true, url: presignedUrl };
  } catch (error) {
    console.error('Error getting file download URL:', error);
    return { success: false, error: 'Failed to get file download URL' };
  }
}

export async function getFileUrlFromUnsignedUrl(url: string) {
  try {
    const presignedUrl = await getSignedDownloadUrlFromPublicUrl(url);
    return { success: true, url: presignedUrl };
  } catch (error) {
    console.error('Error getting signed URL:', error);
    return { success: false, error: 'Failed to get signed URL' };
  }
}

/**
 * Upload a file to Cloudflare R2 and save it to the database
 * This is a reusable server action that can be used across the application
 */
export async function uploadFileToR2AndDatabase(
  file: File,
  path: string,
  relationData?: {
    partId?: string;
    taskId?: string;
    workOrderId?: string;
    commentId?: string;
    instructionId?: string;
    stepId?: string;
  }
): Promise<{
  success: boolean;
  data?: {
    id: string;
    url: string;
    key: string;
    name: string;
    type: string;
    size: number;
  };
  error?: string;
}> {
  try {
    // Upload file to R2
    const {
      url: presignedUrl,
      key,
      publicUrl
    } = await getUploadUrl(file.name, file.type, path);

    const uploadResponse = await fetch(presignedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type
      }
    });

    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload file: ${uploadResponse.statusText}`);
    }

    // Save file record to database
    const fileRecord = await prisma.file.create({
      data: {
        url: publicUrl,
        key,
        name: file.name,
        type: file.type,
        size: file.size,
        ...relationData
      }
    });

    return {
      success: true,
      data: {
        id: fileRecord.id,
        url: fileRecord.url,
        key: fileRecord.key,
        name: fileRecord.name,
        type: fileRecord.type,
        size: fileRecord.size
      }
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload file'
    };
  }
}

export async function getPresignedUploadUrl(
  fileName: string,
  contentType: string,
  path: string
) {
  try {
    const { url, key } = await getUploadUrl(fileName, contentType, path);
    return { success: true, url, key };
  } catch (error) {
    console.error('Error getting upload URL:', error);
    return { success: false, error: 'Failed to get upload URL' };
  }
}

// @deprecated This function should not be used - use getUploadUrl instead
export async function getFileUrl(path: string, fileName: string) {
  console.warn('getFileUrl is deprecated - use getUploadUrl instead');
  const key = `${path}/${fileName}`;
  return `${process.env.R2_PUBLIC_URL}/${key}`;
}

// @deprecated Use getUploadUrl for client-side uploads
export async function uploadFile(file: File, path: string) {
  console.warn(
    'uploadFile is deprecated - use getUploadUrl for client-side uploads'
  );
  const {
    url: presignedUrl,
    key,
    publicUrl
  } = await getUploadUrl(file.name, file.type, path);

  const upload = await fetch(presignedUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type
    }
  });

  if (!upload.ok) {
    throw new Error('Failed to upload file');
  }

  return { success: true, url: publicUrl, key };
}

export async function createPart({
  name,
  partNumber,
  partRevision = 'A',
  description,
  unit,
  trackingType,
  partType,
  partImageId,
  fileIds,
  bomParts = [] // Default to empty array to avoid null
}: {
  name: string;
  partNumber?: string;
  partRevision?: Part['partRevision'];
  description: Part['description'];
  unit: Part['unit'];
  trackingType: Part['trackingType'];
  partType: PartType;
  partImageId?: string;
  fileIds?: string[];
  bomParts:
    | {
        id: string;
        part: Part;
        qty: number;
        bomType: BOMType;
      }[]
    | [];
  nxFilePath?: string;
}) {
  try {
    // Ensure bomParts is an array
    if (!bomParts || !Array.isArray(bomParts)) {
      bomParts = [];
    }

    // Validate file IDs exist if provided
    if (fileIds && fileIds.length > 0) {
      const existingFiles = await prisma.file.findMany({
        where: { id: { in: fileIds } },
        select: { id: true }
      });

      const foundFileIds = existingFiles.map((f) => f.id);
      const invalidFileIds = fileIds.filter((id) => !foundFileIds.includes(id));

      if (invalidFileIds.length > 0) {
        throw new Error(`Invalid file IDs: ${invalidFileIds.join(', ')}`);
      }
    }

    // Create the part cat if not provided
    const componentPartTypes: PartType[] = [];
    for (const bomPart of bomParts) {
      if (bomPart.part.partType) {
        componentPartTypes.push(bomPart.part.partType);
      }
    }

    // Use a transaction for all database operations to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Create the part first
      const newPart = await tx.part.create({
        data: {
          name,
          partNumber: partNumber || generateNewPartNumberSimpleSix(),
          partRevision,
          description,
          unit,
          trackingType,
          partType,
          partImageId
        }
      });

      // Link existing files to the part if they exist
      if (fileIds && fileIds.length > 0) {
        await tx.file.updateMany({
          where: { id: { in: fileIds } },
          data: { partId: newPart.id }
        });
      }

      // Create BOM parts one by one
      for (const bomPart of bomParts) {
        await tx.bOMPart.create({
          data: {
            parentPartId: newPart.id,
            partId: bomPart.part.id,
            qty: bomPart.qty,
            bomType: bomPart.bomType
          }
        });
      }

      return newPart;
    });

    return { success: true, data: result };
  } catch (error: any) {
    console.error('Error creating part:', error.stack);

    let errorMessage = 'Failed to create part';
    if (error instanceof Error) {
      errorMessage = `${errorMessage}: ${error.stack}`;
    }

    return { success: false, error: errorMessage };
  }
}

export async function updatePart({
  id,
  partNumber,
  description,
  unit,
  trackingType,
  partImage,
  files,
  bomParts = [],
  isRawMaterial,
  apsUrn
}: {
  id: string;
  partNumber?: string;
  description?: Part['description'];
  unit?: Part['unit'];
  trackingType?: Part['trackingType'];
  partImage?: File;
  files?: File[];
  isRawMaterial?: boolean;
  apsUrn?: string;
  bomParts?: {
    id: string;
    part: Part;
    qty: number;
    bomType: BOMType;
  }[];
}) {
  try {
    // Get existing part with its relationships
    const existingPart = await prisma.part.findUnique({
      where: { id },
      include: {
        files: true,
        bomParts: {
          include: {
            part: true
          }
        }
      }
    });

    if (!existingPart) {
      throw new Error('Part not found');
    }

    // Prepare update data object
    const updateData: Prisma.PartUpdateInput = {};

    // Only update fields that are provided
    if (partNumber !== undefined) updateData.partNumber = partNumber;
    if (description !== undefined) updateData.description = description;
    if (unit !== undefined) updateData.unit = unit;
    if (trackingType !== undefined) updateData.trackingType = trackingType;
    if (apsUrn !== undefined) updateData.apsUrn = apsUrn;

    // Handle part image upload if it exists and is a File object
    if (partImage && partImage instanceof File) {
      const {
        url: presignedUrl,
        key,
        publicUrl
      } = await getUploadUrl(partImage.name, partImage.type, 'parts');

      const upload = await fetch(presignedUrl, {
        method: 'PUT',
        body: partImage,
        headers: {
          'Content-Type': partImage.type
        }
      });

      if (upload.ok) {
        // Create a new file record for the part image
        const imageFile = await prisma.file.create({
          data: {
            url: publicUrl,
            key,
            name: partImage.name,
            type: partImage.type,
            size: partImage.size
          }
        });

        updateData.partImage = {
          connect: { id: imageFile.id }
        };

        // Delete old part image if it exists
        if (existingPart.partImageId) {
          const oldImage = await prisma.file.findUnique({
            where: { id: existingPart.partImageId }
          });
          if (oldImage) {
            try {
              const oldKey = oldImage.key || getKeyFromPublicUrl(oldImage.url);
              if (oldKey) {
                await deleteFileFromR2(oldKey);
              }
            } catch (error) {
              console.error('Failed to delete old image:', error);
            }
            await prisma.file.delete({
              where: { id: existingPart.partImageId }
            });
          }
        }
      }
    }

    // Handle file updates if provided
    if (files !== undefined) {
      const existingFiles = existingPart.files;
      const newFiles = files;

      // Identify files to delete (files that exist but are not in the new list)
      const filesToDelete = existingFiles.filter(
        (existingFile: { id: string; url: string }) =>
          !newFiles.some(
            (
              newFile:
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
            ) =>
              !isFileInstance(newFile) &&
              'id' in newFile &&
              newFile.id === existingFile.id
          )
      );

      // Delete removed files from R2 and database
      for (const file of filesToDelete) {
        try {
          const key = file.key || getKeyFromPublicUrl(file.url);
          if (key) {
            await deleteFileFromR2(key);
          }
        } catch (error) {
          console.error('Failed to delete file:', error);
        }
      }

      // Upload new files
      const fileData = [];
      for (const file of newFiles) {
        if (isFileInstance(file)) {
          const {
            url: presignedUrl,
            key,
            publicUrl
          } = await getUploadUrl(file.name, file.type, 'parts');

          const upload = await fetch(presignedUrl, {
            method: 'PUT',
            body: file,
            headers: {
              'Content-Type': file.type
            }
          });

          if (upload.ok) {
            fileData.push({
              url: publicUrl,
              key,
              name: file.name,
              type: file.type,
              size: file.size
            });
          }
        }
      }

      updateData.files = {
        deleteMany: {
          id: {
            in: filesToDelete.map((f: { id: string }) => f.id)
          }
        },
        create: fileData,
        // Keep existing files that weren't deleted
        connect: newFiles
          .filter((f) => !isFileInstance(f) && 'id' in f)
          .map((f) => ({ id: (f as { id: string }).id }))
      };
    }

    // Handle BOM parts updates if provided
    if (bomParts !== undefined) {
      // Delete existing BOM parts
      await prisma.bOMPart.deleteMany({
        where: { parentPartId: id }
      });

      // Create new BOM parts
      updateData.bomParts = {
        create: bomParts.map((bomPart) => ({
          partId: bomPart.part.id,
          qty: bomPart.qty,
          bomType: bomPart.bomType
        }))
      };
    }

    // Update part with provided data
    const result = await prisma.part.update({
      where: { id },
      data: updateData,
      include: {
        files: true,
        bomParts: {
          include: {
            part: true
          }
        }
      }
    });

    return { success: true, data: result };
  } catch (error: any) {
    console.error('Error updating part:', error.stack);

    let errorMessage = 'Failed to update part';
    if (error instanceof Error) {
      errorMessage = `${errorMessage}: ${error.stack}`;
    }

    return { success: false, error: errorMessage };
  }
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
  console.log(partId, title, description, steps, instructionNumber);
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
    console.log(error.stack);
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
  estimatedLabourTime
}: {
  stepId: string;
  title: string;
  instructions: string;
  estimatedLabourTime: number;
}) {
  try {
    const result = await prisma.workInstructionStep.update({
      where: { id: stepId },
      data: {
        title,
        instructions,
        estimatedLabourTime
      }
    });
    return { success: true, data: result };
  } catch (error) {
    console.error('Error updating work instruction step:', error);
    return { success: false, error: 'Failed to update work instruction step' };
  }
}

export async function createWorkInstructionStepAction(
  data: Prisma.WorkInstructionStepActionCreateWithoutStepInput & {
    stepId: string;
  }
) {
  console.log(data);
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
  estimatedLabourTime
}: {
  stepId: string;
  title: string;
  instructions: string;
  estimatedLabourTime: number;
}) {
  try {
    const result = await prisma.workOrderWorkInstructionStep.update({
      where: { id: stepId },
      data: {
        title,
        instructions,
        estimatedLabourTime
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
  estimatedLabourTime
}: {
  workOrderInstructionId: string;
  stepNumber: number;
  title: string;
  instructions: string;
  estimatedLabourTime: number;
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
        activeWorkers: 0
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
    console.log(boardViewId, data);
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
  notes = ''
}: {
  partId: string;
  partQty: number;
  operation: string;
  status?: WorkOrderStatus;
  timeEstimate?: string;
  dueDate?: Date;
  assigneeIds?: string[];
  notes?: string;
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
                  actions: true
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
            }
          };

          const workOrder = await tx.workOrder.create({
            data: workOrderData,
            include: {
              assignees: true
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
                      activeWorkers: 0
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
                workOrderId: workOrderId
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
  console.log('Reordering work instruction steps', workInstructionId, stepIds);

  try {
    // Use a transaction to ensure all updates are atomic
    const updates = await prisma.$transaction(
      stepIds.map((stepId, index) => {
        console.log('Updating step', stepId, index);
        console.log('Step number', index + 1);

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

    console.log(`Processing STEP file ${stepFile.name} for part ${partId}`);

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
          partId: partId
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
          partId: partId
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

    console.log(`Successfully processed STEP file for part ${partId}:`, {
      cadFileId: result.cadFile.id,
      gltfFileId: result.gltfFile.id
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
