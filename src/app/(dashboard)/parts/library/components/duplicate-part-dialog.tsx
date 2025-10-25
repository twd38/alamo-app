'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { duplicatePart } from '../actions/duplicatePart';
import { Copy } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  partNumber: z.string().min(1, { message: 'Part number is required' })
});

type FormData = z.infer<typeof formSchema>;

interface DuplicatePartDialogProps {
  partId: string;
  partName: string;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onCancel?: () => void;
  onSuccess?: () => void;
}

export const DuplicatePartDialog = ({
  partId,
  partName,
  children,
  open: propOpen,
  onOpenChange,
  onCancel,
  onSuccess
}: DuplicatePartDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = propOpen !== undefined ? propOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const router = useRouter();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: `${partName} (copy)`,
      partNumber: ''
    }
  });

  const handleSubmit = async (data: FormData) => {
    try {
      const result = await duplicatePart({
        originalPartId: partId,
        newName: data.name,
        newPartNumber: data.partNumber
      });

      if (result.success && result.data) {
        form.reset();
        toast.success('Part duplicated successfully');
        setOpen(false);

        if (onSuccess) {
          onSuccess();
        } else {
          // Navigate to the new part page using part ID
          router.push(`/parts/library/${result.data.id}`);
        }
      } else {
        toast.error(result.error || 'Failed to duplicate part');
      }
    } catch (error) {
      console.error('Error duplicating part:', error);
      toast.error('Failed to duplicate part');
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (onCancel) {
      onCancel();
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {!propOpen && (
        <DialogTrigger asChild>
          {children || (
            <Button variant="ghost" size="sm">
              <Copy className="h-4 w-4 mr-2" />
              Duplicate part
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent
        className="sm:max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle>Duplicate Part</DialogTitle>
          <DialogDescription>
            Create a copy of "{partName}" with all its associated data including
            BOM, work instructions, and files.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Part Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter new part name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="partNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Part Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter part number from NX/Teamcenter"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                isLoading={form.formState.isSubmitting}
              >
                Create Part
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
