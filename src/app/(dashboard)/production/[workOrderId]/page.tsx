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

  const workInstructions = workOrder.workInstruction;
  const steps = workInstructions?.steps || [];

  // Type mapping for compatibility (temporary solution)
  const mappedSteps = steps.map((step) => ({
    ...step,
    workInstructionId: step.workOrderInstructionId, // Map to expected field
    actions: step.actions.map((action) => ({
      ...action,
      stepId: action.stepId
    }))
  }));

  return (
    <div className="max-h-screen">
      <ProductionTopBar workOrder={workOrder} />
      <WorkInstructionsViewer
        steps={mappedSteps as any}
        workOrder={workOrder}
      />
    </div>
  );
};

export default WorkOrderProductionPage;
