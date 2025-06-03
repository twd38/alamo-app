'use server'
import { prisma } from 'src/lib/db';
import { revalidatePath } from 'next/cache'
import { WorkOrderStatus, Color } from '@prisma/client';
import { auth } from 'src/lib/auth';
import { Task, Part, TrackingType, BOMType, Prisma, PartType, ActionType, TaskTag } from '@prisma/client';
import { uploadFileToR2, deleteFileFromR2, getSignedDownloadUrl, getUploadUrl, getSignedDownloadUrlFromUnsignedUrl } from '@/lib/r2';
import { generateNewPartNumbers, generateRandomColor } from '@/lib/utils';
import { checkFeasibility } from "@/lib/site-engine/feasibility";
import { buildYield } from "@/lib/site-engine/yield";
import { runFinance } from "@/lib/site-engine/finance";
import { SCHEMES } from "@/lib/site-engine/templates";
import type { Lot } from "@/lib/site-engine/types";
import { assumptions } from "@/lib/config"; // centralised assumptions
import { notify } from "./notification-service";


export async function updateDataAndRevalidate(path: string) {
    revalidatePath(path); // Revalidate the specific path
    return { message: "Data updated and cache revalidated" };
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
    
    console.log('Retrieved workstations:', 
        kanbanSections.map(w => ({
            id: w.id,
            name: w.name,
            taskCount: w.tasks?.length || 0,
            taskOrders: w.tasks?.map(t => t.taskOrder) || []
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
    })
    revalidatePath('/production')
    return { success: true, data: result };
}

export async function updateKanbanSectionTasks({id, tasks}: {id:string, tasks:Task[]}) {
    try {
        const result = await prisma.kanbanSection.update({
            where: { id },
            data: { tasks: { connect: tasks.map(task => ({ id: task.id })) } }
        });
        
        revalidatePath('/production');
        return { success: true, data: result };
    } catch (error) {
        console.error('Error updating workstation:', error);
        return { success: false, error: 'Failed to update workstation' };
    }
}

export async function updateKanbanSectionKanbanOrder(id: string, kanbanOrder: number) {
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
                content,
            },
        });
    }

    return await prisma.missionMessage.update({
        where: { id },
        data: { content },
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
        const session = await auth()
        const userId = session?.user?.id || "cm78gevrb0004kxxg43qs0mqv"
        
        // Handle file uploads if present
        const fileData: Prisma.FileCreateInput[] = [];
        if (data.files && data.files.length > 0) {
            for (const file of data.files) {
                const { url } = await uploadFileToR2(file, "tasks");
                fileData.push({
                    url,
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
                    deletedOn: null,
                },
                data: {
                    taskOrder: {
                        increment: 1,
                    },
                },
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
                        connect: data.assignees.map((assigneeId) => ({ id: assigneeId })),
                    },
                    kanbanSectionId: data.kanbanSectionId,
                    boardId: data.boardId,
                    taskOrder: 0,
                    files: {
                        create: fileData,
                    },
                    tags: {
                        connect: data.tags?.map((tag) => ({ id: tag })) || [],
                    },
                    private: data.private ?? false,
                    epicId: data.epicId,
                },
                include: {
                    assignees: true,
                    files: true,
                },
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

export async function moveTask(taskId: string, targetWorkStationId: string, newOrder: number) {
    try {
        console.log(`Moving task ${taskId} to workstation ${targetWorkStationId} with order ${newOrder}`);
        
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
                    connect: originalTask.assignees.map(assignee => ({ id: assignee.id }))
                },
                files: {
                    create: originalTask.files.map(file => ({
                        url: file.url,
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        taskId: taskId,
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

export async function updateTask(taskId: string, data: {
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
    files?: (File | { id: string; url: string; key: string; name: string; type: string; size: number; taskId: string; jobId: string })[];
    tags?: string[];
    private?: boolean;
    epicId?: string;
}) {
    console.log("Updating task", taskId, data)
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
        if (data.epicId !== undefined) updateData.epic = { connect: { id: data.epicId } };
        if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.kanbanSectionId !== undefined) updateData.kanbanSection = { connect: { id: data.kanbanSectionId } };
        if (data.boardId !== undefined) updateData.board = { connect: { id: data.boardId } };
        if (data.private !== undefined) updateData.private = data.private;
        if (data.taskOrder !== undefined) updateData.taskOrder = data.taskOrder;

        // Handle assignees if provided
        if (data.assignees !== undefined) {
            updateData.assignees = {
                set: data.assignees.map(userId => ({ id: userId }))
            };
        }

        // Handle tags if provided
        if (data.tags !== undefined) {
            updateData.tags = {
                set: data.tags.map(tag => ({ id: tag }))
            };
        }

        // Handle file updates if provided
        if (data.files !== undefined) {
            const existingFiles = existingTask.files;
            const newFiles = data.files;
            
            // Identify files to delete (files that exist but are not in the new list)
            const filesToDelete = existingFiles.filter(
                existingFile => !newFiles.some(
                    newFile => !isFileInstance(newFile) && newFile.id === existingFile.id
                )
            );

            // Delete removed files from R2 and database
            for (const file of filesToDelete) {
                const key = file.url.split('/').pop(); // Extract key from URL
                if (key) {
                    await deleteFileFromR2(key);
                }
            }

            // Upload new files
            const fileData = [];
            for (const file of newFiles) {
                if (isFileInstance(file)) {
                    console.log(file)
                    // Handle new file upload
                    const { url, key } = await getUploadUrl(file.name, file.type, "tasks");
                    console.log({
                        url,
                        key,
                    });

                    // Upload file to R2 with fetch
                    const upload = await fetch(url, {
                        method: "PUT",
                        body: file,
                        headers: {
                            "Content-Type": file.type
                        }
                    });

                    console.log({
                        upload,
                    });

                    fileData.push({
                        url,
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
                        in: filesToDelete.map(f => f.id)
                    }
                },
                create: fileData,
                // Keep existing files that weren't deleted
                connect: newFiles
                    .filter(f => !isFileInstance(f) && 'id' in f)
                    .map(f => ({ id: (f as any).id }))
            };
        }

        // Update task with provided data
        const result = await prisma.task.update({
            where: { id: taskId },
            data: updateData,
            include: {
                assignees: true,
                files: true
            },
        });

        // --------------------------------------------------
        // Notify users who have been newly assigned
        // --------------------------------------------------
        if (data.assignees !== undefined) {
            const previousIds = existingTask.assignees.map(a => a.id);
            const addedIds = data.assignees.filter(id => !previousIds.includes(id));

            // console.log("addedIds", addedIds)
            // console.log("previousIds", previousIds)

            if (addedIds.length > 0) {
                let actorName: string | undefined;
                if (actorUserId) {
                    const actor = await prisma.user.findUnique({ where: { id: actorUserId }, select: { name: true } });
                    actorName = actor?.name ?? undefined;
                }

                const message = `${actorName ?? 'Someone'} assigned you to task <https://alamo.americanhousing.co/board/${result.boardId}?taskId=${result.id}|${result.name}>.`
                await notify({
                    recipientIds: addedIds,
                    message: message,
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
function isFileInstance(file: File | { id: string; url: string; key: string; name: string; type: string; size: number; taskId: string; jobId: string }): file is File {
    return file instanceof File;
}

export async function getFileUrlFromKey(key: string) {
  try {
    const presignedUrl = await getSignedDownloadUrl(key);
    
    return { success: true, url: presignedUrl };
  } catch (error) {
    console.error('Error getting file download URL:', error);
    return { success: false, error: 'Failed to get file download URL' };
  }
}

export async function getFileUrlFromUnsignedUrl(url: string) {
    const presignedUrl = await getSignedDownloadUrlFromUnsignedUrl(url);
    return { success: true, url: presignedUrl };
}   

export async function getPresignedUploadUrl(fileName: string, contentType: string, path: string) {
  try {
    const { url, key } = await getUploadUrl(fileName, contentType, path);
    return { success: true, url, key };
  } catch (error) {
    console.error('Error getting upload URL:', error);
    return { success: false, error: 'Failed to get upload URL' };
  }
}

export async function getFileUrl(path: string, fileName: string) {
  try {
    // Create the key in the same format as it would be generated in getUploadUrl
    const key = `${path}/${fileName}`;
    // Return the permanent URL for the file
    return `${process.env.R2_PUBLIC_URL}/${key}`;
  } catch (error) {
    console.error('Error getting file URL:', error);
    throw new Error('Failed to get file URL');
  }
}

export async function uploadFile(file: File, path: string) {
    const { url } = await uploadFileToR2(file, path);
    return { success: true, url };
}

export async function createPart({
    partNumber,
    description,
    unit,
    trackingType,
    partImage,
    files,
    bomParts = [], // Default to empty array to avoid null
    isRawMaterial
}: {
    partNumber?: string;
    partRevision?: string;
    description: Part["description"];
    unit: Part["unit"];
    trackingType: Part["trackingType"];
    partImage?: File;
    files?: File[];
    isRawMaterial: boolean;
    bomParts: {
        id: string,
        part: Part,
        qty: number,
        bomType: BOMType
    }[] | [];
    nxFilePath?: string;

}) {
    try {
        // Ensure bomParts is an array
        if (!bomParts || !Array.isArray(bomParts)) {
            bomParts = [];
        }

        // Upload files to R2 if they exist
        let partImageFile: Prisma.FileCreateInput | undefined;
        let partFiles: Prisma.FileCreateInput[] = [];

        // Handle part image upload if it exists and is a File object (not already uploaded)
        if (partImage && partImage instanceof File) {
            const path = `parts/${Date.now()}-${partImage.name}`;
            const uploadResult = await uploadFile(partImage, path);
            if (uploadResult.success) {
                // Create a file record in the database
                partImageFile = {
                    url: uploadResult.url,
                    name: partImage.name,
                    type: partImage.type,
                    size: partImage.size
                };
            }
        }

        // Handle multiple files upload if they exist
        if (files && Array.isArray(files)) {
            const filePromises = files.map(async (file: File) => {
                if (file instanceof File) {
                    const path = `parts/${Date.now()}-${file.name}`;
                    const uploadResult = await uploadFile(file, path);
                    if (uploadResult.success) {
                        // Create a file record in the database
                        return {
                            url: uploadResult.url,
                            name: file.name,
                            type: file.type,
                            size: file.size
                        };
                    }
                }
                return null;
            });

            // Filter out null values
            const uploadedFiles = (await Promise.all(filePromises)).filter((file): file is Prisma.FileCreateInput => 
                file !== null
            );
            partFiles = uploadedFiles;
        }

        // Create the part cat if not provided
        const componentPartTypes: PartType[] = [];
        for (const bomPart of bomParts) {
            if(bomPart.part.partType) {
                componentPartTypes.push(bomPart.part.partType);
            }
        }
        
        // Create the part numbers if not provided
        const generatedPartNumbers = await generateNewPartNumbers(componentPartTypes, isRawMaterial);
        const partNumberValue = partNumber ? partNumber : generatedPartNumbers.partNumber;

        // Use a transaction for all database operations to ensure atomicity
        const result = await prisma.$transaction(async (tx) => {
            // Create the part first
            const newPart = await tx.part.create({
                data: {
                    description,
                    basePartNumber: generatedPartNumbers.basePartNumber.toString(),
                    versionNumber: generatedPartNumbers.versionNumber.toString(),
                    partTypeNumber: generatedPartNumbers.partTypeNumber.toString(),
                    partNumber: partNumberValue,
                    partType: generatedPartNumbers.partType,
                    unit,
                    trackingType,
                }
            });

            // Add files if they exist
            if (partFiles.length > 0) {
                for (const fileData of partFiles) {
                    await tx.file.create({
                        data: {
                            ...fileData,
                            part: {
                                connect: { id: newPart.id }
                            }
                        }
                    });
                }
            }

            // Add part image if it exists
            if (partImageFile) {
                const image = await tx.file.create({
                    data: {
                        ...partImageFile
                    }
                });
                
                await tx.part.update({
                    where: { id: newPart.id },
                    data: {
                        partImageId: image.id
                    }
                });
            }

            // Create BOM parts one by one
            for (const bomPart of bomParts) {
                await tx.bOMPart.create({
                    data: {
                        parentPartId: newPart.id,
                        partId: bomPart.part.id,
                        qty: bomPart.qty,
                        bomType: bomPart.bomType,
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

export async function createWorkInstruction({
    partNumber,
    title,
    description,
    steps,
    instructionNumber
} : Prisma.WorkInstructionCreateWithoutPartInput & { partNumber: string, steps: Prisma.WorkInstructionStepCreateWithoutWorkInstructionInput[] | undefined }) {
    //Prisma.WorkInstructionStepCreateWithoutWorkInstructionInput[] | undefined,
    console.log(partNumber, title, description, steps, instructionNumber)
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
                        partNumber: partNumber
                    }
                },
            }
        });
        return { success: true, data: result };
    } catch (error: any) {
        console.error('Error creating work instruction:', error);
        console.log(error.stack)
        return { success: false, error: 'Failed to create work instruction' };
    }
}

export async function createWorkInstructionStep({
    workInstructionId,
    stepNumber,
    title,
    instructions,
    estimatedLabourTime,
}: Prisma.WorkInstructionStepCreateWithoutWorkInstructionInput & { workInstructionId: string }) {
    try {
        const result = await prisma.workInstructionStep.create({
            data: {
                workInstructionId,
                stepNumber,
                title,
                instructions,
                estimatedLabourTime,
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
                estimatedLabourTime,
            }
        });
        return { success: true, data: result };
    } catch (error) {
        console.error('Error updating work instruction step:', error);
        return { success: false, error: 'Failed to update work instruction step' };
    }
}

export async function createWorkInstructionStepAction(data: Prisma.WorkInstructionStepActionCreateWithoutStepInput & { stepId: string }) {
    console.log(data)
    const { stepId, actionType, description, targetValue, unit, tolerance, signoffRoles, isRequired, notes } = data
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
                notes: notes || null,
            }
        });
        return { success: true, data: result };
    } catch (error: any) {
        console.error('Error creating work instruction step action:', error.stack);
        return { success: false, error: 'Failed to create work instruction step action' };
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
    completedAt,
    completedBy,
    completedValue,
    uploadedFileId,
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
    completedAt?: Date | null;
    completedBy?: string | null;
    completedValue?: number | null;
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
                completedAt,
                completedBy,
                completedValue,
                uploadedFileId,
            }
        });
        return { success: true, data: result };
    } catch (error) {
        console.error('Error updating work instruction step action:', error);
        return { success: false, error: 'Failed to update work instruction step action' };
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
        return { success: false, error: 'Failed to delete work instruction step action' };
    }
}

export async function evaluateLot(lot: Lot) {
  return SCHEMES.map((scheme) => {
    const gate = checkFeasibility(lot, scheme);
    if (!gate.feasible)
      return { scheme: scheme.name, status: "blocked", blocking: gate.blocking };

    const yld = buildYield(lot, scheme);
    const fin = runFinance(lot, scheme, yld, assumptions);
    return { scheme: scheme.name, status: "feasible", yld, fin };
  });
}

export async function createBoardView(name: string, filters: any, boardId: string) {
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

export async function updateBoardView(boardViewId: string, data: {
  name?: string;
  filters?: any;
}) {
  try {
    console.log(boardViewId, data)
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
}

export async function createBoard({name, isPrivate, collaboratorIds, icon}: Board) {
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
          connect: collaboratorIds.map(id => ({ id }))
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

export async function updateBoard(boardId: string, {name, private: isPrivate, collaboratorIds, icon}: { name?: string; private?: boolean; collaboratorIds?: string[]; icon?: string }) {
  try {
    // Get user from auth
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    // Check if user has permission to update the board
    const board = await prisma.board.findFirst({
      where: {
        id: boardId,
        OR: [
          { createdById: userId },
          { collaborators: { some: { id: userId } } }
        ]
      }
    });

    if (!board) {
      return { success: false, error: 'Board not found or you do not have permission to update it' };
    }

    // Update the board
    const updatedBoard = await prisma.board.update({
      where: { id: boardId },
      data: {
        name,
        private: isPrivate,
        icon,
        collaborators: collaboratorIds ? {
          set: collaboratorIds.map(id => ({ id }))
        } : undefined
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
      return { success: false, error: 'Board not found or you do not have permission to delete it' };
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
  timeEstimate = "",
  dueDate,
  assigneeIds = [],
  notes = "",
}: {
  partId: string
  partQty: number
  operation: string
  status?: WorkOrderStatus
  timeEstimate?: string
  dueDate?: Date
  assigneeIds?: string[]
  notes?: string
}) {
  try {
    const session = await auth()
    const userId = session?.user?.id || "cm78gevrb0004kxxg43qs0mqv"

    // Helper to generate incremental WO number e.g. WO-000123
    const generateWorkOrderNumber = async () => {
      const lastWO = await prisma.workOrder.findFirst({
        orderBy: {
          workOrderNumber: "desc",
        },
        select: {
          workOrderNumber: true,
        },
      })

      const lastSeq = lastWO?.workOrderNumber?.replace(/[^0-9]/g, "") || "0"
      const nextSeq = String(Number(lastSeq) + 1).padStart(6, "0")
      return `WO-${nextSeq}`
    }

    const workOrderNumber = await generateWorkOrderNumber()

    // Build data object using unchecked create input to allow scalar IDs
    const workOrderData: Prisma.WorkOrderUncheckedCreateInput = {
      id: undefined, // let Prisma generate cuid
      workOrderNumber,
      operation,
      status,
      timeEstimate,
      dueDate: dueDate ?? null,
      createdById: userId,
      partId,
      partQty,
      notes,
      deletedOn: null,
      assignees: {
        create: assigneeIds.map((uid) => ({ userId: uid })),
      },
    }

    const workOrder = await prisma.workOrder.create({
      data: workOrderData,
      include: {
        assignees: true,
      },
    })

    // Revalidate production page so new WO shows up
    revalidatePath('/production')

    return { success: true, data: workOrder }
  } catch (error) {
    console.error('Error creating work order:', error)
    return { success: false, error: 'Failed to create work order' }
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

export async function reorderWorkInstructionSteps(workInstructionId: string, stepIds: string[]) {
    console.log("Reordering work instruction steps", workInstructionId, stepIds)

    try {
        // Use a transaction to ensure all updates are atomic
        const updates = await prisma.$transaction(
            stepIds.map((stepId, index) => {
                console.log("Updating step", stepId, index)
                console.log("Step number", index + 1)

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
