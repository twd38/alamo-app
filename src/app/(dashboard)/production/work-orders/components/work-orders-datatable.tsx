'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import debounce from 'lodash/debounce';
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
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

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import Link from 'next/link';
import { UserAvatarList } from '@/components/ui/user-avatar-list';
import { DeleteAlert } from '@/components/delete-alert';
import { WorkOrders } from '../queries';
import { deleteWorkOrder } from '@/lib/actions';
import { PermissionGate } from '@/components/rbac/permission-gate';
import { PERMISSIONS } from '@/lib/rbac';
import { WorkOrderStatus } from '@prisma/client';

// WorkOrderData is the type of the work orders that are returned from the database
type WorkOrderData = WorkOrders['workOrders'][0];

// ----------------------------- Table columns -----------------------------
const columns: ColumnDef<WorkOrderData>[] = [
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
    header: 'Status',
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
    header: 'Qty',
    cell: ({ row }) => <div>{row.getValue('partQty')}</div>
  },
  {
    accessorKey: 'dueDate',
    header: 'Due',
    cell: ({ row }) => {
      const value: Date | null = row.getValue('dueDate') ?? null;
      return <div>{value ? format(new Date(value), 'MMM d, yyyy') : '—'}</div>;
    },
    sortingFn: 'datetime'
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row, table }) => {
      const wo = row.original;
      const { handleDeleteClick } = table.options.meta as {
        handleDeleteClick: (wo: WorkOrderData) => void;
      };

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
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
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
                  handleDeleteClick(wo);
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

// --------------------------- Main component ------------------------------
export function WorkOrdersDataTable({
  workOrders,
  totalCount,
  refetch,
  onTableReady
}: {
  workOrders: WorkOrderData[];
  totalCount: number;
  refetch: () => void;
  onTableReady?: (table: any) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ---------------------------------------------------- URL-state helpers
  const initialQuery = searchParams.get('query') || '';
  const initialPage = Number(searchParams.get('page') || '1');
  const initialLimit = Number(searchParams.get('limit') || '10');

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [searchValue, setSearchValue] = useState<string>(initialQuery);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workOrderToDelete, setWorkOrderToDelete] =
    useState<WorkOrderData | null>(null);

  // Debounced URL update on search
  const updateSearchQuery = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (value) {
        params.set('query', value);
        params.set('page', '1');
      } else {
        params.delete('query');
      }

      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const debouncedUpdateQuery = useMemo(
    () => debounce(updateSearchQuery, 500),
    [updateSearchQuery]
  );

  useEffect(() => {
    return () => {
      debouncedUpdateQuery.cancel();
    };
  }, [debouncedUpdateQuery]);

  const updatePage = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', page.toString());
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const handleDeleteClick = useCallback((workOrder: WorkOrderData) => {
    setWorkOrderToDelete(workOrder);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!workOrderToDelete) return;

    const result = await deleteWorkOrder(workOrderToDelete.id);

    if (result.success) {
      // Close dialog and reset state
      setDeleteDialogOpen(false);
      setWorkOrderToDelete(null);

      // Refresh the page data to reflect the deletion
      refetch();
    } else {
      // Handle error - you might want to show a toast notification here
      console.error('Failed to delete work order:', result.error);
    }
  }, [workOrderToDelete, refetch]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialogOpen(false);
    setWorkOrderToDelete(null);
  }, []);

  const table = useReactTable({
    data: workOrders,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection
    },
    meta: {
      handleDeleteClick
    }
  });

  // Early return after hooks are called
  if (!workOrders) return null;

  // Notify parent component when table is ready
  useEffect(() => {
    if (onTableReady) {
      onTableReady(table);
    }
  }, [table, onTableReady]);

  // ------------------------------- Render -------------------------------
  return (
    <div className="w-full">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  onClick={() => router.push(`/production/${row.original.id}`)}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 pt-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{' '}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => updatePage(initialPage - 1)}
            disabled={initialPage === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => updatePage(initialPage + 1)}
            disabled={initialPage === Math.ceil(totalCount / initialLimit)}
          >
            Next
          </Button>
        </div>
      </div>

      <DeleteAlert
        isOpen={deleteDialogOpen}
        onCloseAction={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        resourceName={`${workOrderToDelete?.workOrderNumber || ''}`}
      />
    </div>
  );
}
