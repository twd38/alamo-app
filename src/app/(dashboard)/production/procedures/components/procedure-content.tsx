'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage
} from '@/components/ui/form';
import { MarkdownEditor } from '@/components/markdown-editor';
import { SavingBadge } from '@/components/ui/saving-badge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDebouncedCallback } from 'use-debounce';
import { Prisma } from '@prisma/client';

type ProcedureStep = Prisma.ProcedureStepGetPayload<{
  include: {
    actions: true;
    files: true;
  };
}>;

const stepFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  instructions: z.string(),
  estimatedTime: z.number().min(0, 'Time must be positive')
});

type StepFormData = z.infer<typeof stepFormSchema>;

interface ProcedureContentProps {
  step: ProcedureStep | null;
  onUpdateStep: (stepId: string, updates: any) => void;
}

export const ProcedureContent: React.FC<ProcedureContentProps> = ({
  step,
  onUpdateStep
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [instructions, setInstructions] = useState<string>(
    step?.instructions || '{"type": "doc", "content": []}'
  );
  const [titleValue, setTitleValue] = useState<string>(step?.title || '');
  const previousValues = useRef<StepFormData | null>(null);
  const isTypingTitle = useRef(false);

  const form = useForm<StepFormData>({
    resolver: zodResolver(stepFormSchema),
    defaultValues: {
      title: step?.title || '',
      instructions: step?.instructions || '{"type": "doc", "content": []}',
      estimatedTime: step?.estimatedTime || 0
    }
  });

  // Update form and instructions when step changes
  useEffect(() => {
    if (step && !isTypingTitle.current) {
      const initialInstructions =
        step.instructions || '{"type": "doc", "content": []}';
      setInstructions(initialInstructions);
      setTitleValue(step.title || '');
      form.reset(
        {
          title: step.title,
          instructions: initialInstructions,
          estimatedTime: step.estimatedTime
        },
        {
          keepDefaultValues: true
        }
      );
      previousValues.current = {
        title: step.title,
        instructions: initialInstructions,
        estimatedTime: step.estimatedTime
      };
      setIsEditing(false);
      setIsSaving(false);
      setSaveError(false);
    }
  }, [step, form]);

  // Debounced save function for non-title updates
  const debouncedSave = useDebouncedCallback(async (data: StepFormData) => {
    if (!step?.id) return;

    // Don't save if nothing has changed
    if (
      previousValues.current?.title === data.title &&
      previousValues.current?.instructions === data.instructions &&
      previousValues.current?.estimatedTime === data.estimatedTime
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
      console.error('Failed to update step:', error);
      setSaveError(true);
    } finally {
      setIsSaving(false);
    }
  }, 300);

  // Debounced save specifically for title updates
  const debouncedSaveTitle = useDebouncedCallback(async (title: string) => {
    if (!step?.id) return;

    const currentData = form.getValues();
    const data = { ...currentData, title };

    // Don't save if nothing has changed
    if (previousValues.current?.title === title) {
      setIsEditing(false);
      setIsSaving(false);
      setSaveError(false);
      isTypingTitle.current = false;
      return;
    }

    // Start saving
    setIsSaving(true);
    setSaveError(false);
    try {
      await onUpdateStep(step.id, data);
      previousValues.current = data;
      form.setValue('title', title, { shouldValidate: true });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update step:', error);
      setSaveError(true);
    } finally {
      setIsSaving(false);
      isTypingTitle.current = false;
    }
  }, 300);

  // Separate debounced function for instructions with slightly longer delay
  const debouncedSaveInstructions = useDebouncedCallback(
    async (content: string) => {
      if (!step?.id) return;

      const data = { ...form.getValues(), instructions: content };

      // Don't save if nothing has changed
      if (
        previousValues.current?.title === data.title &&
        previousValues.current?.instructions === data.instructions &&
        previousValues.current?.estimatedTime === data.estimatedTime
      ) {
        setIsEditing(false);
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
        console.error('Failed to update step:', error);
        setSaveError(true);
      } finally {
        setIsSaving(false);
      }
    },
    300
  );

  // Handle title changes with local state
  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTitle = e.target.value;
      setTitleValue(newTitle);
      setIsEditing(true);
      setSaveError(false);
      isTypingTitle.current = true;
      debouncedSaveTitle(newTitle);
    },
    [debouncedSaveTitle]
  );

  // Handle instructions update with dedicated debounced function
  const handleInstructionsChange = (content: string) => {
    setInstructions(content);
    setIsEditing(true);
    setSaveError(false);
    form.setValue('instructions', content, { shouldDirty: true });
    debouncedSaveInstructions(content);
  };

  // Watch for form changes (estimated time only) and trigger auto-save
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (type === 'change' && name === 'estimatedTime') {
        setIsEditing(true);
        setSaveError(false);
        debouncedSave(value as StepFormData);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, debouncedSave]);

  if (!step) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Select a step to edit</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <Form {...form}>
        <div className="h-full">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <Input
                  value={titleValue}
                  onChange={handleTitleChange}
                  className="text-xl font-semibold bg-transparent focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 cursor-text border-none shadow-none p-0"
                  placeholder={`Step ${step.stepNumber}`}
                />
              </div>
              <SavingBadge
                status={
                  saveError
                    ? 'error'
                    : isEditing || isSaving
                      ? 'saving'
                      : 'saved'
                }
              />
            </div>
          </CardHeader>
          <CardContent className="h-[calc(100%-5rem)]">
            <div className="h-full overflow-y-scroll scrollbar-hide">
              <MarkdownEditor
                key={step.id}
                initialContent={
                  step?.instructions || '{"type": "doc", "content": []}'
                }
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