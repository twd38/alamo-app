'use server'
import { prisma } from 'src/lib/db';
import { revalidatePath } from 'next/cache'
import { Status } from '@prisma/client';
import { auth } from 'src/lib/auth';
import { Task, Part, TrackingType, BOMType, Prisma, PartType, ActionType } from '@prisma/client';
import { uploadFileToR2, deleteFileFromR2, getPresignedDownloadUrl, getUploadUrl, getPresignedDownloadUrlFromUnsignedUrl } from '@/lib/r2';
import { generateNewPartNumbers } from '@/lib/utils';


export async function updateDataAndRevalidate(path: string) {
    revalidatePath(path); // Revalidate the specific path
    return { message: "Data updated and cache revalidated" };
}

export async function getWorkstations() {
    const workstations = await prisma.workStation.findMany({
        where: {
            deletedOn: null
        },
        include: {
            jobs: true,
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
        workstations.map(w => ({
            id: w.id,
            name: w.name,
            taskCount: w.tasks.length,
            taskOrders: w.tasks.map(t => t.taskOrder)
        }))
    );
    
    return workstations;
}

export async function createWorkStation(name: string) {
    await prisma.workStation.create({
      data: {
        name,
        kanbanOrder: 0
      }
    })
    revalidatePath('/production')
    // redirect('/production')
  }

export async function updateWorkStationTasks({id, tasks}: {id:string, tasks:Task[]}) {
    try {
        const result = await prisma.workStation.update({
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

export async function updateWorkStationKanbanOrder(id: string, kanbanOrder: number) {
    await prisma.workStation.update({
        where: { id },
        data: { kanbanOrder }
    });
    revalidatePath('/production');
}

export async function deleteWorkStation(id: string) {
    await prisma.workStation.update({
        where: { id },
        data: { deletedOn: new Date() }
    });
    revalidatePath('/production');
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
    status: Status;
    dueDate: Date;
    description: string;
    createdById: string;
    assignees: string[];
    workStationId: string;
    taskOrder: number;
    files?: File[];
}) {
    try {
        const session = await auth()
        const userId = session?.user?.id || "cm78gevrb0004kxxg43qs0mqv"
        
        // Handle file uploads if present
        const fileData = [];
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
        
        const result = await prisma.task.create({
            data: {
                name: data.name,
                taskNumber: data.taskNumber,
                status: data.status,
                dueDate: data.dueDate,
                description: data.description,
                createdById: userId,
                assignees: {
                    connect: data.assignees.map(userId => ({ id: userId }))
                },
                workStationId: data.workStationId,
                files: {
                    create: fileData
                }
            },
            include: {
                assignees: true,
                files: true
            }
        });

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
                    workStationId: targetWorkStationId,
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
                            workStationId: targetWorkStationId,
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
              workStationId: null
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
                status: originalTask.status,
                dueDate: originalTask.dueDate,
                description: originalTask.description,
                createdById: originalTask.createdById,
                workStationId: originalTask.workStationId,
                taskOrder: originalTask.taskOrder + 1,
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
                        jobId: file.jobId
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
    name: string;
    taskNumber: string;
    status: Status;
    dueDate: Date | undefined;
    description: string;
    assignees: string[];
    workStationId?: string;
    taskOrder: number;
    files?: (File | { id: string; url: string; name: string; type: string; size: number; taskId: string; jobId: string })[];
}) {
    try {
        // Get existing files
        const existingTask = await prisma.task.findUnique({
            where: { id: taskId },
            include: { files: true }
        });

        if (!existingTask) {
            throw new Error('Task not found');
        }

        // Handle file updates
        const existingFiles = existingTask.files;
        const newFiles = data.files || [];
        
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

        // Update task with new file data
        const result = await prisma.task.update({
            where: { id: taskId },
            data: {
                name: data.name,
                taskNumber: data.taskNumber,
                status: data.status,
                dueDate: data.dueDate,
                description: data.description,
                assignees: {
                    set: data.assignees.map(userId => ({ id: userId }))
                },
                workStationId: data.workStationId,
                files: {
                    deleteMany: {
                        id: {
                            in: filesToDelete.map(f => f.id)
                        }
                    },
                    create: fileData,
                    // Keep existing files that weren't deleted
                    connect: newFiles
                        .filter((f): f is { id: string; url: string; name: string; type: string; size: number; taskId: string; jobId: string } => 
                            !isFileInstance(f)
                        )
                        .map(f => ({ id: f.id }))
                }
            },
            include: {
                assignees: true,
                files: true
            }
        });

        return { success: true, data: result };
    } catch (error: any) {
        console.error('Error updating task:', error.stack);
        return { success: false, error: 'Failed to update task' };
    }
}

// Helper function to check if a file is a File instance
function isFileInstance(file: File | { id: string; url: string; name: string; type: string; size: number; taskId: string; jobId: string }): file is File {
    return file instanceof File;
}

export async function getFileUrlFromKey(key: string) {
  try {
    const presignedUrl = await getPresignedDownloadUrl(key);
    
    return { success: true, url: presignedUrl };
  } catch (error) {
    console.error('Error getting file download URL:', error);
    return { success: false, error: 'Failed to get file download URL' };
  }
}

export async function getFileUrlFromUnsignedUrl(url: string) {
    const presignedUrl = await getPresignedDownloadUrlFromUnsignedUrl(url);
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

        // Use a transaction for all database operations to ensure atomicity
        const result = await prisma.$transaction(async (tx) => {
            // Create the part first
            const newPart = await tx.part.create({
                data: {
                    description,
                    basePartNumber: generatedPartNumbers.basePartNumber.toString(),
                    versionNumber: generatedPartNumbers.versionNumber.toString(),
                    partTypeNumber: generatedPartNumbers.partTypeNumber.toString(),
                    partNumber: generatedPartNumbers.partNumber,
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

