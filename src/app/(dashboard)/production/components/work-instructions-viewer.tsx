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
import { Clock, Box, Home, X } from 'lucide-react';
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

  // Function to open model dialog
  const openModelDialog = () => {
    setIsModelDialogOpen(true);
  };

  // Function to close model dialog
  const closeModelDialog = () => {
    setIsModelDialogOpen(false);
  };

  const RenderCheck = () => {
    console.log('RenderCheck');
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
              onLoad={(viewer: any) => {
                console.log('Autodesk viewer loaded in dialog:', viewer);
              }}
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
                  >
                    <Box className="h-4 w-4 mr-2" /> View Model
                  </Button>
                </div>

                <div className="h-px bg-border mb-4 " />

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
                  </div>
                ) : (
                  <div className="space-y-6 h-[calc(100vh-16rem)] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-2">
                          Part Details
                        </h3>
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
                                ? new Date(
                                    workOrder.dueDate
                                  ).toLocaleDateString()
                                : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium">Quantity:</span>
                            <p className="text-sm text-muted-foreground">
                              {workOrder?.partQty || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <PrintLabelButton
                              workOrderNumber={
                                workOrder?.workOrderNumber || 'N/A'
                              }
                              partNumber={workOrder?.part?.partNumber || 'N/A'}
                              partName={workOrder?.part?.name}
                              quantity={workOrder?.partQty || undefined}
                              dueDate={
                                workOrder?.dueDate
                                  ? new Date(
                                      workOrder.dueDate
                                    ).toLocaleDateString()
                                  : undefined
                              }
                              workOrderId={workOrder?.id}
                              variant="outline"
                              size="default"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-2">Assignees</h3>
                      <div className="space-y-2">
                        {workOrder?.assignees &&
                        workOrder.assignees.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {workOrder.assignees.map((assignee: any) => (
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
