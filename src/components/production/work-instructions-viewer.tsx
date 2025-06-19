"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CircleCheck } from "lucide-react";
import { Clock } from "lucide-react";
import { MarkdownEditor } from "@/components/markdown-editor";
import {
    ResizablePanelGroup,
    ResizablePanel,
    ResizableHandle,
} from "@/components/ui/resizable";
import { useState } from "react";
import { WorkInstructionStep, ActionType } from "@prisma/client";
import { ProductionSidebar } from "./production-sidebar";
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

interface WorkInstructionsViewerProps {
    steps: WorkInstructionStepWithActions[];
    workOrder: WorkOrder;
    className?: string;
}

export function WorkInstructionsViewer({ steps, workOrder, className }: WorkInstructionsViewerProps) {
    const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

    // Auto-select first step when component mounts
    useState(() => {
        if (steps.length > 0 && !selectedStepId) {
            setSelectedStepId(steps[0].id);
        }
    });

    const selectedStep = selectedStepId 
        ? steps.find(step => step.id === selectedStepId) || null
        : null;

    // Function to advance to the next step
    const advanceToNextStep = (currentStepId: string) => {
        const currentStepIndex = steps.findIndex(step => step.id === currentStepId);
        if (currentStepIndex !== -1 && currentStepIndex < steps.length - 1) {
            const nextStep = steps[currentStepIndex + 1];
            setSelectedStepId(nextStep.id);
        }
    };

    return (
        <ResizablePanelGroup direction="horizontal" className="min-h-[calc(100vh-5rem)] max-h-[calc(100vh-5rem)]">
            {/* Left – Step list */}
            <ResizablePanel
                defaultSize={25}
                minSize={20}
                maxSize={40}
                className="justify-between border-r"
            >
                <ScrollArea className="h-full w-full">
                    <div className="p-2 space-y-2 w-full">
                        {steps.map((step) => (
                            <div
                                key={step.id}
                                className={`
                                    p-3 space-y-1 rounded-lg border shadow-sm items-center cursor-pointer w-full
                                    ${selectedStepId === step.id 
                                        ? 'bg-blue-50 border-blue-500' 
                                        : 'hover:bg-accent border-border hover:border-blue-200'}
                                `}
                                onClick={() => setSelectedStepId(step.id)}
                            >
                                <div className="flex items-center gap-2 w-full">
                                    <span className="text-xs text-muted-foreground font-medium">Step {step.stepNumber}</span>
                                    <Badge variant="outline">{step.estimatedLabourTime} min</Badge>
                                </div>
                                <h4 className="text-sm font-medium truncate">
                                    {step.title}
                                </h4>


                                {/* <div className={`
                                    flex items-center justify-center rounded-full w-9 h-9 shrink-0
                                    ${selectedStepId === step.id 
                                        ? 'bg-white' 
                                        : 'bg-muted text-muted-foreground'}
                                `}>
                                    {step.stepNumber}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className="font-medium truncate">
                                        {step.title}
                                    </h4>
                                    <p className="text-sm">
                                        {step.estimatedLabourTime} min
                                    </p>
                                </div> */}
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Center – Instructions */}
            <ResizablePanel
                defaultSize={55}
                minSize={40}
                maxSize={70}
                className="h-full m-2 mx-2 bg-transparent"
            >
                <Card className="h-full">
                    <CardHeader className="flex flex-row justify-between items-center">
                        <CardTitle className="text-2xl">{selectedStep?.title}</CardTitle>
                        <Badge className="px-2 py-1">
                            <Clock className="h-3 w-3 mr-1" />
                            {selectedStep?.estimatedLabourTime} min
                        </Badge>
                    </CardHeader>
                    <CardContent>
                        {selectedStep ? (
                            <div className="space-y-4">
                                <div className="prose max-w-none h-[calc(100vh-16rem)] overflow-y-auto scrollbar-hide">
                                    <MarkdownEditor
                                        key={`${selectedStep.id}-production`}
                                        initialContent={selectedStep.instructions}
                                        updateContent={() => {}}
                                        hideSaveStatus
                                        hideWordCount
                                        readOnly
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                <p>Select a step to view instructions</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Right – Sidebar with Actions, Comments, Files */}
            <ResizablePanel
                defaultSize={25}
                minSize={20}
                maxSize={40}
                className="border-l flex flex-col justify-between"
            >
                <ProductionSidebar 
                    step={selectedStep} 
                    workOrder={workOrder} 
                    onStepCompleted={advanceToNextStep}
                />
            </ResizablePanel>
        </ResizablePanelGroup>
    );
}
