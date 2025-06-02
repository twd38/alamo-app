import { getWorkOrder } from "@/lib/queries";

interface WorkOrderPageProps {
    params: Promise<{
        workOrderId: string;
    }>;
}

const WorkOrderProductionPage = async ({ params }: WorkOrderPageProps) => {
    const { workOrderId } = await params;
    const workOrder = await getWorkOrder(workOrderId);

    return (
        <div>
            <h1>Work Order Production</h1>
            <pre>{JSON.stringify(workOrder, null, 2)}</pre>
        </div>
    )
}

export default WorkOrderProductionPage;