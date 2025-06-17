"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Circle, UserCheck, Hash, Camera, Check } from "lucide-react";
import { ActionType } from "@prisma/client";

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
    uploadedFileId: string | null;
    notes: string | null;
};

interface ProductionActionItemProps {
    action: WorkInstructionStepAction;
    disabled?: boolean;
}

export function ProductionActionItem({ action, disabled = false }: ProductionActionItemProps) {
    console.log(action)
    // TODO: Check if the action has been completed
    const isCompleted = null;
    
    const handleActionUpdate = (value: any, completed = true) => {
        // TODO: Implement API call to update action
        console.log('Updating action:', action.id, { value, completed });
    };

    const getActionIcon = () => {
        if (isCompleted) {
            return <CheckCircle className="h-4 w-4 text-green-500" />;
        }

        switch (action.actionType) {
            case ActionType.VALUE_INPUT:
                return <Hash className="h-4 w-4 text-blue-500" />;
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
                return <ValueInputAction action={action} onUpdate={handleActionUpdate} disabled={disabled} />;
            case ActionType.CHECKBOX:
                return <CheckboxAction action={action} onUpdate={handleActionUpdate} disabled={disabled} />;
            case ActionType.SIGNOFF:
                return <SignoffAction action={action} onUpdate={handleActionUpdate} disabled={disabled} />;
            case ActionType.UPLOAD_IMAGE:
                return <UploadImageAction action={action} onUpdate={handleActionUpdate} disabled={disabled} />;
            default:
                return null;
        }
    };
    
    return (
        <div className={`border rounded-lg p-4 space-y-3 ${
            isCompleted ? "border-green-200 bg-green-50" : action.isRequired ? "border-blue-200 bg-blue-50" : ""
        }`}>
            <div className="flex items-start justify-between">
                <div className="flex space-x-2">
                    <div className="mt-1">
                        {getActionIcon()}
                    </div>
                    <h4 className="font-medium">{action.description}</h4>
                </div>
                <div className="flex items-center gap-2">
                    {action.isRequired && (
                        <Badge variant="outline" className="text-xs">
                            Required
                        </Badge>
                    )}
                    {isCompleted && (
                        <Badge variant="outline" className="text-xs bg-green-100 text-green-800">
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
            
            {isCompleted ? (
                <div className="text-sm text-green-700 bg-green-50 p-2 rounded">
                    <div className="flex items-center mb-1">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Completed
                    </div>
                    {/* {action.completedBy && <div>By: {action.completedBy}</div>}
                    {action.completedAt && <div>At: {action.completedAt.toLocaleString()}</div>}
                    {action.completedValue && (
                        <div>Value: {action.completedValue} {action.unit}</div>
                    )} */}
                    {action.notes && <div>Notes: {action.notes}</div>}
                </div>
            ) : (
                renderActionInput()
            )}
        </div>
    );
}

// Value Input Action Component
function ValueInputAction({ action, onUpdate, disabled = false }: { 
    action: WorkInstructionStepAction; 
    onUpdate: (value: any, completed?: boolean) => void;
    disabled?: boolean;
}) {
    const [inputValue, setInputValue] = useState<string>("");

    const handleSubmit = () => {
        const value = parseFloat(inputValue);
        if (isNaN(value)) return;

        let isValid = true;
        if (action.targetValue && action.tolerance) {
            const min = action.targetValue - action.tolerance;
            const max = action.targetValue + action.tolerance;
            isValid = value >= min && value <= max;
        }

        onUpdate({ value }, isValid);
    };

    return (
        <div className="space-y-3">
            <div className="space-y-2">
                <Label htmlFor={`input-${action.id}`} className="text-sm font-medium">
                    Enter Value {action.unit && `(${action.unit})`}
                </Label>
                <div className="flex space-x-2">
                    <Input
                        id={`input-${action.id}`}
                        type="number"
                        placeholder={action.targetValue ? `Target: ${action.targetValue}` : "Enter value"}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        className="flex-1"
                        disabled={disabled}
                    />
                    <Button
                        size="sm"
                        onClick={handleSubmit}
                        disabled={!inputValue || disabled}
                    >
                        Submit
                    </Button>
                </div>
                {action.targetValue && action.tolerance && (
                    <p className="text-xs text-muted-foreground">
                        Acceptable range: {action.targetValue - action.tolerance} - {action.targetValue + action.tolerance} {action.unit}
                    </p>
                )}
            </div>
        </div>
    );
}

// Checkbox Action Component
function CheckboxAction({ action, onUpdate, disabled = false }: { 
    action: WorkInstructionStepAction; 
    onUpdate: (value: any, completed?: boolean) => void;
    disabled?: boolean;
}) {
    const handleCheckboxChange = (checked: boolean) => {
        onUpdate({ checked }, checked);
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center space-x-2">
                <Checkbox
                    id={`checkbox-${action.id}`}
                    onCheckedChange={handleCheckboxChange}
                    disabled={disabled}
                />
                <Label htmlFor={`checkbox-${action.id}`} className="text-sm font-medium">
                    Mark as completed
                </Label>
            </div>
        </div>
    );
}

// Signoff Action Component
function SignoffAction({ action, onUpdate, disabled = false }: { 
    action: WorkInstructionStepAction; 
    onUpdate: (value: any, completed?: boolean) => void;
    disabled?: boolean;
}) {
    const handleSignoff = () => {
        onUpdate({ signedOff: true }, true);
    };

    return (
        <div className="space-y-3">
            {action.signoffRoles.length > 0 && (
                <div className="text-sm text-muted-foreground">
                    Requires signoff from: {action.signoffRoles.join(", ")}
                </div>
            )}
            <Button
                className="w-full"
                onClick={handleSignoff}
                disabled={disabled}
            >
                <UserCheck className="h-4 w-4 mr-2" />
                Sign Off
            </Button>
        </div>
    );
}

// Upload Image Action Component
function UploadImageAction({ action, onUpdate, disabled = false }: { 
    action: WorkInstructionStepAction; 
    onUpdate: (value: any, completed?: boolean) => void;
    disabled?: boolean;
}) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    const handleUpload = () => {
        if (!selectedFile) return;
        
        // TODO: Implement actual file upload
        onUpdate({ fileName: selectedFile.name }, true);
    };

    return (
        <div className="space-y-3">
            <div className="space-y-2">
                <Label htmlFor={`file-${action.id}`} className="text-sm font-medium">
                    Upload Image
                </Label>
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
            >
                <Camera className="h-4 w-4 mr-2" />
                Upload Image
            </Button>
        </div>
    );
} 