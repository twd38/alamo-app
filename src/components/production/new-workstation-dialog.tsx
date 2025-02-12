"use client"

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from 'src/components/ui/dialog';
import { Input } from 'src/components/ui/input';
import { Button } from 'src/components/ui/button';
import { createWorkStation } from 'src/app/actions';

const workstationSchema = z.object({
  workstationName: z.string().min(1, 'Workstation name is required'),
});

export default function NewWorkstationDialog({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(workstationSchema),
  });

  const onSubmit = async (data: any) => {
    try {
      await createWorkStation(data.workstationName);
      console.log('Workstation created successfully');
      onClose();
    } catch (error) {
      console.error('Error creating workstation:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Workstation</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 pb-4">
            <Input
              placeholder="Workstation Name"
              {...register('workstationName')}
            />
            {/* {errors.workstationName && <p className="text-red-500">{String(errors.workstationName.message)}</p>} */}
          </div>
          
          <DialogFooter>
            <Button type="submit">Create</Button>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}