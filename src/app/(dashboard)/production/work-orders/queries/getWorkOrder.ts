import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function getWorkOrder(
  workOrderId: string
): Promise<Prisma.WorkOrderGetPayload<{
  include: {
    part: {
      include: {
        bomParts: {
          include: {
            part: true;
          };
        };
        cadFile: true;
        gltfFile: true;
        partImage: true;
      };
    };
    files: true;
    createdBy: true;
    assignees: {
      include: {
        user: true;
      };
    };
    tags: true;
    clockInEntries: {
      include: {
        user: true;
      };
    };
    timeEntries: true;
    workInstruction: {
      include: {
        steps: {
          include: {
            actions: {
              include: {
                uploadedFile: true;
                executionFile: true;
              };
            };
            files: true;
          };
        };
      };
    };
  };
}> | null> {
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
              },
              files: true
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
