'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from 'src/components/ui/alert-dialog';
import { Button } from 'src/components/ui/button';

interface DeleteAlertProps {
  isOpen: boolean;
  onCloseAction: () => void;
  onConfirm: () => Promise<void>;
  resourceName: string;
}

export function DeleteAlert({
  isOpen,
  onCloseAction,
  onConfirm,
  resourceName
}: DeleteAlertProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onConfirm();
    onCloseAction();

    setIsSubmitting(false);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onCloseAction}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Are you sure you want to delete this {resourceName}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the{' '}
            {resourceName}
            and remove the data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-no-dnd>Cancel</AlertDialogCancel>
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
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
