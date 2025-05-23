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
import { Input } from '@/components/ui/input';

interface ConfirmDeleteAlertProps {
  isOpen: boolean;
  onCloseAction: () => void;
  onConfirm: () => void;
  resourceName: string;
  confirmName: string;
}

export function ConfirmDeleteAlert({
  isOpen,
  onCloseAction,
  onConfirm,
  resourceName,
  confirmName
}: ConfirmDeleteAlertProps) {
  const [value, setValue] = useState('');

  useEffect(() => {
    if (isOpen) setValue('');
  }, [isOpen]);

  const handleConfirm = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (value === confirmName) {
      onConfirm();
    }
  };

  const isValid = value === confirmName;

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
          <div className="pt-4 space-y-2">
            <p className="text-sm">
              Please type <span className="font-medium">{confirmName}</span> to
              confirm.
            </p>
            <Input value={value} onChange={(e) => setValue(e.target.value)} />
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-no-dnd>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={!isValid}
            className={cn(
              'bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white font-semibold',
              {
                'opacity-50 cursor-not-allowed': !isValid
              }
            )}
            data-no-dnd
            onClick={handleConfirm}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
