'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Upload, X } from 'lucide-react';
import { createUser, updateUser, getAllRoles } from '@/lib/admin-actions';
import { assignUserRole, removeUserRole } from '@/lib/rbac-actions';

interface User {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  userRoles: Array<{
    role: {
      id: string;
      name: string;
      description?: string | null;
    };
  }>;
}

interface Role {
  id: string;
  name: string;
  description?: string | null;
}

interface UserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onUserSaved: () => void;
}

export function UserDialog({
  isOpen,
  onClose,
  user,
  onUserSaved
}: UserDialogProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [image, setImage] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!user;

  // Get all available roles
  const { data: rolesResult } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: getAllRoles
  });

  const roles = (rolesResult?.success ? rolesResult.data || [] : []) as Role[];

  // Reset form when dialog opens/closes or user changes
  useEffect(() => {
    if (isOpen) {
      if (user) {
        setName(user.name);
        setEmail(user.email);
        setImage(user.image || '');
        setSelectedRoles(user.userRoles.map((ur) => ur.role.id));
      } else {
        setName('');
        setEmail('');
        setImage('');
        setSelectedRoles([]);
      }
    }
  }, [isOpen, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isEditing) {
        // Update existing user
        const result = await updateUser(user.id, {
          name,
          image: image || null
        });

        if (!result.success) {
          console.error('Failed to update user:', result.error);
          setIsSubmitting(false);
          return;
        }

        // Handle role changes
        const currentRoleIds = user.userRoles.map((ur) => ur.role.id);
        const rolesToAdd = selectedRoles.filter(
          (roleId) => !currentRoleIds.includes(roleId)
        );
        const rolesToRemove = currentRoleIds.filter(
          (roleId) => !selectedRoles.includes(roleId)
        );

        // Add new roles
        for (const roleId of rolesToAdd) {
          const role = roles.find((r: Role) => r.id === roleId);
          if (role) {
            await assignUserRole(user.id, role.name);
          }
        }

        // Remove old roles
        for (const roleId of rolesToRemove) {
          const role = roles.find((r: Role) => r.id === roleId);
          if (role) {
            await removeUserRole(user.id, role.name);
          }
        }
      } else {
        // Create new user
        const result = await createUser({
          name,
          email,
          image: image || null
        });

        if (!result.success) {
          console.error('Failed to create user:', result.error);
          setIsSubmitting(false);
          return;
        }

        // Assign roles to new user
        if (result.data) {
          for (const roleId of selectedRoles) {
            const role = roles.find((r: Role) => r.id === roleId);
            if (role) {
              await assignUserRole(result.data.id, role.name);
            }
          }
        }
      }

      onUserSaved();
    } catch (error) {
      console.error('Error saving user:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleToggle = (roleId: string) => {
    setSelectedRoles((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit User' : 'Create User'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-center">
            <Avatar className="h-20 w-20">
              <AvatarImage src={image || ''} />
              <AvatarFallback>
                {name?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Profile Image URL</Label>
            <Input
              id="image"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter user's name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter user's email"
              disabled={isEditing}
              required
            />
            {isEditing && (
              <p className="text-xs text-muted-foreground">
                Email cannot be changed for existing users
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Roles</Label>
            <ScrollArea className="h-32 border rounded-md p-2">
              <div className="space-y-2">
                {roles.map((role: Role) => (
                  <div key={role.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`role-${role.id}`}
                      checked={selectedRoles.includes(role.id)}
                      onCheckedChange={() => handleRoleToggle(role.id)}
                    />
                    <Label
                      htmlFor={`role-${role.id}`}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="font-medium">{role.name}</div>
                      {role.description && (
                        <div className="text-xs text-muted-foreground">
                          {role.description}
                        </div>
                      )}
                    </Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !name.trim() || !email.trim()}
            >
              {isSubmitting && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {isEditing ? 'Update User' : 'Create User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
