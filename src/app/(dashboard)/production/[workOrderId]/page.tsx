import { getWorkOrder } from '@/lib/queries';
import { ProductionTopBar } from '@/components/production/production-top-bar';
import { WorkInstructionsViewer } from '@/components/production/work-instructions-viewer';

interface WorkOrderPageProps {
  params: Promise<{
    workOrderId: string;
  }>;
}

const WorkOrderProductionPage = async ({ params }: WorkOrderPageProps) => {
  const { workOrderId } = await params;
  const workOrder = await getWorkOrder(workOrderId);
  console.log(workOrder);
  if (!workOrder) {
    return <div>Work order not found</div>;
  }

  const workInstructions = workOrder.part?.workInstructions?.[0];
  const steps = workInstructions?.steps || [];

  return (
    <div className="max-h-screen">
      <ProductionTopBar workOrder={workOrder} />
      <WorkInstructionsViewer steps={steps} workOrder={workOrder} />
    </div>
  );
};

export default WorkOrderProductionPage;
