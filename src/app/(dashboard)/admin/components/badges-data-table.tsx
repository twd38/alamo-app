'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Plus, Trash2, MoreHorizontal } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { AccessBadgeWithRelations } from '@/lib/queries';

interface BadgesDataTableProps {
  badges: AccessBadgeWithRelations[];
  onCreateBadge: () => void;
  onDeleteBadge: (badgeId: string) => void;
  isLoading: boolean;
}

export function BadgesDataTable({
  badges,
  onCreateBadge,
  onDeleteBadge,
  isLoading
}: BadgesDataTableProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter badges based on search query
  const filteredBadges = badges.filter(
    (badge) =>
      badge.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      badge.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      badge.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteClick = (badgeId: string, userName?: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete the badge for ${userName || 'this user'}? This action cannot be undone.`
      )
    ) {
      onDeleteBadge(badgeId);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search badges..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-[300px]"
                disabled
              />
            </div>
          </div>
          <Button disabled className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Badge
          </Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Badge ID</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                      <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                  </TableCell>
                  <TableCell>
                    <div className="h-6 w-20 bg-muted animate-pulse rounded" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="h-8 w-8 bg-muted animate-pulse rounded ml-auto" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search badges..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 w-[300px]"
            />
          </div>
        </div>
        <Button onClick={onCreateBadge} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Badge
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Badge ID</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBadges.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
                  {searchQuery
                    ? 'No badges found matching your search.'
                    : 'No badges found.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredBadges.map((badge) => (
                <TableRow key={badge.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={badge.user?.image || ''} />
                        <AvatarFallback>
                          {badge.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="font-medium">
                        {badge.user?.name || 'Unknown'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {badge.user?.email || 'No email'}
                  </TableCell>
                  <TableCell>
                    <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                      {badge.id}
                    </code>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(badge.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {badge.createdBy?.name || 'Unknown'}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            handleDeleteClick(badge.id, badge.user?.name)
                          }
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Badge
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
