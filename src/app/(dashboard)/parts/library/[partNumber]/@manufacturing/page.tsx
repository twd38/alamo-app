"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Clock, Wrench, Plus, Loader2, Check, Trash2 } from "lucide-react";
import { MarkdownEditor } from "@/components/markdown-editor";
import useSWR, { mutate } from "swr";
import { useParams } from "next/navigation";
import { getPartWorkInstructions, PartWorkInstructions } from "@/lib/queries";
import { Prisma, WorkInstructionStep, ActionType } from "@prisma/client";
import { 
    createWorkInstruction, 
    createWorkInstructionStep,
    updateWorkInstructionStep,
    createWorkInstructionStepAction,
    updateWorkInstructionStepAction,
    deleteWorkInstructionStepAction
} from "@/lib/actions";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useDebouncedCallback } from "use-debounce";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SavingBadge } from "@/components/ui/saving-badge";
import { DynamicActionForm } from "./components/dynamic-action-form";

// *** Work Instruction Step List ***
const WorkInstructionStepList = ({ 
    partNumber,
    steps, 
    selectedStepId, 
    onSelectStep,
    onAddStep 
}: { 
    partNumber: string,
    steps: Prisma.WorkInstructionStepGetPayload<{
        include: { actions: true }
    }>[], 
    selectedStepId: string | null,
    onSelectStep: (stepId: string) => void,
    onAddStep: () => void
}) => {
    const { mutate } = useSWR<PartWorkInstructions>(
        `/parts/${partNumber}/work-instructions`, 
        () => getPartWorkInstructions(partNumber)
    );

    const handleCreateWorkInstruction = async () => {
        if (!partNumber) return;
        
        try {
            await createWorkInstruction({
                title: "New Work Instruction",
                description: "",
                instructionNumber: `WI-${Date.now()}`, // Generate a unique instruction number
                partNumber: partNumber,
                steps: [{
                    stepNumber: 1,
                    title: "Step 1",
                    instructions: `{"type": "doc","content": []}`,
                    estimatedLabourTime: 0,
                }],
            });
            
            // Refresh the data and select the first step
            const updatedData = await mutate();
            const firstStep = updatedData?.[0]?.steps?.[0];
            if (firstStep?.id) {
                onSelectStep(firstStep.id);
            }
        } catch (error) {
            console.error(error);
        }
    }

    return (
        <div className="h-full flex flex-col">
            <ScrollArea className="flex-1">
                <div className="p-3">
                    {steps.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-center bg-muted/50 p-4 rounded-lg">
                            <p className="text-muted-foreground mb-4">Add steps to create your work instructions.</p>
                            <Button 
                                onClick={handleCreateWorkInstruction}
                                className="gap-2 w-full"
                            >
                                <Plus className="h-4 w-4" />
                                Add First Step
                            </Button>
                        </div>
                    ) : (
                        <>
                            {steps.map((step) => (
                                <div 
                                    key={step.id} 
                                    className="mb-3"
                                >
                                    <div 
                                        className={`
                                            flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all
                                            border shadow-sm
                                            ${selectedStepId === step.id 
                                                ? 'bg-blue-500 text-white border-blue-600' 
                                                : 'hover:bg-accent border-border hover:border-blue-200'}
                                        `}
                                        onClick={() => onSelectStep(step.id || "")}
                                    >
                                        <div className={`
                                            flex items-center justify-center rounded-full w-9 h-9 shrink-0
                                            ${selectedStepId === step.id 
                                                ? 'bg-white text-blue-500' 
                                                : 'bg-muted text-muted-foreground'}
                                        `}>
                                            {step.stepNumber}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className={`font-medium truncate ${selectedStepId === step.id ? 'text-white' : 'text-foreground'}`}>
                                                {step.title}
                                            </h4>
                                            <p className={`text-sm truncate ${selectedStepId === step.id ? 'text-white/80' : 'text-muted-foreground'}`}>
                                                {step.estimatedLabourTime} min
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div className="mt-6 flex justify-center">
                                <Button 
                                    variant="outline" 
                                    onClick={onAddStep}
                                    className="w-full gap-2"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Step
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
};


// *** Work Instruction Content ***
const stepFormSchema = z.object({
    title: z.string().min(1, "Title is required"),
    instructions: z.string(),
    estimatedLabourTime: z.number().min(0, "Time must be positive"),
});

type StepFormData = z.infer<typeof stepFormSchema>;

const WorkInstructionContent = ({ 
    step,
    onUpdateStep
}: { 
    step: WorkInstructionStep | null,
    onUpdateStep: (stepId: string, updates: Partial<WorkInstructionStep>) => void
}) => {
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [saveError, setSaveError] = useState(false);
    const [instructions, setInstructions] = useState<string>(
        step?.instructions || "{\"type\": \"doc\", \"content\": []}"
    );
    const previousValues = useRef<StepFormData | null>(null);

    const form = useForm<StepFormData>({
        resolver: zodResolver(stepFormSchema),
        defaultValues: {
            title: step?.title || "",
            instructions: step?.instructions || "{\"type\": \"doc\", \"content\": []}",
            estimatedLabourTime: step?.estimatedLabourTime || 0,
        }
    });

    // Update form and instructions when step changes
    useEffect(() => {
        if (step) {
            const initialInstructions = step.instructions || "{\"type\": \"doc\", \"content\": []}";
            setInstructions(initialInstructions);
            form.reset({
                title: step.title,
                instructions: initialInstructions,
                estimatedLabourTime: step.estimatedLabourTime,
            }, {
                keepDefaultValues: true
            });
            previousValues.current = {
                title: step.title,
                instructions: initialInstructions,
                estimatedLabourTime: step.estimatedLabourTime,
            };
            setIsEditing(false);
            setIsSaving(false);
            setSaveError(false);
        }
    }, [step, form]);

    const debouncedSave = useDebouncedCallback(async (data: StepFormData) => {
        if (!step?.id) return;

        // Don't save if nothing has changed
        if (
            previousValues.current?.title === data.title &&
            previousValues.current?.instructions === data.instructions &&
            previousValues.current?.estimatedLabourTime === data.estimatedLabourTime
        ) {
            setIsEditing(false);
            setIsSaving(false);
            setSaveError(false);
            return;
        }

        // Start saving
        setIsSaving(true);
        setSaveError(false);
        try {
            await onUpdateStep(step.id, data);
            previousValues.current = data;
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to update step:", error);
            setSaveError(true);
        } finally {
            setIsSaving(false);
        }
    }, 2000);

    // Handle instructions update separately
    const handleInstructionsChange = (content: string) => {
        setInstructions(content);
        setIsEditing(true);
        setSaveError(false);
        form.setValue("instructions", content, { shouldDirty: true });
        debouncedSave({ ...form.getValues(), instructions: content });
    };

    // Watch for form changes (except instructions) and trigger auto-save
    useEffect(() => {
        const subscription = form.watch((value, { name, type }) => {
            if (type === "change" && name !== "instructions") {
                setIsEditing(true);
                setSaveError(false);
                debouncedSave(value as StepFormData);
            }
        });
        return () => subscription.unsubscribe();
    }, [form, debouncedSave]);

    if (!step) {
        return <></>;
    }

    return (
        <Card className="h-full">
            <Form {...form}>
                <div className="h-full">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between gap-4">
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormControl>
                                            <Input
                                                {...field}
                                                className="text-xl font-semibold bg-transparent focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 cursor-text border-none shadow-none p-0"
                                                placeholder={`Step ${step.stepNumber}`}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <SavingBadge 
                                status={
                                    saveError 
                                        ? "error" 
                                        : isEditing || isSaving 
                                            ? "saving" 
                                            : "saved"
                                }
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="h-[calc(100%-5rem)]">
                        <div className="h-full">
                            <MarkdownEditor
                                key={step.id}
                                initialContent={step?.instructions || "{\"type\": \"doc\", \"content\": []}"}
                                updateContent={handleInstructionsChange}
                                placeholder="Write, or press '/' for commands"
                                hideSaveStatus
                                hideWordCount
                            />
                        </div>
                    </CardContent>
                </div>
            </Form>
        </Card>
    );
};

// *** Step Details ***

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

type WorkInstructionStepWithActions = Prisma.WorkInstructionStepGetPayload<{
    include: { 
        actions: true;
        images: true;
    }
}> & {
    actions: WorkInstructionStepAction[];
};

interface StepDetailsProps {
    step: WorkInstructionStepWithActions | null;
    onUpdateStep: (stepId: string, updates: Partial<WorkInstructionStep>) => void;
    revalidate: () => void;
}


const StepDetails: React.FC<StepDetailsProps> = ({ step, onUpdateStep }) => {
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [saveError, setSaveError] = useState(false);
    const previousValues = useRef<{ estimatedLabourTime: number } | null>(null);

    const form = useForm<{ estimatedLabourTime: number }>({
        defaultValues: {
            estimatedLabourTime: step?.estimatedLabourTime || 0,
        }
    });

    // Update form when step changes
    useEffect(() => {
        if (step) {
            form.reset({
                estimatedLabourTime: step.estimatedLabourTime,
            });
            previousValues.current = {
                estimatedLabourTime: step.estimatedLabourTime,
            };
            setIsEditing(false);
            setIsSaving(false);
            setSaveError(false);
        }
    }, [step, form]);

    const debouncedSave = useDebouncedCallback(async (data: { estimatedLabourTime: number }) => {
        if (!step?.id) return;

        // Don't save if nothing has changed
        if (previousValues.current?.estimatedLabourTime === data.estimatedLabourTime) {
            setIsEditing(false);
            setIsSaving(false);
            setSaveError(false);
            return;
        }

        // Start saving
        setIsSaving(true);
        setSaveError(false);
        try {
            await onUpdateStep(step.id, data);
            previousValues.current = data;
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to update step:", error);
            setSaveError(true);
            if (previousValues.current) {
                form.reset(previousValues.current);
            }
        } finally {
            setIsSaving(false);
        }
    }, 1000);

    // Watch for form changes and trigger auto-save
    useEffect(() => {
        const subscription = form.watch((value, { name, type }) => {
            if (type === "change") {
                setIsEditing(true);
                setSaveError(false);
                debouncedSave(value as { estimatedLabourTime: number });
            }
        });
        return () => subscription.unsubscribe();
    }, [form, debouncedSave]);

    if (!step) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <p>Select a step to view details</p>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-4">
            <Form {...form}>
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Label htmlFor="estimatedTime" className="text-sm">
                            Estimated Time
                        </Label>
                    </div>
                    <FormField
                        control={form.control}
                        name="estimatedLabourTime"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            {...field}
                                            id="estimatedTime"
                                            type="number"
                                            min={0}
                                            className="w-32"
                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                        />
                                        <span className="text-sm text-muted-foreground">minutes</span>
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </Form>
        </div>
    );
};

// *** Step Details ***
const WorkInstructionStepActions: React.FC<StepDetailsProps> = ({ step, revalidate }) => {
    // const mutate = () => {
    //     console.log("mutating with part number", partNumber);
    // }

    if (!step) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <p>Select a step to view details</p>
            </div>
        );
    }

    const handleAddAction = async () => {
        try {
            console.log(step.id)
            // Create a new action with default values
            const result = await createWorkInstructionStepAction({
                stepId: step.id,
                actionType: ActionType.SIGNOFF,
                description: "New Action",
                isRequired: true,
            });

            if (result.success && result.data) {
                // Trigger a revalidation to get the latest data
                await revalidate();
            }
        } catch (error) {
            console.error("Failed to create action:", error);
            // Revalidate to ensure we're in sync with the server
            await revalidate();
        }
    };

    const handleDeleteAction = async (actionId: string) => {
        try {
            // Perform the delete
            const result = await deleteWorkInstructionStepAction(actionId);
            
            if (result.success) {
                // Trigger a revalidation to get the latest data
                await revalidate();
            }
        } catch (error) {
            console.error("Failed to delete action:", error);
            // Revalidate to restore the correct state
            await revalidate();
        }
    };

    const handleActionSaved = async () => {
        // Trigger a revalidation to get the latest data
        console.log("Refetching work instructions after action saved");
        await revalidate();
    };

    return (
        <div className="p-4 space-y-4 h-full overflow-y-scroll">
            <Button
                onClick={handleAddAction}
                className="w-full gap-2"
            >
                <Plus className="h-4 w-4" />
                Add Action
            </Button>

            <div className="space-y-4">
                {step.actions.map((action) => (
                    <div key={action.id} className="relative">
                        <DynamicActionForm
                            stepId={step.id}
                            action={action}
                            onActionSaved={handleActionSaved}
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-4 right-4 text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-6 w-6"
                            onClick={() => handleDeleteAction(action.id)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
};

// *** Work Instructions Editor *** (Main Component)
const WorkInstructionsEditor: React.FC = () => {
    const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
    console.log(selectedStepId)

    const params = useParams();
    const partNumber = params.partNumber as string;
    

    const { data: workInstructions, isLoading: isWorkInstructionsLoading, mutate } = useSWR<PartWorkInstructions>(
        `/api/parts/${partNumber}/work-instructions`,
        () => getPartWorkInstructions(partNumber)
    );

    console.log(workInstructions)

    const workInstructionId = workInstructions?.[0]?.id;
    const steps = workInstructions?.[0]?.steps || [];

    // Auto-select first step when data loads
    useEffect(() => {
        if (!isWorkInstructionsLoading && steps.length > 0 && !selectedStepId) {
            setSelectedStepId(steps[0].id);
        }
    }, [isWorkInstructionsLoading, steps, selectedStepId]);

    const selectedStep = selectedStepId 
        ? steps.find(step => step.id === selectedStepId) || null
        : null;

    const handleAddStep = async () => {
        // This will be implemented when we add step creation functionality
        if (!workInstructionId) return;
        try {
            await createWorkInstructionStep({
                workInstructionId: workInstructionId,
                stepNumber: steps.length + 1,
                title: "Step " + (steps.length + 1),
                instructions: `{"type": "doc","content": []}`,
                estimatedLabourTime: 0,
            });
            mutate();
        } catch (error) {
            console.error(error);
        }
    };

    const handleUpdateStep = async (stepId: string, updates: Partial<WorkInstructionStep>) => {
        console.log("handleUpdateStep", stepId, updates)
        try {
            // Optimistically update the UI
            const optimisticData = workInstructions?.map(wi => ({
                ...wi,
                steps: wi.steps.map(step => 
                    step.id === stepId 
                        ? { ...step, ...updates }
                        : step
                )
            }));
            
            // Update the cache immediately
            mutate(optimisticData, false);

            // Call the server action
            const result = await updateWorkInstructionStep({
                stepId,
                title: updates.title || '',
                instructions: updates.instructions || '',
                estimatedLabourTime: updates.estimatedLabourTime || 0,
            });

            if (!result.success) {
                throw new Error(result.error);
            }

            // Revalidate the data
            mutate();
        } catch (error) {
            // Revert the optimistic update on error
            mutate();
            console.error('Error updating step:', error);
            // You could add toast notification here
        }
    };

    if (isWorkInstructionsLoading || !partNumber) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex gap-2 h-full">
            <div className="w-1/4 h-full bg-white border-r">
                <WorkInstructionStepList 
                    partNumber={partNumber}
                    steps={steps} 
                    selectedStepId={selectedStepId}
                    onSelectStep={setSelectedStepId}
                    onAddStep={handleAddStep}
                />
            </div>
            <div className="w-2/4 h-full my-2 bg-transparent">
                <WorkInstructionContent 
                    step={selectedStep}
                    onUpdateStep={handleUpdateStep}
                />
            </div>
            <div className="w-1/4 h-full bg-white border-l">
                <Tabs defaultValue="details" className="h-full">
                    <div className="border-b">
                        <TabsList className="w-full justify-start h-12 p-0 bg-transparent border-b-0">
                            <TabsTrigger 
                                value="details"
                                className="data-[state=active]:bg-background rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 h-12"
                            >
                                Step Details
                            </TabsTrigger>
                            <TabsTrigger 
                                value="actions"
                                className="data-[state=active]:bg-background rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 h-12"
                            >
                                Actions
                            </TabsTrigger>
                        </TabsList>
                    </div>
                    <TabsContent value="details" className="mt-0 h-[calc(100%-3rem)]">
                        <StepDetails step={selectedStep} onUpdateStep={handleUpdateStep} revalidate={() => mutate()} />
                    </TabsContent>
                    <TabsContent value="actions" className="mt-0 h-[calc(100%-3rem)]">
                        <WorkInstructionStepActions step={selectedStep} onUpdateStep={handleUpdateStep} revalidate={() => mutate()} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default WorkInstructionsEditor;
