'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Clock, Box, Home, X, Tag } from 'lucide-react';
import { MarkdownEditor } from '@/components/markdown-editor';
import AutodeskViewer from '@/components/autodesk-viewer';
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
import { PrintLabelButton } from './print-label-button';
import { WorkOrderOverview } from './work-order-overview';
import { getWorkOrder } from '../queries/getWorkOrder';
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
  const [leftPanelSize, setLeftPanelSize] = useState(25);
  const [rightPanelSize, setRightPanelSize] = useState(25);
  const [isModelDialogOpen, setIsModelDialogOpen] = useState(false);
  const searchParams = useSearchParams();

  // Create virtual Print Labels step that always appears as the last step
  const printLabelsInstructions = JSON.stringify({
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Print the required labels for this work order using the Print Label button below.'
          }
        ]
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            marks: [{ type: 'bold' }],
            text: 'This step must be completed before finishing the work order.'
          }
        ]
      }
    ]
  });

  const printLabelsStep: WorkInstructionStepWithActions = {
    id: 'print-labels-step',
    workOrderInstructionId: workOrder?.workInstruction?.id || '',
    originalStepId: null,
    stepNumber: (steps.length || 0) + 1,
    title: 'Print Labels',
    instructions: printLabelsInstructions,
    estimatedLabourTime: 1,
    requiredTools: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    startedAt: null,
    completedAt: workOrder?.labelsPrinted ? new Date() : null, // Virtual step is never pre-completed
    timeTaken: null,
    status: workOrder?.labelsPrinted ? 'COMPLETED' : 'PENDING', // Always pending until user completes the work order
    activeWorkers: 0,
    actions: []
  };

  // Combine regular steps with the virtual print labels step
  const allSteps = [...steps, printLabelsStep];

  useEffect(() => {
    // If URL has a step query param, use that to select the step
    const stepId = searchParams.get('step');
    if (stepId) {
      setSelectedStepId(stepId);
    }
  }, [searchParams]);

  const selectedStep = selectedStepId
    ? allSteps.find((step) => step.id === selectedStepId) || null
    : null;

  // Go to Overview
  const goToOverview = () => {
    setSelectedStepId(null);
  };

  // Function to advance to the next step
  const advanceToNextStep = (currentStepId: string) => {
    const currentStepIndex = allSteps.findIndex(
      (step) => step.id === currentStepId
    );
    if (currentStepIndex !== -1 && currentStepIndex < allSteps.length - 1) {
      const nextStep = allSteps[currentStepIndex + 1];
      setSelectedStepId(nextStep.id);
    }
  };

  // Function to open model dialog
  const openModelDialog = () => {
    setIsModelDialogOpen(true);
  };

  // Function to close model dialog
  const closeModelDialog = () => {
    setIsModelDialogOpen(false);
  };

  const RenderCheck = () => {
    return <div></div>;
  };

  return (
    <>
      {/* Model Dialog */}
      <Dialog open={isModelDialogOpen}>
        <DialogTitle className="sr-only">3D Model Viewer</DialogTitle>
        <DialogContent className="max-w-[100vw] max-h-[100vh] w-full h-full p-0 gap-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={closeModelDialog}
            className="h-8 w-8 absolute top-2 right-2 z-10"
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <AutodeskViewer
              urn={workOrder?.part?.apsUrn || undefined}
              width="100%"
              height="100%"
              className="rounded-lg shadow-sm"
              onLoad={(viewer: any) => {}}
              onError={(error: Error) => {
                console.error('Autodesk viewer error in dialog:', error);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Second Top Bar */}
      {/* <div className="flex justify-between items-center border-b border-border p-2 bg-background">
        <Button variant="ghost" size="icon" onClick={toggleLeftPanel}>
          <PanelLeft className="h-4 w-4" />
        </Button>

        <Button variant="ghost" size="icon" onClick={toggleRightPanel}>
          <PanelRight className="h-4 w-4" />
        </Button>
      </div> */}

      <ResizablePanelGroup
        direction="horizontal"
        className="min-h-[calc(100vh-5rem)] max-h-[calc(100vh-5rem)]"
        key={`panels-${leftPanelSize}-${rightPanelSize}`}
      >
        {/* Left – Step list */}
        <ResizablePanel
          defaultSize={leftPanelSize}
          minSize={0}
          className="justify-between border-r"
        >
          {leftPanelSize > 0 && (
            <ScrollArea className="h-full">
              <div className="p-2 space-y-2 w-full">
                <div className="flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    className={`w-full ${
                      selectedStepId === null
                        ? 'bg-blue-50 border-blue-500'
                        : 'hover:bg-accent border-border hover:border-blue-200'
                    }`}
                    onClick={goToOverview}
                  >
                    <Home className="h-4 w-4 mr-2" /> Overview
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={openModelDialog}
                    disabled={!workOrder?.part?.apsUrn}
                  >
                    <Box className="h-4 w-4 mr-2" /> View Model
                  </Button>
                </div>

                <div className="h-px bg-border mb-4 " />

                {allSteps.map((step) => (
                  <WorkInstructionStepItem
                    key={step.id}
                    step={step}
                    isSelected={selectedStepId === step.id}
                    onClick={() => setSelectedStepId(step.id)}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </ResizablePanel>

        {leftPanelSize > 0 && <ResizableHandle withHandle />}

        {/* Center – Instructions or Overview */}
        <ResizablePanel
          defaultSize={
            100 - leftPanelSize - (selectedStep ? rightPanelSize : 0)
          }
          minSize={40}
          className="min-h-[calc(100vh-5rem)] max-h-[calc(100vh-5rem)] bg-muted"
        >
          <div className="h-full overflow-y-auto scrollbar-hide">
            <Card className="m-2">
              <CardHeader className="flex flex-row justify-between items-center border-b border-border p-4">
                <CardTitle className="text-2xl">
                  {selectedStep ? selectedStep.title : 'Overview'}
                </CardTitle>
                {selectedStep && (
                  <Badge className="px-2 py-1" variant="secondary">
                    <Clock className="h-3 w-3 mr-1" />
                    {selectedStep.estimatedLabourTime} min
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="p-4">
                {selectedStep ? (
                  <div className="space-y-4">
                    <div className="prose max-w-none">
                      <MarkdownEditor
                        key={`${selectedStep.id}-production`}
                        initialContent={selectedStep.instructions}
                        updateContent={() => {}}
                        hideSaveStatus
                        hideWordCount
                        readOnly
                      />
                    </div>

                    {/* Show Print Label button for the print labels step */}
                    {selectedStep.id === 'print-labels-step' && (
                      <div className="flex justify-center pt-4">
                        <PrintLabelButton
                          workOrderNumber={workOrder?.workOrderNumber || 'N/A'}
                          partNumber={workOrder?.part?.partNumber || 'N/A'}
                          partName={workOrder?.part?.name}
                          quantity={workOrder?.partQty}
                          dueDate={
                            workOrder?.dueDate
                              ? new Date(workOrder.dueDate).toLocaleDateString()
                              : undefined
                          }
                          workOrderId={workOrder?.id}
                          variant="default"
                          size="lg"
                          className="w-full px-8"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <WorkOrderOverview workOrder={workOrder} />
                )}
              </CardContent>
            </Card>
          </div>
        </ResizablePanel>

        {selectedStep && rightPanelSize > 0 && (
          <>
            <ResizableHandle withHandle />

            {/* Right – Sidebar with Actions, Comments, Files */}
            <ResizablePanel
              defaultSize={rightPanelSize}
              minSize={0}
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
    </>
  );
}
