import { ActionType } from '@prisma/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useDebouncedCallback } from 'use-debounce';
// Note: Action functions are now passed as props for flexibility
import { useEffect } from 'react';
import {
  ClipboardCheck,
  Upload,
  TextCursorInput,
  CheckSquare,
  Hash
} from 'lucide-react';

// Helper function to format action type text
const formatActionType = (type: string): string => {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Map action types to their respective icons
const actionTypeIcons = {
  [ActionType.VALUE_INPUT]: TextCursorInput,
  [ActionType.QUANTITY_INPUT]: Hash,
  [ActionType.UPLOAD_IMAGE]: Upload,
  [ActionType.SIGNOFF]: ClipboardCheck,
  [ActionType.CHECKBOX]: CheckSquare
};

const actionFormSchema = z.object({
  actionType: z.nativeEnum(ActionType),
  description: z.string().min(1, 'Description is required'),
  targetValue: z.number().optional(),
  unit: z.string().optional(),
  tolerance: z.number().optional(),
  signoffRoles: z.array(z.string()).optional(),
  isRequired: z.boolean().default(true),
  notes: z.string().optional()
});

type ActionFormData = z.infer<typeof actionFormSchema>;

type ActionData = {
  actionType: ActionType;
  description: string;
  targetValue?: number | null;
  unit?: string | null;
  tolerance?: number | null;
  signoffRoles?: string[] | null;
  isRequired: boolean;
  notes?: string | null;
};

interface DynamicActionFormProps {
  stepId: string;
  action?: {
    id: string;
    actionType: ActionType;
    description: string;
    targetValue: number | null;
    unit: string | null;
    tolerance: number | null;
    signoffRoles: string[] | null;
    isRequired: boolean;
    notes: string | null;
  };
  onActionSaved: () => void;
  updateAction?: (
    actionId: string,
    data: ActionData
  ) => Promise<{ success: boolean }>;
  createAction?: (
    stepId: string,
    data: ActionData
  ) => Promise<{ success: boolean }>;
  workOrder?: {
    id: string;
    partQty: number;
  };
}

export function DynamicActionForm({
  stepId,
  action,
  onActionSaved,
  updateAction,
  createAction,
  workOrder
}: DynamicActionFormProps) {
  const form = useForm<ActionFormData>({
    resolver: zodResolver(actionFormSchema),
    defaultValues: {
      actionType: action?.actionType || ActionType.SIGNOFF,
      description: action?.description || '',
      targetValue: action?.targetValue || undefined,
      unit: action?.unit || undefined,
      tolerance: action?.tolerance || undefined,
      signoffRoles: action?.signoffRoles || [],
      isRequired: action?.isRequired ?? true,
      notes: action?.notes || undefined
    }
  });

  const debouncedSave = useDebouncedCallback(async (data: ActionFormData) => {
    try {
      if (action?.id && updateAction) {
        // Update existing action
        const result = await updateAction(action.id, {
          actionType: data.actionType,
          description: data.description,
          targetValue: data.targetValue,
          unit: data.unit,
          tolerance: data.tolerance,
          signoffRoles: data.signoffRoles,
          isRequired: data.isRequired,
          notes: data.notes
        });

        if (result.success) {
          // Notify parent of successful update
          onActionSaved();
        }
      } else if (!action?.id && createAction) {
        // Create new action
        const result = await createAction(stepId, {
          actionType: data.actionType,
          description: data.description,
          targetValue: data.targetValue,
          unit: data.unit,
          tolerance: data.tolerance,
          signoffRoles: data.signoffRoles,
          isRequired: data.isRequired,
          notes: data.notes
        });

        if (result.success) {
          // Notify parent of successful creation
          onActionSaved();
        }
      }
    } catch (error) {
      console.error('Failed to save action:', error);
      // Could add toast notification here for error feedback
    }
  }, 1000);

  // Watch for form changes and trigger auto-save
  const actionType = form.watch('actionType');

  // Watch for form changes and trigger auto-save
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (type === 'change') {
        debouncedSave(form.getValues());
      }
    });
    return () => subscription.unsubscribe();
  }, [form, debouncedSave]);

  // Effect to auto-set target value for QUANTITY_INPUT actions
  useEffect(() => {
    if (actionType === ActionType.QUANTITY_INPUT && workOrder) {
      form.setValue('targetValue', workOrder.partQty);
      form.setValue('unit', 'pieces');
      form.setValue('tolerance', 0); // Exact match required
      if (!form.getValues('description')) {
        form.setValue(
          'description',
          `Input quantity (${workOrder.partQty} pieces)`
        );
      }
    }
  }, [actionType, workOrder, form]);

  return (
    <Form {...form}>
      <form className="space-y-4 p-4 border rounded-lg">
        <FormField
          control={form.control}
          name="actionType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Action Type</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  // Clear value-specific fields if changing from VALUE_INPUT to another type
                  if (
                    field.value === ActionType.VALUE_INPUT &&
                    value !== ActionType.VALUE_INPUT
                  ) {
                    form.setValue('targetValue', undefined);
                    form.setValue('unit', undefined);
                    form.setValue('tolerance', undefined);
                  }
                  // Clear quantity-specific fields if changing away from QUANTITY_INPUT
                  if (
                    field.value === ActionType.QUANTITY_INPUT &&
                    value !== ActionType.QUANTITY_INPUT
                  ) {
                    form.setValue('targetValue', undefined);
                    form.setValue('unit', undefined);
                    form.setValue('tolerance', undefined);
                  }
                }}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an action type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.values(ActionType).map((type) => {
                    const Icon = actionTypeIcons[type];
                    return (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span>{formatActionType(type)}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                  }}
                  placeholder="Enter action description"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {actionType === ActionType.VALUE_INPUT && (
          <div className="space-y-4 p-3 bg-muted/30 rounded-md">
            <h4 className="text-sm font-medium text-muted-foreground">
              Value Input Settings
            </h4>

            <FormField
              control={form.control}
              name="targetValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Value</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      value={field.value?.toString() ?? ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value ? parseFloat(value) : undefined);
                      }}
                      placeholder="Enter target value"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => {
                          field.onChange(e.target.value || undefined);
                        }}
                        placeholder="e.g., lbf, in"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tolerance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tolerance (±)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        value={field.value?.toString() ?? ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value ? parseFloat(value) : undefined);
                        }}
                        placeholder="Enter tolerance"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}

        {actionType === ActionType.QUANTITY_INPUT && (
          <div className="space-y-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <h4 className="text-sm font-medium text-blue-700">
              Quantity Input Settings
            </h4>

            {workOrder ? (
              <div className="space-y-2">
                <div className="text-sm text-blue-600">
                  This action will require input of exactly{' '}
                  <strong>{workOrder.partQty} pieces</strong> to match the work
                  order quantity.
                </div>

                <FormField
                  control={form.control}
                  name="targetValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Required Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          value={field.value?.toString() ?? ''}
                          disabled
                          className="bg-gray-50"
                        />
                      </FormControl>
                      <div className="text-xs text-gray-500">
                        Automatically set to match work order quantity
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ''}
                          disabled
                          className="bg-gray-50"
                        />
                      </FormControl>
                      <div className="text-xs text-gray-500">
                        Automatically set to "pieces"
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            ) : (
              <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                ⚠️ Quantity input will use quantity value from work order.
              </div>
            )}
          </div>
        )}

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) => {
                    field.onChange(e.target.value || undefined);
                  }}
                  placeholder="Add any additional notes"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
