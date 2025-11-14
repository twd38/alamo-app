import { WorkOrderStatus } from '@prisma/client';

export const WORK_ORDER_KANBAN_STATUS_ORDER: WorkOrderStatus[] = [
  WorkOrderStatus.TODO,
  WorkOrderStatus.MANUFACTURING,
  WorkOrderStatus.QUALITY_CONTROL,
  WorkOrderStatus.SHIP,
  WorkOrderStatus.COMPLETED
];

export const WORK_ORDER_STATUS_LABELS: Record<WorkOrderStatus, string> = {
  [WorkOrderStatus.DRAFT]: 'Draft',
  [WorkOrderStatus.TODO]: 'To Do',
  [WorkOrderStatus.MANUFACTURING]: 'Manufacturing',
  [WorkOrderStatus.IN_PROGRESS]: 'In Progress',
  [WorkOrderStatus.QUALITY_CONTROL]: 'Quality Control',
  [WorkOrderStatus.HOLD]: 'Hold',
  [WorkOrderStatus.PAUSED]: 'Paused',
  [WorkOrderStatus.SHIP]: 'Ship',
  [WorkOrderStatus.COMPLETED]: 'Completed',
  [WorkOrderStatus.SCRAPPED]: 'Scrapped'
};

export const WORK_ORDER_KANBAN_STATUS_CONFIG =
  WORK_ORDER_KANBAN_STATUS_ORDER.map((status) => ({
    value: status,
    label: WORK_ORDER_STATUS_LABELS[status]
  }));

export const WORK_ORDER_KANBAN_FETCH_LIMIT = 100;
