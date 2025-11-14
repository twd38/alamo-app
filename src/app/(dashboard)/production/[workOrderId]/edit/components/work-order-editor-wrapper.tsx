'use client';

import { useRouter } from 'next/navigation';
import { WorkOrderTabs, TabContent } from './work-order-tabs';
import { WorkOrderDetailsEditor } from './work-order-details-editor';
import { WorkOrderModelView } from './work-order-model-view';
import { WorkOrderInstructionsEditor } from './work-order-instructions-editor';
import { User, Prisma } from '@prisma/client';

type WorkOrder = Prisma.WorkOrderGetPayload<{
  include: {
    part: {
      include: {
        bomParts: {
          include: {
            part: true;
          };
        };
      };
    };
    assignees: true;
    files: true;
    tags: true;
  };
}>;

type WorkOrderWorkInstructions = Prisma.WorkOrderWorkInstructionGetPayload<{
  include: {
    steps: {
      include: {
        actions: true;
        files: true;
      };
    };
  };
  workOrder: true;
}>;

type WorkOrderEditorWrapperProps = {
  workOrder: WorkOrder;
  users: User[];
  workInstructions: WorkOrderWorkInstructions;
};

export function WorkOrderEditorWrapper({
  workOrder,
  users,
  workInstructions
}: WorkOrderEditorWrapperProps) {
  const router = useRouter();

  const handleUpdate = () => {
    router.refresh();
  };

  return (
    <WorkOrderTabs
      workOrderNumber={workOrder.workOrderNumber}
      status={workOrder.status}
    >
      <TabContent value="details">
        <WorkOrderDetailsEditor
          workOrder={workOrder}
          users={users}
          onUpdate={handleUpdate}
        />
      </TabContent>
      <TabContent value="model">
        <WorkOrderModelView apsUrn={workOrder.part.apsUrn || undefined} />
      </TabContent>
      <TabContent value="instructions">
        <WorkOrderInstructionsEditor
          workInstructions={workInstructions}
          isLoading={false}
          onUpdate={handleUpdate}
          workOrder={{
            id: workOrder.id,
            partQty: workOrder.partQty
          }}
        />
      </TabContent>
    </WorkOrderTabs>
  );
}
