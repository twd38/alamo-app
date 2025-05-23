'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useDebouncedCallback } from 'use-debounce';
import { updateBoard } from '@/lib/actions';
import { toast } from 'react-hot-toast';

interface EditBoardDialogProps {
  boardId: string;
  boardName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditBoardDialog({
  boardId,
  boardName,
  isOpen,
  onClose
}: EditBoardDialogProps) {
  const [name, setName] = useState(boardName);

  useEffect(() => {
    if (isOpen) {
      setName(boardName);
    }
  }, [boardName, isOpen]);

  const debouncedSave = useDebouncedCallback(async (value: string) => {
    if (!value) return;
    const result = await updateBoard(boardId, { name: value });
    if (!result.success) {
      toast.error(result.error || 'Failed to update board');
    }
  }, 500);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    debouncedSave(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Board Details</DialogTitle>
        </DialogHeader>
        <Input value={name} onChange={handleChange} />
      </DialogContent>
    </Dialog>
  );
}
