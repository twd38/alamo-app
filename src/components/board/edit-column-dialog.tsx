'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { updateKanbanSection } from '@/lib/actions';
import { toast } from 'react-hot-toast';

const columnSchema = z.object({
  name: z.string().min(1, 'Column name is required'),
});

type FormValues = z.infer<typeof columnSchema>;

interface EditColumnDialogProps {
  columnId: string;
  columnName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditColumnDialog({
  columnId,
  columnName,
  isOpen,
  onClose
}: EditColumnDialogProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormValues>({
    resolver: zodResolver(columnSchema),
    defaultValues: {
      name: columnName,
    }
  });

  const onSubmit = async (data: FormValues) => {
    try {
      const result = await updateKanbanSection(columnId, {
        name: data.name,
      });
      
      if (result.success) {
        toast.success('Column updated successfully');
        onClose();
      } else {
        toast.error(result.error || 'Failed to update column');
      }
    } catch (error) {
      console.error('Error updating column:', error);
      toast.error('Error updating column');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Column Name</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 pb-4">
            <div className="space-y-2">
              <Label htmlFor="name">Column Name</Label>
              <Input
                id="name"
                className='h-10'
                placeholder="Column Name"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} isLoading={isSubmitting}>
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 