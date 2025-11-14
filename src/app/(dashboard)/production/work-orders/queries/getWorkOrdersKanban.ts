'use server';

import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import {
  WORK_ORDER_KANBAN_STATUS_ORDER,
  WORK_ORDER_KANBAN_FETCH_LIMIT
} from '../constants';

export async function getWorkOrdersKanban({ query }: { query: string }) {
  const statuses = WORK_ORDER_KANBAN_STATUS_ORDER;

  const whereClause: Prisma.WorkOrderWhereInput = {
    deletedOn: null,
    status: {
      in: statuses
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
              name: {
                contains: query,
                mode: 'insensitive'
              }
            },
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
  };

  const workOrders = await prisma.workOrder.findMany({
    where: whereClause,
    include: {
      part: true,
      createdBy: true,
      assignees: {
        include: {
          user: true
        }
      },
      tags: true
    },
    orderBy: [
      {
        dueDate: 'desc'
      },
      {
        workOrderNumber: 'asc'
      }
    ],
    take: WORK_ORDER_KANBAN_FETCH_LIMIT
  });

  return {
    workOrders
  };
}

export type WorkOrdersKanban = Prisma.PromiseReturnType<
  typeof getWorkOrdersKanban
>;

export type WorkOrderKanbanItem = WorkOrdersKanban['workOrders'][number];
