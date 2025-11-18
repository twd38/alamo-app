'use server';

import { prisma } from '@/lib/db';
import { Prisma, WorkOrderStatus } from '@prisma/client';
import {
  WORK_ORDER_KANBAN_STATUS_ORDER,
  WORK_ORDER_KANBAN_COMPLETED_FETCH_LIMIT
} from '../constants';

export async function getWorkOrdersKanban({ query }: { query: string }) {
  const statuses = WORK_ORDER_KANBAN_STATUS_ORDER;
  const completedStatus = WorkOrderStatus.COMPLETED;
  const nonCompletedStatuses = statuses.filter(
    (status) => status !== completedStatus
  );

  const baseWhereClause: Prisma.WorkOrderWhereInput = {
    deletedOn: null,
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

  const nonCompletedWorkOrdersPromise = prisma.workOrder.findMany({
    where: {
      ...baseWhereClause,
      status: {
        in: nonCompletedStatuses
      }
    },
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
    ]
  });

  const completedWorkOrdersPromise = prisma.workOrder.findMany({
    where: {
      ...baseWhereClause,
      status: completedStatus
    },
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
    take: WORK_ORDER_KANBAN_COMPLETED_FETCH_LIMIT
  });

  const [nonCompletedWorkOrders, completedWorkOrders] = await Promise.all([
    nonCompletedWorkOrdersPromise,
    completedWorkOrdersPromise
  ]);

  return {
    workOrders: [...nonCompletedWorkOrders, ...completedWorkOrders]
  };
}

export type WorkOrdersKanban = Prisma.PromiseReturnType<
  typeof getWorkOrdersKanban
>;

export type WorkOrderKanbanItem = WorkOrdersKanban['workOrders'][number];
