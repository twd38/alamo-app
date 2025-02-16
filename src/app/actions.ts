'use server'
import { prisma } from 'src/lib/db';
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { Status } from '@prisma/client';
import { auth } from 'src/lib/auth';
import { User, WorkStation, Task } from '@prisma/client';

export async function getWorkstations() {
    return await prisma.workStation.findMany({
      include: {
        jobs: true,
        tasks: {
          include: {
            assignees: true,
            createdBy: true,
            files: true
          }
        }
      }
    })
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
1
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


