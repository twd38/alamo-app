import { getWorkOrder } from '../queries';
import { ProductionTopBar } from '../components/production-top-bar';
import { WorkInstructionsViewer } from '../components/work-instructions-viewer';
import { OperationsList } from '@/components/work-order/operations-list';
import { prisma } from '@/lib/db';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

  // Check if work order has routing-based operations
  const workOrderRouting = await prisma.workOrderRouting.findUnique({
    where: { workOrderId },
    include: {
      routing: true,
      operations: {
        include: {
          operation: true,
          workCenter: true,
          assignedUser: true,
          workOrderRouting: {
            include: {
              workOrder: {
                include: {
                  part: true
                }
              }
            }
          }
        },
        orderBy: { sequenceNumber: 'asc' }
      }
    }
  });

  const hasOperations = workOrderRouting && workOrderRouting.operations.length > 0;
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
      
      {hasOperations ? (
        <div className="h-[calc(100vh-64px)]">
          <Tabs defaultValue="operations" className="h-full">
            <div className="border-b px-4">
              <TabsList className="h-12">
                <TabsTrigger value="operations">Operations</TabsTrigger>
                {workInstructions && (
                  <TabsTrigger value="instructions">Work Instructions</TabsTrigger>
                )}
              </TabsList>
            </div>
            
            <TabsContent value="operations" className="h-[calc(100%-49px)] px-4 py-4">
              <OperationsList 
                operations={workOrderRouting.operations}
                view="list"
              />
            </TabsContent>
            
            {workInstructions && (
              <TabsContent value="instructions" className="h-[calc(100%-49px)]">
                <WorkInstructionsViewer steps={mappedSteps} workOrder={workOrder} />
              </TabsContent>
            )}
          </Tabs>
        </div>
      ) : (
        <WorkInstructionsViewer steps={mappedSteps} workOrder={workOrder} />
      )}
    </div>
  );
};

export default WorkOrderProductionPage;
