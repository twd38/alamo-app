'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface DeleteAlertProps {
  isOpen: boolean;
  onCloseAction: () => void;
  onConfirm: () => void | Promise<void>;
  resourceName: string;
  confirmationText?: string; // Optional - when provided, requires typing confirmation
}

export function DeleteAlert({
  isOpen,
  onCloseAction,
  onConfirm,
  resourceName,
  confirmationText
}: DeleteAlertProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (isOpen) {
      setInputValue('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleConfirm = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    // If confirmationText is required, check if input matches
    if (confirmationText && inputValue !== confirmationText) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm();
      onCloseAction();
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = confirmationText ? inputValue === confirmationText : true;

  return (
    <AlertDialog open={isOpen} onOpenChange={onCloseAction}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Are you sure you want to delete this {resourceName}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the{' '}
            {resourceName}.
          </AlertDialogDescription>
          {confirmationText && (
            <div className="pt-4 space-y-2">
              <p className="text-sm">
                Please type{' '}
                <span className="font-medium">{confirmationText}</span> to
                confirm.
              </p>
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-no-dnd disabled={isSubmitting}>
            Cancel
          </AlertDialogCancel>
          {confirmationText ? (
            <AlertDialogAction
              disabled={!isValid || isSubmitting}
              className={cn(
                'bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white font-semibold',
                {
                  'opacity-50 cursor-not-allowed': !isValid || isSubmitting
                }
              )}
              data-no-dnd
              onClick={handleConfirm}
            >
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          ) : (
            <Button
              variant="destructive"
              data-no-dnd
              onClick={handleConfirm}
              disabled={isSubmitting}
              isLoading={isSubmitting}
              isLoadingText="Deleting..."
            >
              Delete
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
