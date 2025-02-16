'use server'
import { prisma } from 'src/lib/db';
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { Status } from '@prisma/client';
import { auth } from 'src/lib/auth';
import { User, WorkStation, Task } from '@prisma/client';

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
    workStationId?: string;
}) {
    try {
        const session = await auth()
        const userId = session?.user?.id || "cm76gqnt200046dmxaehh48qs"
        console.log(session)
        
        console.log('Creating task with data:', data);
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
            },
            include: {
                assignees: true
            }
        })

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


