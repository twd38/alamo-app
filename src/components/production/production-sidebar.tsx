"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { WorkInstructionStep, ActionType, WorkOrderStatus } from "@prisma/client";
import { ProductionActionItem } from "./actions";
import { CircleCheck } from "lucide-react";
import { getWorkOrder } from "@/lib/queries";

type WorkOrder = Awaited<ReturnType<typeof getWorkOrder>>;

type WorkInstructionStepAction = {
    id: string;
    stepId: string;
    actionType: ActionType;
    description: string;
    targetValue: number | null;
    unit: string | null;
    tolerance: number | null;
    signoffRoles: string[];
    isRequired: boolean;
    uploadedFileId: string | null;
    notes: string | null;
};

type WorkInstructionStepWithActions = WorkInstructionStep & {
    actions: WorkInstructionStepAction[];
};

interface ProductionSidebarProps {
    step: WorkInstructionStepWithActions | null;
    workOrder: WorkOrder;
}

export function ProductionSidebar({ step, workOrder }: ProductionSidebarProps) {
    const isWorkOrderInProgress = workOrder?.status === WorkOrderStatus.IN_PROGRESS;
    // const allActionsCompleted = step?.actions.every(action => action.completedAt);
    // TODO: Check if the step has been completed
    const allActionsCompleted = false;
    const canCompleteStep = isWorkOrderInProgress && allActionsCompleted;

    return (
        <div className="h-full flex flex-col">
            <div className="flex-1 flex flex-col min-h-0">
                <Tabs defaultValue="actions" className="flex flex-col h-full">
                    <div className="border-b flex-shrink-0">
                        <TabsList className="w-full justify-start h-12 p-0 bg-transparent border-b-0">
                            <TabsTrigger
                                value="actions"
                                className="data-[state=active]:bg-background rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 h-12"
                            >
                                Actions
                            </TabsTrigger>
                            <TabsTrigger
                                value="comments"
                                className="data-[state=active]:bg-background rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 h-12"
                            >
                                Comments
                            </TabsTrigger>
                            <TabsTrigger
                                value="files"
                                className="data-[state=active]:bg-background rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 h-12"
                            >
                                Files
                            </TabsTrigger>
                        </TabsList>
                    </div>
                    <TabsContent value="actions" className="mt-0 flex-1 min-h-0">
                        <ProductionActions step={step} isWorkOrderInProgress={isWorkOrderInProgress} />
                    </TabsContent>
                    <TabsContent value="comments" className="mt-0 flex-1 min-h-0">
                        <ProductionComments step={step} />
                    </TabsContent>
                    <TabsContent value="files" className="mt-0 flex-1 min-h-0">
                        <ProductionFiles step={step} />
                    </TabsContent>
                </Tabs>
            </div>
            <div className="border-t border-inherit px-4 py-4 flex-shrink-0">
                {!isWorkOrderInProgress && (
                    <div className="mb-2 text-sm text-amber-600 bg-amber-50 p-2 rounded">
                        Work order must be started to complete steps
                    </div>
                )}
                <Button 
                    variant="default" 
                    className="w-full" 
                    disabled={!canCompleteStep}
                >
                    <CircleCheck className="w-4 h-4 mr-2" />
                    Complete Step
                </Button>
            </div>
        </div>
    );
}

// Actions component for production - interactive but not editable
function ProductionActions({ step, isWorkOrderInProgress }: { 
    step: WorkInstructionStepWithActions | null; 
    isWorkOrderInProgress: boolean;
}) {
    if (!step) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <p>Select a step to view actions</p>
            </div>
        );
    }

    if (step.actions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <p>No actions required for this step</p>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto p-4 space-y-4">
                {step.actions.map((action) => (
                    <ProductionActionItem 
                        key={action.id} 
                        action={action} 
                        disabled={!isWorkOrderInProgress}
                    />
                ))}
        </div>
    );
}

// Placeholder component for Comments
function ProductionComments({ step }: { step: WorkInstructionStepWithActions | null }) {
    if (!step) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <p>Select a step to view comments</p>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto">
            <div className="p-4">
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <p>Comments functionality coming soon</p>
                </div>
            </div>
        </div>
    );
}

// Placeholder component for Files
function ProductionFiles({ step }: { step: WorkInstructionStepWithActions | null }) {
    if (!step) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <p>Select a step to view files</p>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto">
            <div className="p-4">
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <p>Files functionality coming soon</p>
                </div>
            </div>
        </div>
    );
} 