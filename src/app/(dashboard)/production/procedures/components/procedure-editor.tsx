'use client';

import { useState, useEffect, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2 } from 'lucide-react';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle
} from '@/components/ui/resizable';
import { File as PrismaFile, Prisma } from '@prisma/client';
import { ProcedureStepList } from './procedure-step-list';
import { ProcedureContent } from './procedure-content';
import { ProcedureStepDetails } from './procedure-step-details';
import { ProcedureStepActions } from './procedure-step-actions';
import { FileList } from '@/components/files/file-list';

type ProcedureWithSteps = Prisma.ProcedureGetPayload<{
  include: {
    steps: {
      include: {
        actions: true;
        files: true;
      };
    };
    operations: {
      include: {
        workCenter: true;
      };
    };
  };
}>;

interface ProcedureEditorProps {
  procedure: ProcedureWithSteps | null;
  isLoading: boolean;
  onUpdateStep: (stepId: string, updates: any) => void;
  onAddStep: () => void;
  onRemoveStep: (stepId: string) => void;
  onReorderSteps: (stepIds: string[]) => Promise<void>;
  onCreateProcedure?: () => void;
  onAddFilesToStep: (stepId: string, files: Prisma.FileCreateInput[]) => void;
  onDeleteFilesFromStep: (stepId: string, fileIds: string[]) => void;
  revalidate: () => void;
}

export const ProcedureEditor: React.FC<ProcedureEditorProps> = ({
  procedure,
  isLoading,
  onUpdateStep,
  onAddStep,
  onRemoveStep,
  onReorderSteps,
  onCreateProcedure,
  onAddFilesToStep,
  onDeleteFilesFromStep,
  revalidate
}) => {
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

  const steps = useMemo(() => {
    return procedure?.steps || [];
  }, [procedure]);

  // Auto-select first step when data loads
  useEffect(() => {
    if (!isLoading && steps.length > 0 && !selectedStepId) {
      setSelectedStepId(steps[0].id);
    }
  }, [isLoading, steps, selectedStepId]);

  const selectedStep = selectedStepId
    ? steps.find((step) => step.id === selectedStepId) || null
    : null;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!procedure) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No procedure selected</p>
          {onCreateProcedure && (
            <Button onClick={onCreateProcedure}>Create Procedure</Button>
          )}
        </div>
      </div>
    );
  }

  const handleUploadFilesToStep = (files: Prisma.FileCreateInput[]) => {
    if (selectedStep?.id) {
      onAddFilesToStep(selectedStep.id, files);
    }
  };

  const handleDeleteFilesFromStep = (file: PrismaFile) => {
    if (selectedStep?.id) {
      onDeleteFilesFromStep(selectedStep.id, [file.id]);
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
        <ProcedureStepList
          steps={steps}
          selectedStepId={selectedStepId}
          onSelectStep={setSelectedStepId}
          onAddStep={onAddStep}
          onRemoveStep={onRemoveStep}
          onReorderSteps={onReorderSteps}
          onCreateProcedure={onCreateProcedure}
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
        <ProcedureContent
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
              onClick={() => selectedStep && onRemoveStep(selectedStep.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <TabsContent value="details" className="mt-0 h-[calc(100%-3rem)]">
            <ProcedureStepDetails step={selectedStep} onUpdateStep={onUpdateStep} />
          </TabsContent>
          <TabsContent value="actions" className="mt-0 h-[calc(100%-3rem)]">
            <ProcedureStepActions
              step={selectedStep}
              onUpdateStep={onUpdateStep}
              revalidate={revalidate}
            />
          </TabsContent>
          <TabsContent value="files" className="mt-0 h-[calc(100%-3rem)] p-4">
            <FileList
              files={selectedStep?.files || []}
              uploadPath="procedures"
              onUpload={handleUploadFilesToStep}
              onDelete={handleDeleteFilesFromStep}
            />
          </TabsContent>
        </Tabs>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};