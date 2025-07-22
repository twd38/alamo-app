'use client';

import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getWorkOrder } from '../queries/getWorkOrder';
import { Package, Users, Tag, Calendar } from 'lucide-react';
import Image from 'next/image';

type WorkOrder = Awaited<ReturnType<typeof getWorkOrder>>;

interface WorkOrderOverviewProps {
  workOrder: WorkOrder;
}

export function WorkOrderOverview({ workOrder }: WorkOrderOverviewProps) {
  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="space-y-4">
        {/* Work Order Details  */}
        {/* Part Image and Basic Info */}
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-shrink-0">
            <div className="w-48 h-48 rounded-lg flex items-center justify-center">
              {workOrder?.part?.partImage?.key ? (
                <Image
                  src={workOrder.part.partImage.key}
                  alt={workOrder.part.name || 'Part image'}
                  width={192}
                  height={192}
                  className="rounded-lg object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full w-full text-gray-400 text-center border-2 border-dashed bg-gray-50 border-gray-300">
                  <Package className="w-12 h-12 mx-auto mb-2" />
                  <div className="text-sm">No image available</div>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {workOrder?.part?.name || 'Unnamed Part'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {workOrder?.part?.description || ''}
              </p>
            </div>

            <div className="flex items-center gap-4">
              {workOrder?.workOrderNumber && (
                <Badge variant="outline">WO #{workOrder.workOrderNumber}</Badge>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Part and Order Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Part Information
            </h4>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-600">Part Number:</span>
                <p className="font-medium">
                  {workOrder?.part?.partNumber
                    ? `${workOrder.part.partNumber}/${workOrder.part.partRevision}`
                    : 'N/A'}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Part Name:</span>
                <p className="font-medium">{workOrder?.part?.name || 'N/A'}</p>
              </div>
              {workOrder?.part?.unit && (
                <div>
                  <span className="text-gray-600">Unit of Measure:</span>
                  <p className="font-medium">{workOrder.part.unit}</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Order Information
            </h4>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-600">Due Date:</span>
                <p className="font-medium">
                  {workOrder?.dueDate
                    ? new Date(workOrder.dueDate).toLocaleDateString()
                    : 'N/A'}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Quantity:</span>
                <p className="font-medium">{workOrder?.partQty || 'N/A'}</p>
              </div>
              {workOrder?.workOrderNumber && (
                <div>
                  <span className="text-gray-600">Work Order #:</span>
                  <p className="font-medium">{workOrder.workOrderNumber}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Assignees  */}
        <div className="grid grid-cols-1 gap-4">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Assignees
          </h4>
          {workOrder?.assignees && workOrder.assignees.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {workOrder.assignees.map((assignee: any) => (
                <Badge
                  key={assignee.user.id}
                  variant="secondary"
                  className="px-3 py-1"
                >
                  {assignee.user.name || assignee.user.email}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No assignees specified
            </p>
          )}
        </div>

        <Separator />

        {/* Tags */}
        <div className="grid grid-cols-1 gap-4">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Tags
          </h4>
          {workOrder?.tags && workOrder.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {workOrder.tags.map((tag) => (
                <Badge
                  key={tag.id}
                  style={{ backgroundColor: tag.color }}
                  className="text-white"
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No tags assigned</p>
          )}
        </div>
      </div>
    </div>
  );
}
