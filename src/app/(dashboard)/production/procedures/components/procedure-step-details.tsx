'use client';

import { useState, useRef, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ProcedureStep = Prisma.ProcedureStepGetPayload<{
  include: {
    actions: true;
    files: true;
  };
}>;

interface StepDetailsProps {
  step: ProcedureStep | null;
  onUpdateStep: (stepId: string, updates: any) => void;
}

export const ProcedureStepDetails: React.FC<StepDetailsProps> = ({
  step,
  onUpdateStep
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const previousValues = useRef<any | null>(null);

  const form = useForm({
    defaultValues: {
      estimatedTime: step?.estimatedTime || 0,
      requiredTools: step?.requiredTools || [],
      safetyNotes: step?.safetyNotes || '',
      qualityChecks: step?.qualityChecks || []
    }
  });

  // Update form when step changes
  useEffect(() => {
    if (step) {
      const values = {
        estimatedTime: step.estimatedTime,
        requiredTools: step.requiredTools || [],
        safetyNotes: step.safetyNotes || '',
        qualityChecks: step.qualityChecks || []
      };
      form.reset(values);
      previousValues.current = values;
      setIsEditing(false);
      setIsSaving(false);
      setSaveError(false);
    }
  }, [step, form]);

  // Optimized debounced save with shorter delay for better UX
  const debouncedSave = useDebouncedCallback(
    async (data: any) => {
      if (!step?.id) return;

      // Don't save if nothing has changed
      if (
        JSON.stringify(previousValues.current) === JSON.stringify(data)
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
          ...data
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
    600
  );

  // Watch for form changes and trigger auto-save
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (type === 'change') {
        setIsEditing(true);
        setSaveError(false);
        debouncedSave(value);
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
        <div className="space-y-4">
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
              name="estimatedTime"
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

          <div className="space-y-2">
            <Label className="text-sm">Required Tools</Label>
            <div className="space-y-2">
              {(form.watch('requiredTools') || []).map((tool, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    {...form.register(`requiredTools.${index}`)}
                    placeholder="Tool name"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const currentTools = form.getValues('requiredTools') || [];
                      form.setValue(
                        'requiredTools',
                        currentTools.filter((_, i) => i !== index)
                      );
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const currentTools = form.getValues('requiredTools') || [];
                  form.setValue('requiredTools', [...currentTools, '']);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Tool
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="safetyNotes" className="text-sm">
              Safety Notes
            </Label>
            <FormField
              control={form.control}
              name="safetyNotes"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      {...field}
                      id="safetyNotes"
                      placeholder="Important safety considerations..."
                      className="min-h-[80px]"
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Quality Checks</Label>
            <div className="space-y-2">
              {(form.watch('qualityChecks') || []).map((check, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    {...form.register(`qualityChecks.${index}`)}
                    placeholder="Quality check item"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const currentChecks = form.getValues('qualityChecks') || [];
                      form.setValue(
                        'qualityChecks',
                        currentChecks.filter((_, i) => i !== index)
                      );
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const currentChecks = form.getValues('qualityChecks') || [];
                  form.setValue('qualityChecks', [...currentChecks, '']);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Quality Check
              </Button>
            </div>
          </div>
        </div>
      </Form>
    </div>
  );
};