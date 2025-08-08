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
import { ArrowUpDown, MoreHorizontal, Edit, Trash2, FileText } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
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
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { DataTablePagination } from '@/components/ui/data-table-pagination';

interface Operation {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  defaultDuration: number;
  setupTime: number;
  requiresSkill?: string | null;
  isActive: boolean;
  workCenter: {
    id: string;
    code: string;
    name: string;
  };
  procedure?: {
    id: string;
    code?: string | null;
    title: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

interface OperationsDataTableProps {
  operations: Operation[];
  totalCount: number;
  refetch: () => void;
  onTableReady?: (table: any) => void;
  onEdit?: (operation: Operation) => void;
  onAssignProcedure?: (operation: Operation) => void;
}

export function OperationsDataTable({
  operations,
  totalCount,
  refetch,
  onTableReady,
  onEdit,
  onAssignProcedure
}: OperationsDataTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState('');

  // Extract URL parameters
  const query = searchParams.get('query') || '';
  const currentPage = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 10;

  // Update local state from URL params
  useEffect(() => {
    setGlobalFilter(query);
  }, [query]);

  // Debounced search handler
  const handleSearch = useCallback(
    debounce((value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set('query', value);
      } else {
        params.delete('query');
      }
      params.set('page', '1'); // Reset to first page on search
      router.push(`${pathname}?${params.toString()}`);
    }, 300),
    [pathname, router, searchParams]
  );

  // Pagination handlers
  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(page));
    router.push(`${pathname}?${params.toString()}`);
  };

  const handlePageSizeChange = (pageSize: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('limit', String(pageSize));
    params.set('page', '1'); // Reset to first page on page size change
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleDeleteOperation = async (id: string) => {
    try {
      // Call delete API
      const response = await fetch(`/api/operations/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete operation');
      }
      
      toast.success('Operation deleted successfully');
      refetch();
    } catch (error) {
      toast.error('Failed to delete operation');
      console.error('Error deleting operation:', error);
    }
  };

  const columns: ColumnDef<Operation>[] = useMemo(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false
      },
      {
        accessorKey: 'code',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Code
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <Badge variant="outline" className="font-mono">
            {row.getValue('code')}
          </Badge>
        )
      },
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.getValue('name')}</div>
            {row.original.description && (
              <div className="text-sm text-muted-foreground">
                {row.original.description}
              </div>
            )}
          </div>
        )
      },
      {
        id: 'workCenter',
        header: 'Work Center',
        cell: ({ row }) => (
          <Badge variant="secondary">
            {row.original.workCenter.name}
          </Badge>
        )
      },
      {
        id: 'procedure',
        header: 'Procedure',
        cell: ({ row }) => {
          const procedure = row.original.procedure;
          if (procedure) {
            return (
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {procedure.code || procedure.title}
                </span>
              </div>
            );
          }
          return (
            <span className="text-sm text-muted-foreground">No procedure</span>
          );
        }
      },
      {
        id: 'duration',
        header: 'Duration',
        cell: ({ row }) => (
          <div className="text-sm">
            <div>{row.original.defaultDuration} min</div>
            {row.original.setupTime > 0 && (
              <div className="text-muted-foreground">
                Setup: {row.original.setupTime} min
              </div>
            )}
          </div>
        )
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={row.getValue('isActive') ? 'default' : 'secondary'}>
            {row.getValue('isActive') ? 'Active' : 'Inactive'}
          </Badge>
        )
      },
      {
        id: 'actions',
        enableHiding: false,
        cell: ({ row }) => {
          const operation = row.original;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onAssignProcedure?.(operation)}>
                  <FileText className="mr-2 h-4 w-4" />
                  Assign Procedure
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit?.(operation)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete operation "${operation.name}"? This action cannot be undone.`)) {
                      handleDeleteOperation(operation.id);
                    }
                  }}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        }
      }
    ],
    [onAssignProcedure, onEdit, refetch]
  );

  const table = useReactTable({
    data: operations,
    columns,
    pageCount: Math.ceil(totalCount / limit),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
      pagination: {
        pageIndex: currentPage - 1,
        pageSize: limit
      }
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true,
    manualFiltering: true
  });

  // Notify parent when table is ready
  useEffect(() => {
    onTableReady?.(table);
  }, [table, onTableReady]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search operations..."
          value={globalFilter}
          onChange={(e) => {
            setGlobalFilter(e.target.value);
            handleSearch(e.target.value);
          }}
          className="max-w-sm"
        />
      </div>
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
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No operations found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination 
        table={table}
      />
    </div>
  );
}