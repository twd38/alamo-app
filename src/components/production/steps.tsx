"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Clock, Wrench } from "lucide-react";
import { MarkdownEditor } from "@/components/markdown-editor";
import {
    ResizablePanelGroup,
    ResizablePanel,
    ResizableHandle,
} from "@/components/ui/resizable";
import { useState } from "react";
import { WorkInstructionStep, ActionType } from "@prisma/client";

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
    completedAt: Date | null;
    completedBy: string | null;
    completedValue: number | null;
    uploadedFileId: string | null;
    notes: string | null;
};

type WorkInstructionStepWithActions = WorkInstructionStep & {
    actions: WorkInstructionStepAction[];
};

interface StepsProps {
    steps: WorkInstructionStepWithActions[];
    className?: string;
}

export function Steps({ steps, className }: StepsProps) {
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

    return (
        <ResizablePanelGroup direction="horizontal" className={className}>
            {/* Left – Step list */}
            <ResizablePanel
                defaultSize={25}
                minSize={15}
                maxSize={40}
                className="h-full bg-white border-r"
            >
                <ScrollArea className="h-full w-full">
                    <div className="p-2 space-y-2 w-full">
                        {steps.map((step) => (
                            <div
                                key={step.id}
                                className={`
                                    flex gap-3 p-3 rounded-lg border shadow-sm items-center cursor-pointer w-full
                                    ${selectedStepId === step.id 
                                        ? 'bg-blue-500 text-white border-blue-600' 
                                        : 'hover:bg-accent border-border hover:border-blue-200'}
                                `}
                                onClick={() => setSelectedStepId(step.id)}
                            >
                                <div className={`
                                    flex items-center justify-center rounded-full w-9 h-9 shrink-0
                                    ${selectedStepId === step.id 
                                        ? 'bg-white text-blue-500' 
                                        : 'bg-muted text-muted-foreground'}
                                `}>
                                    {step.stepNumber}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className={`font-medium truncate ${selectedStepId === step.id ? 'text-white' : 'text-foreground'}`}>
                                        {step.title}
                                    </h4>
                                    <p className={`text-sm truncate ${selectedStepId === step.id ? 'text-white/80' : 'text-muted-foreground'}`}>
                                        {step.estimatedLabourTime} min
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Center – Instructions */}
            <ResizablePanel
                defaultSize={75}
                minSize={60}
                className="h-full my-2 mx-2 bg-transparent"
            >
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle>Work Instructions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {selectedStep ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline">
                                        Step {selectedStep.stepNumber}
                                    </Badge>
                                    <h3 className="text-lg font-semibold">
                                        {selectedStep.title}
                                    </h3>
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                        <Clock className="h-4 w-4" />
                                        {selectedStep.estimatedLabourTime} min
                                    </div>
                                </div>
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
                                {selectedStep.actions.length > 0 && (
                                    <div className="mt-4 space-y-2">
                                        <h4 className="font-medium">Required Actions</h4>
                                        {selectedStep.actions.map((action) => (
                                            <div
                                                key={action.id}
                                                className="flex items-center gap-2 p-2 rounded-md bg-muted"
                                            >
                                                <Wrench className="h-4 w-4 text-muted-foreground" />
                                                <span>{action.description}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                <p>Select a step to view instructions</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </ResizablePanel>
        </ResizablePanelGroup>
    );
}
