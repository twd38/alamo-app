import { getWorkOrder } from "@/lib/queries";
import { ProductionTopBar } from "@/components/production/production-top-bar";
import { Steps } from "@/components/production/steps";

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

    const workInstructions = workOrder.part?.workInstructions?.[0];
    const steps = workInstructions?.steps || [];

    return (
        <div className="h-[calc(100vh-4rem)]">
            <ProductionTopBar workOrder={workOrder} />
            <Steps steps={steps} className="h-[calc(100%-4rem)]" />
        </div>
    );
};

export default WorkOrderProductionPage;