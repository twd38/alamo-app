'use client';

import { useState, useRef, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage
} from '@/components/ui/form';
import { Prisma } from '@prisma/client';
import { useForm } from 'react-hook-form';
import { useDebouncedCallback } from 'use-debounce';

type WorkInstructionStepWithActions = Prisma.WorkInstructionStepGetPayload<{
  include: {
    actions: true;
    images: true;
  };
}>;

interface StepDetailsProps {
  step: any; // Can be WorkInstructionStepWithActions or WorkOrderWorkInstructionStepWithActions
  onUpdateStep: (stepId: string, updates: any) => void;
}

export const StepDetails: React.FC<StepDetailsProps> = ({
  step,
  onUpdateStep
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const previousValues = useRef<{ estimatedLabourTime: number } | null>(null);

  const form = useForm<{ estimatedLabourTime: number }>({
    defaultValues: {
      estimatedLabourTime: step?.estimatedLabourTime || 0
    }
  });

  // Update form when step changes
  useEffect(() => {
    if (step) {
      form.reset({
        estimatedLabourTime: step.estimatedLabourTime
      });
      previousValues.current = {
        estimatedLabourTime: step.estimatedLabourTime
      };
      setIsEditing(false);
      setIsSaving(false);
      setSaveError(false);
    }
  }, [step, form]);

  // Optimized debounced save with shorter delay for better UX
  const debouncedSave = useDebouncedCallback(
    async (data: { estimatedLabourTime: number }) => {
      if (!step?.id) return;

      // Don't save if nothing has changed
      if (
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
        // Preserve existing step data when updating
        await onUpdateStep(step.id, {
          ...step,
          estimatedLabourTime: data.estimatedLabourTime
        });
        previousValues.current = data;
        setIsEditing(false);
      } catch (error) {
        console.error('Failed to update step:', error);
        setSaveError(true);
        if (previousValues.current) {
          form.reset(previousValues.current);
        }
      } finally {
        setIsSaving(false);
      }
    },
    600 // Reduced from 1000ms to 600ms for better responsiveness
  );

  // Watch for form changes and trigger auto-save
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (type === 'change') {
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
            {(isEditing || isSaving) && (
              <span className="text-xs text-muted-foreground">
                {isSaving ? 'Saving...' : 'Unsaved changes'}
              </span>
            )}
            {saveError && (
              <span className="text-xs text-red-500">Save failed</span>
            )}
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
                      className="w-32"
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                    <span className="text-sm text-muted-foreground">
                      minutes
                    </span>
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
