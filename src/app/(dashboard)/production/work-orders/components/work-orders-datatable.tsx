'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState
} from '@tanstack/react-table';
import { ArrowUpDown, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ProductionStatusBadge } from './production-status-badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { UserAvatarList } from '@/components/ui/user-avatar-list';
import { DeleteAlert } from '@/components/delete-alert';
import { WorkOrders } from '../queries';
import { deleteWorkOrder } from '@/lib/actions';
import { PermissionGate } from '@/components/rbac/permission-gate';
import { PERMISSIONS } from '@/lib/rbac';
import { DataTable } from '@/components/ui/data-table';

// WorkOrderData is the type of the work orders that are returned from the database
type WorkOrderData = WorkOrders['workOrders'][0];

// ----------------------------- Table columns -----------------------------
function getColumns({
  onDeleteClick
}: {
  onDeleteClick: (wo: WorkOrderData) => void;
}): ColumnDef<WorkOrderData>[] {
  return [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          onClick={(e) => e.stopPropagation()}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          onClick={(e) => e.stopPropagation()}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false
    },
    {
      accessorKey: 'workOrderNumber',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          WO #
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div>{row.getValue('workOrderNumber')}</div>
    },
    {
      id: 'partInfo',
      header: 'Part',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span>{row.original.part?.name ?? '—'}</span>
          <span className="text-xs text-muted-foreground">
            {row.original.part?.partNumber ?? ''}/
            {row.original.part?.partRevision ?? ''}
          </span>
        </div>
      ),
      enableSorting: false
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        return <ProductionStatusBadge status={status} />;
      }
    },
    {
      id: 'assigned',
      header: 'Assigned',
      cell: ({ row }) => {
        const assignedUsers = row.original.assignees.map(
          (assignee) => assignee.user
        );
        return assignedUsers.length > 0 ? (
          <UserAvatarList users={assignedUsers} maxVisible={3} />
        ) : (
          <span className="text-muted-foreground text-sm">Unassigned</span>
        );
      },
      enableSorting: false
    },
    {
      accessorKey: 'partQty',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Qty
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div>{row.getValue('partQty')}</div>
    },
    {
      accessorKey: 'dueDate',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Due
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const value: Date | null = row.getValue('dueDate') ?? null;
        return (
          <div>{value ? format(new Date(value), 'MMM d, yyyy') : '—'}</div>
        );
      }
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        const wo = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              onClick={(e) => e.stopPropagation()}
            >
              <Link href={`/production/${wo.id}/edit`}>
                <DropdownMenuItem>Edit</DropdownMenuItem>
              </Link>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(wo.id)}
              >
                Copy work order ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Link href={`/production/${wo.id}`}>View details</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <PermissionGate permission={PERMISSIONS.WORK_ORDERS.DELETE}>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteClick(wo);
                  }}
                >
                  Delete work order
                </DropdownMenuItem>
              </PermissionGate>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      }
    }
  ];
}

// --------------------------- Main component ------------------------------
export function WorkOrdersDataTable({
  workOrders,
  totalCount,
  refetchAction
}: {
  workOrders: WorkOrderData[];
  totalCount: number;
  refetchAction: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = Number(searchParams.get('page') || '1');
  const limit = Number(searchParams.get('limit') || '10');
  const sortBy = searchParams.get('sortBy') || '';
  const sortOrder = (searchParams.get('sortOrder') || 'asc') as 'asc' | 'desc';
  const query = searchParams.get('query') || '';

  const pageCount = Math.max(1, Math.ceil(totalCount / Math.max(1, limit)));

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workOrderToDelete, setWorkOrderToDelete] =
    useState<WorkOrderData | null>(null);

  const updateSearchParams = useCallback(
    (params: Record<string, string | number | null>) => {
      const current = new URLSearchParams(searchParams.toString());
      Object.entries(params).forEach(([key, value]) => {
        if (value === null || value === '') {
          current.delete(key);
        } else {
          current.set(key, String(value));
        }
      });
      router.push(`${pathname}?${current.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const handlePaginationChange = useCallback(
    (pagination: { pageIndex: number; pageSize: number }) => {
      updateSearchParams({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize
      });
    },
    [updateSearchParams]
  );

  const handleSortingChange = useCallback(
    (sorting: SortingState) => {
      if (sorting.length > 0) {
        updateSearchParams({
          sortBy: sorting[0].id,
          sortOrder: sorting[0].desc ? 'desc' : 'asc',
          page: 1
        });
      } else {
        updateSearchParams({ sortBy: null, sortOrder: null, page: 1 });
      }
    },
    [updateSearchParams]
  );

  const handleFilterChange = useCallback(
    (filters: ColumnFiltersState) => {
      const searchFilter = filters.find((f) => f.id === 'workOrderNumber');
      updateSearchParams({
        query: (searchFilter?.value as string) || null,
        page: 1
      });
    },
    [updateSearchParams]
  );

  const handleDeleteClick = useCallback((workOrder: WorkOrderData) => {
    setWorkOrderToDelete(workOrder);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!workOrderToDelete) return;
    const result = await deleteWorkOrder(workOrderToDelete.id);
    if (result.success) {
      setDeleteDialogOpen(false);
      setWorkOrderToDelete(null);
      refetchAction();
    } else {
      console.error('Failed to delete work order:', result.error);
    }
  }, [workOrderToDelete, refetchAction]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialogOpen(false);
    setWorkOrderToDelete(null);
  }, []);

  const columns = getColumns({ onDeleteClick: handleDeleteClick });

  return (
    <div className="w-full">
      <DataTable
        columns={columns}
        data={workOrders || []}
        pageCount={pageCount}
        pagination={{ pageIndex: page - 1, pageSize: limit }}
        onPaginationChange={handlePaginationChange}
        sorting={sortBy ? [{ id: sortBy, desc: sortOrder === 'desc' }] : []}
        onSortingChange={handleSortingChange}
        columnFilters={query ? [{ id: 'workOrderNumber', value: query }] : []}
        onColumnFiltersChange={handleFilterChange}
        searchKey="workOrderNumber"
        searchPlaceholder="Filter work orders..."
        onRowClick={(row) => router.push(`/production/${row.original.id}`)}
      />

      <DeleteAlert
        isOpen={deleteDialogOpen}
        onCloseAction={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        resourceName={`${workOrderToDelete?.workOrderNumber || ''}`}
      />
    </div>
  );
}
