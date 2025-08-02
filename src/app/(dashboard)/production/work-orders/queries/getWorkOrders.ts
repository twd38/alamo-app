'use server';

import { prisma } from '@/lib/db';
import { Prisma, WorkOrderStatus } from '@prisma/client';

export async function getWorkOrders({
  query,
  status,
  page,
  limit,
  sortBy,
  sortOrder
}: {
  query: string;
  status: WorkOrderStatus | WorkOrderStatus[];
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: Prisma.SortOrder;
}) {
  // If status is todo, then we need to include the work order that is in progress, todo, and paused
  if (status === WorkOrderStatus.TODO) {
    status = [
      WorkOrderStatus.IN_PROGRESS,
      WorkOrderStatus.TODO,
      WorkOrderStatus.PAUSED
    ];
  }
  // Create reusable WHERE clause to avoid duplication
  const whereClause = {
    deletedOn: null,
    status: {
      in: Array.isArray(status) ? status : [status]
    },
    OR: [
      {
        workOrderNumber: {
          contains: query,
          mode: 'insensitive'
        }
      },
      {
        part: {
          OR: [
            {
              description: {
                contains: query,
                mode: 'insensitive'
              }
            },
            {
              partNumber: {
                contains: query,
                mode: 'insensitive'
              }
            }
          ]
        }
      }
    ]
  } satisfies Prisma.WorkOrderWhereInput;

  // Execute both queries in parallel
  const [workOrders, totalCount] = await Promise.all([
    prisma.workOrder.findMany({
      where: whereClause,
      include: {
        part: true,
        createdBy: true,
        assignees: {
          include: {
            user: true
          }
        }
      },
      orderBy: {
        [sortBy]: sortOrder
      },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.workOrder.count({
      where: whereClause
    })
  ]);

  return {
    workOrders,
    totalCount
  };
}

export type WorkOrders = Prisma.PromiseReturnType<typeof getWorkOrders>;
