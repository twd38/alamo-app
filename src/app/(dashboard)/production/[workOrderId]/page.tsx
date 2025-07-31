import { getWorkOrder } from '../queries';
import { ProductionTopBar } from '../components/production-top-bar';
import { WorkInstructionsViewer } from '../components/work-instructions-viewer';

// Revalidate every 60 seconds
export const revalidate = 60;

interface WorkOrderPageProps {
  params: Promise<{
    workOrderId: string;
  }>;
}

const WorkOrderProductionPage = async ({ params }: WorkOrderPageProps) => {
  const { workOrderId } = await params;
  const workOrder = await getWorkOrder(workOrderId);
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
      <WorkInstructionsViewer steps={mappedSteps} workOrder={workOrder} />
    </div>
  );
};

export default WorkOrderProductionPage;
