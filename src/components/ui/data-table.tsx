'use client';

import * as React from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { DataTablePagination } from './data-table-pagination';
import { DataTableToolbar } from './data-table-toolbar';
import { Skeleton } from './skeleton';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  pagination?: {
    pageIndex: number;
    pageSize: number;
  };
  pageCount?: number;
  onPaginationChange?: (pagination: { pageIndex: number; pageSize: number }) => void;
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  columnFilters?: ColumnFiltersState;
  onColumnFiltersChange?: (filters: ColumnFiltersState) => void;
  filterColumns?: {
    id: string;
    title: string;
    options: {
      label: string;
      value: string;
      icon?: React.ComponentType<{ className?: string }>;
    }[];
  }[];
  actions?: React.ReactNode;
  loading?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder,
  pagination,
  pageCount,
  onPaginationChange,
  sorting,
  onSortingChange,
  columnFilters,
  onColumnFiltersChange,
  filterColumns,
  actions,
  loading = false,
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [columnFiltersState, setColumnFiltersState] = React.useState<ColumnFiltersState>(
    columnFilters || []
  );
  const [sortingState, setSortingState] = React.useState<SortingState>(sorting || []);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting: sortingState,
      columnVisibility,
      rowSelection,
      columnFilters: columnFiltersState,
      pagination,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: (updater) => {
      const newSorting = typeof updater === 'function' ? updater(sortingState) : updater;
      setSortingState(newSorting);
      onSortingChange?.(newSorting);
    },
    onColumnFiltersChange: (updater) => {
      const newFilters = typeof updater === 'function' ? updater(columnFiltersState) : updater;
      setColumnFiltersState(newFilters);
      onColumnFiltersChange?.(newFilters);
    },
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: onPaginationChange
      ? (updater) => {
          const newPagination =
            typeof updater === 'function'
              ? updater({ pageIndex: pagination?.pageIndex || 0, pageSize: pagination?.pageSize || 10 })
              : updater;
          onPaginationChange(newPagination);
        }
      : undefined,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    pageCount,
    manualPagination: !!onPaginationChange,
    manualSorting: !!onSortingChange,
    manualFiltering: !!onColumnFiltersChange,
  });

  return (
    <div className="space-y-2">
      <DataTableToolbar 
        table={table} 
        searchKey={searchKey}
        searchPlaceholder={searchPlaceholder}
        filterColumns={filterColumns}
        actions={actions}
      />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              // Skeleton loading state
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  {columns.map((column, cellIndex) => (
                    <TableCell key={cellIndex}>
                      {cellIndex === 0 ? (
                        // Checkbox column
                        <Skeleton className="h-4 w-4" />
                      ) : cellIndex === columns.length - 1 ? (
                        // Actions column
                        <Skeleton className="h-8 w-8 rounded-full" />
                      ) : (
                        // Regular columns
                        <Skeleton className="h-5 w-3/4" />
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
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
      <DataTablePagination table={table} />
    </div>
  );
}