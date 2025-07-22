import { prisma } from '@/lib/db';

export async function getWorkOrder(workOrderId: string) {
  return await prisma.workOrder.findUnique({
    where: {
      id: workOrderId
    },
    include: {
      part: {
        include: {
          bomParts: {
            include: {
              part: true
            }
          },
          cadFile: true,
          gltfFile: true,
          partImage: true
        }
      },
      files: true,
      createdBy: true,
      assignees: {
        include: {
          user: true
        }
      },
      tags: true,
      clockInEntries: {
        where: {
          clockOutTime: null // Only get users who are currently clocked in
        },
        include: {
          user: true
        }
      },
      timeEntries: true,
      workInstruction: {
        include: {
          steps: {
            include: {
              actions: {
                include: {
                  uploadedFile: true,
                  executionFile: true
                }
              }
            },
            orderBy: {
              stepNumber: 'asc'
            }
          }
        }
      }
    }
  });
}
