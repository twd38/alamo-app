'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  Circle,
  UserCheck,
  Hash,
  Camera,
  Check
} from 'lucide-react';
import { ActionType, WorkOrderWorkInstructionStepAction } from '@prisma/client';
import { completeStepAction } from '@/lib/actions';
import { useRouter } from 'next/navigation';

interface ProductionActionItemProps {
  action: WorkOrderWorkInstructionStepAction;
  workOrderId: string;
  stepId: string;
  disabled?: boolean;
}

export function ProductionActionItem({
  action,
  workOrderId,
  stepId,
  disabled = false
}: ProductionActionItemProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isCompleted = !!action.completedAt;

  const handleActionUpdate = async (value: any, notes?: string) => {
    setIsSubmitting(true);
    try {
      const result = await completeStepAction({
        workOrderId,
        workOrderInstructionStepActionId: action.id,
        value: value,
        notes: notes || action.executionNotes || undefined,
        uploadedFileId: action.executionFileId || undefined
      });

      if (result.success) {
        // Refresh the page to show updated state
        router.refresh();
      } else {
        console.error(
          'Failed to complete action:',
          'error' in result ? result.error : 'Unknown error'
        );
        // You could show a toast notification here
      }
    } catch (error) {
      console.error('Error completing action:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getActionIcon = () => {
    // if (isCompleted) {
    //     return <CheckCircle className="h-4 w-4 text-green-500" />;
    // }

    switch (action.actionType) {
      case ActionType.VALUE_INPUT:
        return <Hash className="h-4 w-4 text-blue-500" />;
      case 'QUANTITY_INPUT' as ActionType:
        return <Hash className="h-4 w-4 text-green-500" />;
      case ActionType.SIGNOFF:
        return <UserCheck className="h-4 w-4 text-purple-500" />;
      case ActionType.CHECKBOX:
        return <Check className="h-4 w-4 text-gray-400" />;
      case ActionType.UPLOAD_IMAGE:
        return <Camera className="h-4 w-4 text-orange-500" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const renderActionInput = () => {
    switch (action.actionType) {
      case ActionType.VALUE_INPUT:
        return (
          <ValueInputAction
            action={action}
            onUpdate={handleActionUpdate}
            disabled={disabled}
          />
        );
      case 'QUANTITY_INPUT' as ActionType:
        return (
          <QuantityInputAction
            action={action}
            onUpdate={handleActionUpdate}
            disabled={disabled}
          />
        );
      case ActionType.CHECKBOX:
        return (
          <CheckboxAction
            action={action}
            onUpdate={handleActionUpdate}
            disabled={disabled}
          />
        );
      case ActionType.SIGNOFF:
        return (
          <SignoffAction
            action={action}
            onUpdate={handleActionUpdate}
            disabled={disabled}
          />
        );
      case ActionType.UPLOAD_IMAGE:
        return (
          <UploadImageAction
            action={action}
            onUpdate={handleActionUpdate}
            disabled={disabled}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`border rounded-lg p-4 space-y-3 ${
        isCompleted
          ? 'border-green-200 bg-green-50'
          : action.isRequired
            ? 'border-blue-200 bg-blue-50'
            : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex space-x-2">
          <div className="mt-1">{getActionIcon()}</div>
          <div className="flex items-center space-x-2">
            <h4 className="font-medium">{action.description}</h4>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {action.isRequired && !isCompleted && (
            <Badge variant="outline" className="text-xs">
              Required
            </Badge>
          )}
          {isCompleted && (
            <Badge
              variant="outline"
              className="text-xs bg-green-100 text-green-800"
            >
              Completed
            </Badge>
          )}
        </div>
      </div>

      {action.targetValue && (
        <div className="text-sm text-muted-foreground">
          Target: {action.targetValue} {action.unit}
          {action.tolerance && ` (±${action.tolerance})`}
        </div>
      )}

      {renderActionInput()}

      {/* {isCompleted && action.executionNotes && (
                <div className="text-sm text-green-700 bg-green-100 p-2 rounded border border-green-200">
                    <div className="flex items-center mb-1">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Previous Notes: {action.executionNotes}
                    </div>
                </div>
            )} */}
    </div>
  );
}

// Value Input Action Component
function ValueInputAction({
  action,
  onUpdate,
  disabled = false
}: {
  action: WorkOrderWorkInstructionStepAction;
  onUpdate: (value: any, notes?: string) => void;
  disabled?: boolean;
}) {
  const [inputValue, setInputValue] = useState<string>(
    action.executedNumberValue?.toString() || ''
  );
  const [notes, setNotes] = useState<string>('');

  // Validation logic
  const getValidationStatus = () => {
    if (!inputValue || inputValue.trim() === '') {
      return { isValid: true, errorMessage: null };
    }

    const value = parseFloat(inputValue);
    if (isNaN(value)) {
      return { isValid: false, errorMessage: 'Please enter a valid number' };
    }

    if (action.targetValue && action.tolerance) {
      const min = action.targetValue - action.tolerance;
      const max = action.targetValue + action.tolerance;
      const isValid = value >= min && value <= max;

      if (!isValid) {
        return {
          isValid: false,
          errorMessage: `Value must be between ${min} and ${max} ${action.unit || ''}`
        };
      }
    }

    return { isValid: true, errorMessage: null };
  };

  const { isValid, errorMessage } = getValidationStatus();

  const handleSubmit = () => {
    const value = parseFloat(inputValue);
    if (isNaN(value) || !isValid) return;

    onUpdate(value, notes);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor={`input-${action.id}`} className="text-sm font-medium">
          Enter Value {action.unit && `(${action.unit})`}
        </Label>
        <div className="flex space-x-2 items-center">
          <Input
            id={`input-${action.id}`}
            type="number"
            inputSize="md"
            placeholder={
              action.targetValue
                ? `Target: ${action.targetValue}`
                : 'Enter value'
            }
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className={`flex-1 ${errorMessage ? 'border-red-500 focus:border-red-500' : ''}`}
            disabled={disabled}
          />
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!inputValue || !isValid || disabled}
            variant={action.executedNumberValue ? 'outline' : 'default'}
          >
            {action.executedNumberValue ? 'Update' : 'Submit'}
          </Button>
        </div>
        {errorMessage && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
            <div className="flex items-center">
              <span className="font-medium">⚠️</span>
              <span className="ml-2">{errorMessage}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Checkbox Action Component
function CheckboxAction({
  action,
  onUpdate,
  disabled = false
}: {
  action: WorkOrderWorkInstructionStepAction;
  onUpdate: (value: any, notes?: string) => void;
  disabled?: boolean;
}) {
  const [isChecked, setIsChecked] = useState<boolean>(
    action.executedBooleanValue || false
  );

  const handleCheckboxChange = (checked: boolean) => {
    console.log('checked', checked);
    setIsChecked(checked);
    onUpdate(checked);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <Checkbox
          id={`checkbox-${action.id}`}
          checked={isChecked}
          onCheckedChange={handleCheckboxChange}
          disabled={disabled}
        />
        <Label
          htmlFor={`checkbox-${action.id}`}
          className="text-sm font-medium"
        >
          Mark as completed
        </Label>
      </div>
    </div>
  );
}

// Signoff Action Component
function SignoffAction({
  action,
  onUpdate,
  disabled = false
}: {
  action: WorkOrderWorkInstructionStepAction;
  onUpdate: (value: any, notes?: string) => void;
  disabled?: boolean;
}) {
  const isSignedOff = action.executedBooleanValue === true;

  const handleSignoff = () => {
    onUpdate(1, 'Signed off');
  };

  return (
    <div className="space-y-3">
      {action.signoffRoles.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Requires signoff from: {action.signoffRoles.join(', ')}
        </div>
      )}
      <Button
        className="w-full"
        onClick={handleSignoff}
        disabled={disabled}
        variant={isSignedOff ? 'outline' : 'default'}
      >
        <UserCheck className="h-4 w-4 mr-2" />
        {isSignedOff ? 'Re-sign Off' : 'Sign Off'}
      </Button>
    </div>
  );
}

// Upload Image Action Component
function UploadImageAction({
  action,
  onUpdate,
  disabled = false
}: {
  action: WorkOrderWorkInstructionStepAction;
  onUpdate: (value: any, notes?: string) => void;
  disabled?: boolean;
}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const hasUploadedFile = !!action.executionFileId;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) return;

    // TODO: Implement actual file upload
    onUpdate(1, `Uploaded file: ${selectedFile.name}`);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor={`file-${action.id}`} className="text-sm font-medium">
          {hasUploadedFile ? 'Replace Image' : 'Upload Image'}
        </Label>
        {hasUploadedFile && (
          <div className="text-sm text-green-700 bg-green-50 p-2 rounded border border-green-200">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-1" />
              File uploaded previously
            </div>
          </div>
        )}
        <Input
          id={`file-${action.id}`}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={disabled}
        />
        {selectedFile && (
          <p className="text-xs text-muted-foreground">
            Selected: {selectedFile.name}
          </p>
        )}
      </div>
      <Button
        className="w-full"
        onClick={handleUpload}
        disabled={!selectedFile || disabled}
        variant={hasUploadedFile ? 'outline' : 'default'}
      >
        <Camera className="h-4 w-4 mr-2" />
        {hasUploadedFile ? 'Re-upload Image' : 'Upload Image'}
      </Button>
    </div>
  );
}

// Quantity Input Action Component - specifically for work order quantity validation
function QuantityInputAction({
  action,
  onUpdate,
  disabled = false
}: {
  action: WorkOrderWorkInstructionStepAction;
  onUpdate: (value: any, notes?: string) => void;
  disabled?: boolean;
}) {
  const [inputValue, setInputValue] = useState<string>(
    action.executedNumberValue?.toString() || ''
  );
  const [notes, setNotes] = useState<string>('');

  const targetQuantity = action.targetValue || 1;

  // Validation logic for exact quantity match
  const getValidationStatus = () => {
    if (!inputValue || inputValue.trim() === '') {
      return { isValid: true, errorMessage: null };
    }

    const value = parseFloat(inputValue);
    if (isNaN(value)) {
      return { isValid: false, errorMessage: 'Please enter a valid number' };
    }

    // For quantity input, we require exact match
    if (value !== targetQuantity) {
      return {
        isValid: false,
        errorMessage: `Quantity must exactly match ${targetQuantity} ${action.unit || 'pieces'}`
      };
    }

    return { isValid: true, errorMessage: null };
  };

  const { isValid, errorMessage } = getValidationStatus();

  const handleSubmit = () => {
    const value = parseFloat(inputValue);
    if (isNaN(value) || !isValid) return;

    onUpdate(value, notes);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label
          htmlFor={`quantity-${action.id}`}
          className="text-sm font-medium text-green-700"
        >
          Input Quantity {action.unit && `(${action.unit})`}
        </Label>
        <div className="text-sm text-green-600 bg-green-50 p-2 rounded border border-green-200">
          <div className="flex items-center">
            <Hash className="h-4 w-4 mr-1" />
            <span className="font-medium">
              Required: {targetQuantity} {action.unit || 'pieces'}
            </span>
          </div>
        </div>
        <div className="flex space-x-2 items-center">
          <Input
            id={`quantity-${action.id}`}
            type="number"
            inputSize="md"
            placeholder={`Enter exactly ${targetQuantity}`}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className={`flex-1 ${errorMessage ? 'border-red-500 focus:border-red-500' : 'border-green-300 focus:border-green-500'}`}
            disabled={disabled}
          />
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!inputValue || !isValid || disabled}
            variant={action.executedNumberValue ? 'outline' : 'default'}
            className={
              action.executedNumberValue
                ? ''
                : 'bg-green-600 hover:bg-green-700'
            }
          >
            {action.executedNumberValue ? 'Update' : 'Submit'}
          </Button>
        </div>
        {errorMessage && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
            <div className="flex items-center">
              <span className="font-medium">⚠️</span>
              <span className="ml-2">{errorMessage}</span>
            </div>
          </div>
        )}
        {isValid && inputValue && parseFloat(inputValue) === targetQuantity && (
          <div className="text-sm text-green-600 bg-green-50 p-2 rounded border border-green-200">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-1" />
              <span className="font-medium">Quantity matches requirement!</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
