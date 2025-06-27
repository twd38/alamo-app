'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Clock, PanelLeft, PanelRight } from 'lucide-react';
import { MarkdownEditor } from '@/components/markdown-editor';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle
} from '@/components/ui/resizable';
import { useState, useEffect } from 'react';
import {
  WorkOrderWorkInstructionStep,
  WorkOrderWorkInstructionStepAction
} from '@prisma/client';
import { ProductionSidebar } from './production-sidebar';
import { WorkInstructionStepItem } from './work-instruction-step-item';
import { getWorkOrder } from '@/lib/queries';
import { useSearchParams } from 'next/navigation';

type WorkOrder = Awaited<ReturnType<typeof getWorkOrder>>;

type WorkInstructionStepWithActions = WorkOrderWorkInstructionStep & {
  actions: WorkOrderWorkInstructionStepAction[];
};

interface WorkInstructionsViewerProps {
  steps: WorkInstructionStepWithActions[];
  workOrder: WorkOrder;
  className?: string;
}

export function WorkInstructionsViewer(props: WorkInstructionsViewerProps) {
  const { steps, workOrder } = props;
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    // If URL has a step query param, use that to select the step
    const stepId = searchParams.get('step');
    if (stepId) {
      setSelectedStepId(stepId);
    }
  }, [searchParams]);

  const selectedStep = selectedStepId
    ? steps.find((step) => step.id === selectedStepId) || null
    : null;

  // Go to Overview
  const goToOverview = () => {
    setSelectedStepId(null);
  };

  // Function to advance to the next step
  const advanceToNextStep = (currentStepId: string) => {
    const currentStepIndex = steps.findIndex(
      (step) => step.id === currentStepId
    );
    if (currentStepIndex !== -1 && currentStepIndex < steps.length - 1) {
      const nextStep = steps[currentStepIndex + 1];
      setSelectedStepId(nextStep.id);
    }
  };

  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="min-h-[calc(100vh-5rem)] max-h-[calc(100vh-5rem)] "
    >
      {/* Left – Step list */}
      <ResizablePanel
        defaultSize={25}
        minSize={1}
        maxSize={40}
        className="justify-between border-r"
      >
        <ScrollArea className="h-full w-full">
          <div className="p-2 space-y-2 w-full">
            <div
              className={`p-3 space-y-1 rounded-lg border shadow-sm items-center cursor-pointer w-full ${
                !selectedStep ? 'bg-accent' : 'hover:bg-accent/50'
              }`}
              onClick={goToOverview}
            >
              <div className="flex items-center gap-2 w-full">
                <h4 className="text-sm font-medium truncate">Overview</h4>
              </div>
            </div>

            {steps.map((step) => (
              <WorkInstructionStepItem
                key={step.id}
                step={step}
                isSelected={selectedStepId === step.id}
                onClick={() => setSelectedStepId(step.id)}
              />
            ))}
          </div>
        </ScrollArea>
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* Center – Instructions or Overview */}
      <ResizablePanel
        defaultSize={selectedStep ? 55 : 65}
        minSize={40}
        className="h-full m-2 bg-transparent"
      >
        {/* <div className="flex justify-between items-center">
          <Button variant="outline" size="icon">
            <PanelLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <PanelRight className="h-4 w-4" />
          </Button>
        </div> */}
        <Card className="h-full">
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle className="text-2xl">
              {selectedStep ? selectedStep.title : 'Overview'}
            </CardTitle>
            {selectedStep && (
              <Badge className="px-2 py-1">
                <Clock className="h-3 w-3 mr-1" />
                {selectedStep.estimatedLabourTime} min
              </Badge>
            )}
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
              <div className="space-y-6 h-[calc(100vh-16rem)] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Part Details</h3>
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium">Part Name:</span>
                        <p className="text-sm text-muted-foreground">
                          {workOrder?.part?.name || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">Part Number:</span>
                        <p className="text-sm text-muted-foreground">
                          {workOrder?.part?.partNumber || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Order Details
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium">Due Date:</span>
                        <p className="text-sm text-muted-foreground">
                          {workOrder?.dueDate
                            ? new Date(workOrder.dueDate).toLocaleDateString()
                            : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">Quantity:</span>
                        <p className="text-sm text-muted-foreground">
                          {workOrder?.partQty || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Assignees</h3>
                  <div className="space-y-2">
                    {workOrder?.assignees && workOrder.assignees.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {workOrder.assignees.map((assignee) => (
                          <Badge key={assignee.user.id} variant="secondary">
                            {assignee.user.name || assignee.user.email}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No assignees specified
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Status</h3>
                  <Badge
                    variant={
                      workOrder?.status === 'COMPLETED'
                        ? 'default'
                        : workOrder?.status === 'IN_PROGRESS'
                          ? 'secondary'
                          : 'outline'
                    }
                  >
                    {workOrder?.status || 'N/A'}
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </ResizablePanel>

      {selectedStep && (
        <>
          <ResizableHandle withHandle />

          {/* Right – Sidebar with Actions, Comments, Files */}
          <ResizablePanel
            defaultSize={25}
            minSize={1}
            maxSize={40}
            className="border-l flex flex-col justify-between"
          >
            <ProductionSidebar
              step={selectedStep}
              workOrder={workOrder}
              onStepCompleted={advanceToNextStep}
            />
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  );
}
