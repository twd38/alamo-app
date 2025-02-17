'use server'
import { prisma } from 'src/lib/db';
import { revalidatePath } from 'next/cache'
import { Status } from '@prisma/client';
import { auth } from 'src/lib/auth';
import { User, WorkStation, Task } from '@prisma/client';
import { uploadFileToR2, deleteFileFromR2 } from '@/lib/r2';
import { getPresignedDownloadUrl } from '@/lib/r2';

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
                const { url } = await uploadFileToR2(file);
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
                // Handle new file upload
                const { url } = await uploadFileToR2(file);
                fileData.push({
                    url,
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
    } catch (error) {
        console.error('Error updating task:', error);
        return { success: false, error: 'Failed to update task' };
    }
}

// Helper function to check if a file is a File instance
function isFileInstance(file: File | { id: string; url: string; name: string; type: string; size: number; taskId: string; jobId: string }): file is File {
    return file instanceof File;
}

export async function getFileDownloadUrl(fileUrl: string) {
  try {
    // Extract the key from the URL by removing the PUBLIC_URL prefix
    const key = fileUrl.replace(process.env.R2_PUBLIC_URL + '/', '');
    if (!key) {
      return { success: false, error: 'Invalid file URL' };
    }

    const presignedUrl = await getPresignedDownloadUrl(key);
    return { success: true, url: presignedUrl };
  } catch (error) {
    console.error('Error getting file download URL:', error);
    return { success: false, error: 'Failed to get file download URL' };
  }
}


