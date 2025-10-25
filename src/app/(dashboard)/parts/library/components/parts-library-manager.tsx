'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { columns } from './columns';
import { SortingState, ColumnFiltersState } from '@tanstack/react-table';
import { getParts, GetPartsParams } from '../actions/parts';
import { NewPartDialog } from './new-part-dialog';
import { DuplicatePartDialog } from './duplicate-part-dialog';
import { Prisma } from '@prisma/client';

type PartWithImage = Prisma.PartGetPayload<{
  include: {
    partImage: true;
  };
}>;

// Type options for filtering
const partTypes = [
  { value: 'RAW_000', label: 'Raw Material' },
  { value: 'FAB_111', label: 'Fabricated' },
  { value: 'ASM_112', label: 'Assembly' },
  { value: 'PCB_113', label: 'PCB' },
  { value: 'PCA_114', label: 'PCA' },
  { value: 'FRU_115', label: 'FRU' },
  { value: 'PKG_116', label: 'Package' },
  { value: 'OTS_222', label: 'Off The Shelf' }
];

const trackingTypes = [
  { value: 'SERIAL', label: 'Serial' },
  { value: 'LOT', label: 'Lot' },
  { value: 'NONE', label: 'None' }
];

export function PartsLibraryManager() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<{
    parts: PartWithImage[];
    pageCount: number;
  }>({
    parts: [],
    pageCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [newPartDialogOpen, setNewPartDialogOpen] = useState(false);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const page = Number(searchParams.get('page')) || 1;
  const pageSize = Number(searchParams.get('pageSize')) || 10;
  const search = searchParams.get('search') || '';
  const sortBy = searchParams.get('sortBy') || 'name';
  const sortOrder = (searchParams.get('sortOrder') || 'asc') as 'asc' | 'desc';

  const fetchParts = useCallback(async () => {
    try {
      const params: GetPartsParams = {
        page,
        pageSize,
        search,
        sortBy,
        sortOrder
      };

      const result = await getParts(params);
      setData({
        parts: result.data,
        pageCount: result.totalPages
      });
    } catch (error) {
      console.error('Failed to load parts:', error);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, sortBy, sortOrder]);

  useEffect(() => {
    fetchParts();
  }, [fetchParts]);

  const updateSearchParams = (
    params: Record<string, string | number | null>
  ) => {
    const current = new URLSearchParams(searchParams.toString());

    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === '') {
        current.delete(key);
      } else {
        current.set(key, String(value));
      }
    });

    router.push(`?${current.toString()}`);
  };

  const handlePaginationChange = (pagination: {
    pageIndex: number;
    pageSize: number;
  }) => {
    updateSearchParams({
      page: pagination.pageIndex + 1,
      pageSize: pagination.pageSize
    });
  };

  const handleSortingChange = (sorting: SortingState) => {
    if (sorting.length > 0) {
      updateSearchParams({
        sortBy: sorting[0].id,
        sortOrder: sorting[0].desc ? 'desc' : 'asc'
      });
    }
  };

  const handleFilterChange = (filters: ColumnFiltersState) => {
    const searchFilter = filters.find((f) => f.id === 'name');
    updateSearchParams({
      search: (searchFilter?.value as string) || null,
      page: 1
    });
  };

  const handleCancel = () => {
    setSelectedPart(null);
    setDuplicateDialogOpen(false);
  };

  const handleDuplicate = (partId: string, partName: string) => {
    setSelectedPart({ id: partId, name: partName });
    setDuplicateDialogOpen(true);
  };

  return (
    <div className="h-full flex-1 flex-col space-y-4 md:flex">
      <div className="flex items-center justify-between space-y-1">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Parts Library</h2>
          <p className="text-muted-foreground">
            Browse and manage parts in the system
          </p>
        </div>
      </div>

      <DataTable
        loading={loading}
        columns={columns({ onDuplicate: handleDuplicate })}
        data={data.parts}
        pageCount={data.pageCount}
        pagination={{
          pageIndex: page - 1,
          pageSize
        }}
        onPaginationChange={handlePaginationChange}
        sorting={sortBy ? [{ id: sortBy, desc: sortOrder === 'desc' }] : []}
        onSortingChange={handleSortingChange}
        columnFilters={search ? [{ id: 'name', value: search }] : []}
        onColumnFiltersChange={handleFilterChange}
        searchKey="name"
        searchPlaceholder="Filter parts..."
        filterColumns={[
          {
            id: 'partType',
            title: 'Type',
            options: partTypes
          },
          {
            id: 'trackingType',
            title: 'Tracking',
            options: trackingTypes
          }
        ]}
        actions={
          <Button size="sm" onClick={() => setNewPartDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Part
          </Button>
        }
      />

      <NewPartDialog
        open={newPartDialogOpen}
        onOpenChange={setNewPartDialogOpen}
      />

      {selectedPart && (
        <DuplicatePartDialog
          partId={selectedPart.id}
          partName={selectedPart.name}
          open={duplicateDialogOpen}
          onOpenChange={setDuplicateDialogOpen}
          onCancel={handleCancel}
          onSuccess={() => {
            setDuplicateDialogOpen(false);
            fetchParts();
          }}
        />
      )}
    </div>
  );
}
