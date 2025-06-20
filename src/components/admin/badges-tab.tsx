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
import { getAllAccessBadges, getUsersWithoutBadges } from '@/lib/queries';
import { deleteAccessBadge } from '@/lib/admin-actions';
import { BadgesDataTable } from './badges-data-table';
import { CreateBadgeDialog } from './create-badge-dialog';
import { toast } from 'react-hot-toast';

export function BadgesTab() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const {
    data: badges = [],
    isLoading: badgesLoading,
    error: badgesError
  } = useQuery({
    queryKey: ['admin-badges'],
    queryFn: getAllAccessBadges
  });

  const { data: usersWithoutBadges = [], isLoading: usersLoading } = useQuery({
    queryKey: ['users-without-badges'],
    queryFn: getUsersWithoutBadges
  });

  const handleCreateBadge = () => {
    setIsCreateDialogOpen(true);
  };

  const handleDeleteBadge = async (badgeId: string) => {
    try {
      const result = await deleteAccessBadge(badgeId);

      if (result.success) {
        toast.success('Badge deleted successfully');
        // Invalidate both queries to refresh the data
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['admin-badges'] }),
          queryClient.invalidateQueries({ queryKey: ['users-without-badges'] })
        ]);
      } else {
        toast.error(result.error || 'Failed to delete badge');
      }
    } catch (error) {
      console.error('Error deleting badge:', error);
      toast.error('An unexpected error occurred');
    }
  };

  const handleBadgeCreated = async () => {
    toast.success('Badge created successfully');
    // Invalidate both queries to refresh the data
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin-badges'] }),
      queryClient.invalidateQueries({ queryKey: ['users-without-badges'] })
    ]);
    setIsCreateDialogOpen(false);
  };

  const handleDialogClose = () => {
    setIsCreateDialogOpen(false);
  };

  if (badgesError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>Failed to load badges</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">
            An error occurred while loading badges. Please try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Access Badges</CardTitle>
          <CardDescription>
            Manage user access badges for physical access control.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BadgesDataTable
            badges={badges}
            onCreateBadge={handleCreateBadge}
            onDeleteBadge={handleDeleteBadge}
            isLoading={badgesLoading}
          />
        </CardContent>
      </Card>

      <CreateBadgeDialog
        isOpen={isCreateDialogOpen}
        onClose={handleDialogClose}
        usersWithoutBadges={usersWithoutBadges || []}
        onBadgeCreated={handleBadgeCreated}
      />
    </>
  );
}
