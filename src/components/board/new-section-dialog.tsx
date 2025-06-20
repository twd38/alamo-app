'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from 'src/components/ui/dialog';
import { Input } from 'src/components/ui/input';
import { Button } from 'src/components/ui/button';
import { createKanbanSection } from '@/lib/actions';

const sectionSchema = z.object({
  sectionName: z.string().min(1, 'Section name is required')
});

export default function NewSectionDialog({
  boardId,
  isOpen,
  onClose
}: {
  boardId: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm({
    resolver: zodResolver(sectionSchema)
  });

  const onSubmit = async (data: any) => {
    try {
      await createKanbanSection(data.sectionName, boardId);
      // clear the form
      reset();
      console.log('Section created successfully');
      onClose();
    } catch (error) {
      console.error('Error creating new section:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Section</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 pb-4">
            <Input placeholder="Section Name" {...register('sectionName')} />
            {/* {errors.workstationName && <p className="text-red-500">{String(errors.workstationName.message)}</p>} */}
          </div>

          <DialogFooter>
            <Button type="submit" isLoading={isSubmitting}>
              Create
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
