// Update view dialog

import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';


import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { updateBoardView } from '@/lib/actions';
import { useRouter } from 'next/navigation';

const viewSchema = z.object({
  name: z.string().min(1, 'View name is required'),
});

type FormValues = z.infer<typeof viewSchema>;

interface UpdateViewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  boardViewId: string;
  initialViewName: string;
  initialFilters: any;
}

export default function UpdateViewDialog({ isOpen, onClose, boardViewId, initialViewName, initialFilters }: UpdateViewDialogProps) {
  const router = useRouter();

  // Reset the form with the initial view name and filters when the dialog is opened
  useEffect(() => {
    reset({
      name: initialViewName,
    });
  }, [isOpen]);
  
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormValues>({
    resolver: zodResolver(viewSchema),
    defaultValues: {
      name: initialViewName,
    }
  });

  const onSubmit = async (data: FormValues) => {
    try {
      const result = await updateBoardView(boardViewId, {
        name: data.name,
        filters: initialFilters,
      });
      
      if (result.success) {
        toast.success('View updated successfully');
        reset();
        onClose();
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to update view');
      }
    } catch (error) {
      console.error('Error updating view:', error);
      toast.error('Error updating view');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update View</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 pb-4">
            <Input
              placeholder="View Name"
              {...register('name')}
              defaultValue={initialViewName}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
            <div>
              <h3 className="text-sm font-medium">Current Filters:</h3>
              <pre className="bg-gray-100 p-2 rounded text-xs text-black">
                {JSON.stringify(initialFilters, null, 2)}
              </pre>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              Update
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

