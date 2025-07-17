'use client';

import { useRouter } from 'next/navigation';
import { WorkOrderTabs, TabContent } from './work-order-tabs';
import { WorkOrderDetailsEditor } from './work-order-details-editor';
import { WorkOrderModelView } from './work-order-model-view';
import { WorkOrderInstructionsEditor } from './work-order-instructions-editor';
import { User } from '@prisma/client';

type WorkOrder = {
  id: string;
  workOrderNumber: string;
  partQty: number;
  dueDate: Date | null;
  status: string;
  notes: string | null;
  part: {
    id: string;
    name: string | null;
    description: string | null;
    partNumber: string;
    unit: string;
    apsUrn?: string | null;
    bomParts: Array<{
      id: string;
      qty: number;
      part: {
        partNumber: string;
        name: string | null;
        description: string | null;
        unit: string;
      } | null;
    }>;
  };
  assignees: Array<{
    userId: string;
    user: User;
  }>;
  files: Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    url: string;
  }>;
};

type WorkInstruction = {
  id: string;
  steps: Array<{
    id: string;
    stepNumber: number;
    title: string;
    instructions: string;
    estimatedLabourTime: number;
    actions: Array<{
      id: string;
      type: string;
      label: string;
      uploadedFile?: {
        id: string;
        name: string;
        url: string;
      };
      executionFile?: {
        id: string;
        name: string;
        url: string;
      };
    }>;
  }>;
};

interface WorkOrderEditorWrapperProps {
  workOrder: WorkOrder;
  users: User[];
  workInstructions: WorkInstruction[];
}

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
