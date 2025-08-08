'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import { Prisma, ActionType } from '@prisma/client';
import { toast } from 'sonner';

type ProcedureStep = Prisma.ProcedureStepGetPayload<{
  include: {
    actions: true;
    files: true;
  };
}>;

type ProcedureStepAction = Prisma.ProcedureStepActionGetPayload<{}>;

interface ProcedureStepActionsProps {
  step: ProcedureStep | null;
  onUpdateStep: (stepId: string, updates: any) => void;
  revalidate: () => void;
}

export const ProcedureStepActions: React.FC<ProcedureStepActionsProps> = ({
  step,
  onUpdateStep,
  revalidate
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<ProcedureStepAction | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    notes: '',
    isRequired: true,
    signoffRoles: [] as string[],
    targetValue: null as number | null,
    tolerance: null as number | null,
    unit: '',
    actionType: 'CHECKBOX' as ActionType
  });

  const actionTypes = [
    { value: 'CHECKBOX', label: 'Checkbox' },
    { value: 'VALUE_INPUT', label: 'Value Input' },
    { value: 'QUANTITY_INPUT', label: 'Quantity Input' },
    { value: 'UPLOAD_IMAGE', label: 'Upload Image' },
    { value: 'SIGNOFF', label: 'Sign-off' }
  ];

  const handleOpenDialog = (action?: ProcedureStepAction) => {
    if (action) {
      setEditingAction(action);
      setFormData({
        description: action.description,
        notes: action.notes || '',
        isRequired: action.isRequired,
        signoffRoles: action.signoffRoles || [],
        targetValue: action.targetValue,
        tolerance: action.tolerance,
        unit: action.unit || '',
        actionType: action.actionType
      });
    } else {
      setEditingAction(null);
      setFormData({
        description: '',
        notes: '',
        isRequired: true,
        signoffRoles: [],
        targetValue: null,
        tolerance: null,
        unit: '',
        actionType: 'CHECKBOX'
      });
    }
    setDialogOpen(true);
  };

  const handleSaveAction = async () => {
    if (!step) return;

    setSaving(true);
    try {
      const actions = step.actions || [];
      let updatedActions;

      if (editingAction) {
        // Update existing action
        updatedActions = actions.map((a) =>
          a.id === editingAction.id ? { ...a, ...formData } : a
        );
      } else {
        // Add new action
        const newAction = {
          id: `temp-${Date.now()}`, // Temporary ID for new action
          stepId: step.id,
          ...formData,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        updatedActions = [...actions, newAction];
      }

      await onUpdateStep(step.id, {
        ...step,
        actions: updatedActions
      });

      toast.success(
        editingAction ? 'Action updated successfully' : 'Action added successfully'
      );
      setDialogOpen(false);
      revalidate();
    } catch (error) {
      toast.error('Failed to save action');
      console.error('Error saving action:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAction = async (actionId: string) => {
    if (!step || !confirm('Are you sure you want to delete this action?')) return;

    try {
      const updatedActions = step.actions.filter((a) => a.id !== actionId);
      await onUpdateStep(step.id, {
        ...step,
        actions: updatedActions
      });
      toast.success('Action deleted successfully');
      revalidate();
    } catch (error) {
      toast.error('Failed to delete action');
      console.error('Error deleting action:', error);
    }
  };

  if (!step) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <p>Select a step to manage actions</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium">Step Actions</h3>
        <Button size="sm" onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Action
        </Button>
      </div>

      <ScrollArea className="h-[calc(100%-3rem)]">
        <div className="space-y-3">
          {step.actions && step.actions.length > 0 ? (
            step.actions.map((action) => (
              <div
                key={action.id}
                className="border rounded-lg p-3 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        {action.actionType}
                      </span>
                      {action.isRequired && (
                        <span className="text-xs bg-red-100 text-red-800 px-1.5 py-0.5 rounded">
                          Required
                        </span>
                      )}
                    </div>
                    <p className="text-sm mt-1">{action.description}</p>
                    {action.notes && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {action.notes}
                      </p>
                    )}
                    {action.actionType === 'VALUE_INPUT' && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Target: {action.targetValue} {action.unit}
                        {action.tolerance && ` (±${action.tolerance})`}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleOpenDialog(action)}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleDeleteAction(action.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-sm text-muted-foreground py-8">
              No actions defined for this step
            </div>
          )}
        </div>
      </ScrollArea>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingAction ? 'Edit Action' : 'Add Action'}
            </DialogTitle>
            <DialogDescription>
              Define an action that operators must perform during this step.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="actionType">Action Type</Label>
              <Select
                value={formData.actionType}
                onValueChange={(value) =>
                  setFormData({ ...formData, actionType: value as ActionType })
                }
              >
                <SelectTrigger id="actionType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {actionTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="What should be done?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Additional instructions or context"
                className="min-h-[60px]"
              />
            </div>

            {formData.actionType === 'VALUE_INPUT' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="targetValue">Target Value</Label>
                    <Input
                      id="targetValue"
                      type="number"
                      value={formData.targetValue || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          targetValue: e.target.value ? Number(e.target.value) : null
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tolerance">Tolerance</Label>
                    <Input
                      id="tolerance"
                      type="number"
                      value={formData.tolerance || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          tolerance: e.target.value ? Number(e.target.value) : null
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Input
                    id="unit"
                    value={formData.unit}
                    onChange={(e) =>
                      setFormData({ ...formData, unit: e.target.value })
                    }
                    placeholder="e.g., mm, inches, psi"
                  />
                </div>
              </>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isRequired"
                checked={formData.isRequired}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isRequired: checked as boolean })
                }
              />
              <Label
                htmlFor="isRequired"
                className="text-sm font-normal cursor-pointer"
              >
                This action is required
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAction} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingAction ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};