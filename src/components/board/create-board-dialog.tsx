"use client"

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createBoard } from '@/lib/actions';
import { getAllUsers, getUser } from '@/lib/queries';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { UserSelect } from '@/components/user-select';
import { User } from '@prisma/client';
import EmojiPicker from '@/components/emoji-picker';

const boardSchema = z.object({
  boardName: z.string().min(1, 'Board name is required'),
  isPrivate: z.boolean().default(false),
  collaboratorIds: z.array(z.string()).optional().default([]),
  icon: z.string().optional(),
});

type FormValues = z.infer<typeof boardSchema>;

interface CreateBoardDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateBoardDialog({ isOpen, onClose }: CreateBoardDialogProps) {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue, watch } = useForm<FormValues>({
    resolver: zodResolver(boardSchema),
    defaultValues: {
      boardName: '',
      isPrivate: false,
      collaboratorIds: [],
      icon: undefined,
    }
  });

  const isPrivate = watch('isPrivate');
  const collaboratorIds = watch('collaboratorIds');
  const icon = watch('icon');

  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        const fetchedUsers = await getAllUsers();
        const currentUser = await getUser();
        // Filter out the current user
        const filteredUsers = fetchedUsers.filter(
          user => user.id !== currentUser?.id
        ) as User[];
        
        setUsers(filteredUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    }
    
    if (isOpen) {
      fetchUsers();
      reset();
    }
  }, [isOpen, reset]);

  // Need to manually handle checkbox since it's not directly supported by react-hook-form
  const handleCheckboxChange = (checked: boolean) => {
    setValue('isPrivate', checked);
  };

  const handleCollaboratorsChange = (selectedIds: string | string[]) => {
    // Ensure we're setting an array of string IDs
    const ids = Array.isArray(selectedIds) ? selectedIds : [selectedIds].filter(Boolean);
    setValue('collaboratorIds', ids);
  };

  const handleEmojiClick = (emoji: string) => {
    setValue('icon', emoji);
  };

  const onSubmit = async (data: FormValues) => {
    console.log(data);
    try {
      const result = await createBoard({
        name: data.boardName,
        isPrivate: data.isPrivate,
        collaboratorIds: data.collaboratorIds,
        icon: data.icon,
      });
      
      if (result.success && result.data) {
        toast.success('Board created successfully');
        reset();
        onClose();
        // Navigate to the new board
        router.push(`/board/${result.data.id}`);
      } else {
        toast.error(result.error || 'Failed to create board');
      }
    } catch (error) {
      console.error('Error creating new board:', error);
      toast.error('Error creating new board');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Board</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 pb-4">
            <div className="space-y-2">
              <Label htmlFor="boardName">Board Name</Label>
              <div className="flex gap-2">
                <div className="relative">
                  <EmojiPicker icon={icon} onEmojiClick={handleEmojiClick} />
                </div>
                <Input
                  id="boardName"
                  className='h-10'
                  placeholder="My New Board"
                  {...register('boardName')}
                />
              </div>
              {errors.boardName && (
                <p className="text-sm text-red-500">{errors.boardName.message}</p>
              )}
            </div>
            
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox 
                id="isPrivate" 
                checked={isPrivate}
                onCheckedChange={handleCheckboxChange}
              />
              <Label htmlFor="isPrivate">Private board (only visible to you and collaborators)</Label>
            </div>

            {isPrivate && (
              <div className="space-y-2 pt-2">
                <Label>Collaborators</Label>
                {loading ? (
                  <p className="text-sm text-gray-500">Loading users...</p>
                ) : (
                  <UserSelect 
                    users={users}
                    value={collaboratorIds}
                    onChange={handleCollaboratorsChange}
                    multiSelect={true}
                    placeholder="Select collaborators"
                  />
                )}
                <p className="text-xs text-gray-500">
                  Collaborators can view and edit this board
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              Create Board
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
