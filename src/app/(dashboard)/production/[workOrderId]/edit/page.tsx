import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getWorkOrder } from '../../queries';
import { getWorkOrderWorkInstructions } from './queries/getWorkOrderWorkInstructions';
import { getUsers } from './queries/getUsers';
import BasicTopBar from '@/components/layouts/basic-top-bar';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { WorkOrderEditorWrapper } from './components/work-order-editor-wrapper';

interface WorkOrderEditPageProps {
  params: Promise<{
    workOrderId: string;
  }>;
}

async function WorkOrderEditContent({ workOrderId }: { workOrderId: string }) {
  const workOrder = await getWorkOrder(workOrderId);
  const workInstructions = await getWorkOrderWorkInstructions(
    workOrder?.workInstruction?.id!
  );
  const users = await getUsers();

  if (!workOrder || !workInstructions) {
    notFound();
  }

  // Transform the data to match the expected structure
  // const workInstructions = rawWorkInstructions.map((instruction) => ({
  //   ...instruction,
  //   steps: instruction.steps.map((step) => ({
  //     ...step,
  //     actions: step.actions.map((action) => ({
  //       id: action.id,
  //       type: String(action.actionType),
  //       label: action.description,
  //       uploadedFile: action.uploadedFile || undefined,
  //       executionFile: action.executionFile || undefined
  //     })),
  //     files: step.files || []
  //   }))
  // }));

  return (
    <WorkOrderEditorWrapper
      workOrder={workOrder}
      users={users}
      workInstructions={workInstructions}
    />
  );
}

function LoadingState() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-gray-500 flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading work order...
      </div>
    </div>
  );
}

export default async function WorkOrderEditPage({
  params
}: WorkOrderEditPageProps) {
  const { workOrderId } = await params;

  return (
    <div className="h-screen flex flex-col">
      <BasicTopBar
        breadcrumbs={[
          {
            label: 'Production',
            href: '/production'
          },
          {
            label: workOrderId,
            href: `/production/${workOrderId}`
          },
          {
            label: 'Edit',
            href: `/production/${workOrderId}/edit`
          }
        ]}
        actions={
          <Link href={`/production/${workOrderId}`}>
            <Button size="sm">View Work Order</Button>
          </Link>
        }
      />

      <Suspense fallback={<LoadingState />}>
        <WorkOrderEditContent workOrderId={workOrderId} />
      </Suspense>
    </div>
  );
}
