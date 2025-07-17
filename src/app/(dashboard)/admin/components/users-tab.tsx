'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { getUsersWithRoles } from '@/lib/rbac-actions';
import { UserDialog } from './user-dialog';
import { UsersDataTable } from './users-data-table';

interface User {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  createdAt: Date;
  userRoles: Array<{
    role: {
      id: string;
      name: string;
      description?: string | null;
    };
  }>;
}

export function UsersTab() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const {
    data: usersResult,
    isLoading,
    error
  } = useQuery({
    queryKey: ['admin-users'],
    queryFn: getUsersWithRoles
  });

  const users = usersResult?.success ? usersResult.data || [] : [];

  const handleCreateUser = () => {
    setSelectedUser(null);
    setIsDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedUser(null);
  };

  const handleUserSaved = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    handleDialogClose();
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>Failed to load users</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">
            {usersResult?.error || 'An unknown error occurred'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            Manage user accounts and their role assignments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UsersDataTable
            users={users}
            onCreateUser={handleCreateUser}
            onEditUser={handleEditUser}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      <UserDialog
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        user={selectedUser}
        onUserSaved={handleUserSaved}
      />
    </>
  );
}
