'use server';

import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getUploadUrl, deleteFileFromR2 } from '@/lib/server/r2';
import { Prisma, File as PrismaFile } from '@prisma/client';
import { getKeyFromPublicUrl } from '@/lib/server/r2';
import { notify } from '@/lib/server/notification-service';
import { revalidatePath } from 'next/cache';
const appUrl = process.env.NEXT_PUBLIC_APP_URL;

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
    files?: Prisma.FileCreateInput[] | PrismaFile[];
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
          !newFiles.some((newFile) => newFile.id === existingFile.id)
      );

      // Delete removed files from R2 and database
      for (const file of filesToDelete) {
        try {
          await deleteFileFromR2(file.key);
        } catch (error) {
          console.error('Failed to delete file:', error);
        }
      }

      // Separate existing files from truly new files (those without an id)
      const existingFilesToKeep = newFiles.filter((file) => file.id);
      const genuinelyNewFiles = newFiles.filter((file) => !file.id);

      // Create file data only for genuinely new files
      const fileData: Prisma.FileCreateInput[] = [];
      for (const file of genuinelyNewFiles) {
        // Only include fields that are valid for FileCreateInput
        fileData.push({
          url: file.url,
          name: file.name,
          size: file.size,
          type: file.type,
          key: file.key || ''
          // Don't include workOrderId or other relation fields - let Prisma handle relations
        });
      }

      updateData.files = {
        deleteMany: {
          id: {
            in: filesToDelete.map((f) => f.id)
          }
        },
        create: fileData,
        // Keep existing files that weren't deleted
        connect: existingFilesToKeep.map((f) => ({ id: f.id }))
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

    // Revalidate the board page to reflect changes
    console.log('revalidating board', `/board/${result.boardId}`);
    revalidatePath(`/board/${result.boardId}`);

    return { success: true, data: result };
  } catch (error: any) {
    console.error('Error updating task:', error.stack);
    return { success: false, error: 'Failed to update task' };
  }
}
