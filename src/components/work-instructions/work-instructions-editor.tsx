'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2 } from 'lucide-react';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle
} from '@/components/ui/resizable';
import { File as PrismaFile } from '@prisma/client';
import { WorkInstructionStepList } from './work-instruction-step-list';
import { WorkInstructionContent } from './work-instruction-content';
import { StepDetails } from './step-details';
import { WorkInstructionStepActions } from './work-instruction-step-actions';
import { updateWorkInstructionStep } from '@/lib/actions';
import { uploadFileToR2AndDatabase } from '@/lib/actions/file-actions';
import { FileList } from '@/components/files/file-list';

interface WorkInstructionsEditorProps {
  workInstructions: any; // Union type of PartWorkInstructions | WorkOrderWorkInstructions
  isLoading: boolean;
  onUpdateStep: (stepId: string, updates: any) => void;
  onAddStep: () => void;
  onRemoveStep: (stepId: string) => void;
  onReorderSteps: (stepIds: string[]) => Promise<void>;
  onCreateWorkInstruction?: () => void;
  revalidate: () => void;
  isWorkOrder?: boolean;
  workOrder?: {
    id: string;
    partQty: number;
  };
}

export const WorkInstructionsEditor: React.FC<WorkInstructionsEditorProps> = ({
  workInstructions,
  isLoading,
  onUpdateStep,
  onAddStep,
  onRemoveStep,
  onReorderSteps,
  onCreateWorkInstruction,
  revalidate,
  isWorkOrder = false,
  workOrder
}) => {
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

  const steps = workInstructions?.[0]?.steps || [];

  // Auto-select first step when data loads
  useEffect(() => {
    if (!isLoading && steps.length > 0 && !selectedStepId) {
      setSelectedStepId(steps[0].id);
    }
  }, [isLoading, steps, selectedStepId]);

  const selectedStep: any = selectedStepId
    ? steps.find((step: any) => step.id === selectedStepId) || null
    : null;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const handleUpdateWorkInstructionStepFiles = async (files: File[]) => {
    console.log(files);
    const file = files[0];
    const stepId = selectedStep?.id;

    try {
      // 1. Upload files
      const uploadedFile = await uploadFileToR2AndDatabase(
        file,
        'work-instructions',
        {
          stepId
        }
      );

      // 2. Update work instruction step
      const updatedFilesArray = [
        ...(selectedStep?.files || []),
        uploadedFile.data?.id
      ];
      const updatedStep = await updateWorkInstructionStep({
        stepId,
        files: updatedFilesArray
      });

      if (updatedStep.success) {
        revalidate();
      }
    } catch (error) {
      console.error('Error updating work instruction step files:', error);
    }
  };

  const handleDeleteWorkInstructionStepFile = async (file: PrismaFile) => {
    console.log(file);
    const stepId = selectedStep?.id;
    const updatedFilesArray = selectedStep?.files?.filter(
      (f: PrismaFile) => f.id !== file.id
    );
    console.log(updatedFilesArray);

    const updatedStep = await updateWorkInstructionStep({
      stepId,
      files: updatedFilesArray
    });

    if (updatedStep.success) {
      revalidate();
    }
  };

  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="w-full min-h-[calc(100vh-6rem)] max-h-[calc(100vh-6rem)] bg-zinc-50 dark:bg-zinc-900"
    >
      {/* Left – Step list */}
      <ResizablePanel
        defaultSize={25}
        minSize={15}
        maxSize={40}
        className="h-full bg-white border-r"
      >
        <WorkInstructionStepList
          steps={steps}
          selectedStepId={selectedStepId}
          onSelectStep={setSelectedStepId}
          onAddStep={onAddStep}
          onRemoveStep={onRemoveStep}
          onReorderSteps={onReorderSteps}
          onCreateWorkInstruction={onCreateWorkInstruction}
        />
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* Center – Markdown editor */}
      <ResizablePanel
        defaultSize={50}
        minSize={35}
        maxSize={65}
        className="h-full my-2 mx-2 bg-transparent"
      >
        <WorkInstructionContent
          step={selectedStep}
          onUpdateStep={onUpdateStep}
        />
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* Right – Step details & actions */}
      <ResizablePanel
        defaultSize={25}
        minSize={15}
        maxSize={40}
        className="h-full bg-white border-l"
      >
        <Tabs defaultValue="details" className="h-full">
          <div className="border-b">
            <TabsList className="w-full justify-start h-10 p-0 bg-transparent border-b-0">
              <TabsTrigger
                value="details"
                className="data-[state=active]:bg-background rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 h-10"
              >
                Step Details
              </TabsTrigger>
              <TabsTrigger
                value="actions"
                className="data-[state=active]:bg-background rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 h-10"
              >
                Actions
              </TabsTrigger>
              <TabsTrigger
                value="files"
                className="data-[state=active]:bg-background rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 h-10"
              >
                Files
              </TabsTrigger>
            </TabsList>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-6 w-6"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <TabsContent value="details" className="mt-0 h-[calc(100%-3rem)]">
            <StepDetails step={selectedStep} onUpdateStep={onUpdateStep} />
          </TabsContent>
          <TabsContent value="actions" className="mt-0 h-[calc(100%-3rem)]">
            <WorkInstructionStepActions
              step={selectedStep}
              onUpdateStep={onUpdateStep}
              revalidate={revalidate}
              isWorkOrder={isWorkOrder}
              workOrder={workOrder}
            />
          </TabsContent>
          <TabsContent value="files" className="mt-0 h-[calc(100%-3rem)] p-4">
            {/* <FileList
              files={selectedStep?.files || []}
              onUpload={handleUpdateWorkInstructionStepFiles}
              onDelete={handleDeleteWorkInstructionStepFile}
            /> */}
          </TabsContent>
        </Tabs>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};
