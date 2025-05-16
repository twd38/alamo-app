"use client"

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createBoardView } from '@/lib/actions';
import { toast } from 'react-hot-toast';
import { useFilterAtom } from '@/components/filter-popover';
import { useRouter } from 'next/navigation';

const viewSchema = z.object({
  viewName: z.string().min(1, 'View name is required'),
});

type FormValues = z.infer<typeof viewSchema>;

interface CreateViewDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateViewDialog({ isOpen, onClose }: CreateViewDialogProps) {
  // Get the current filters from the filter atom
  const [filterState] = useFilterAtom("kanban-board");
  const router = useRouter();
  
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormValues>({
    resolver: zodResolver(viewSchema),
  });

  const onSubmit = async (data: FormValues) => {
    try {
      const result = await createBoardView(data.viewName, filterState.filters);
      
      if (result.success) {
        toast.success('View created successfully');
        reset();
        onClose();
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to create view');
      }
    } catch (error) {
      console.error('Error creating new view:', error);
      toast.error('Error creating new view');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New View</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 pb-4">
            <Input
              placeholder="View Name"
              {...register('viewName')}
            />
            {errors.viewName && (
              <p className="text-sm text-red-500">{errors.viewName.message}</p>
            )}
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
