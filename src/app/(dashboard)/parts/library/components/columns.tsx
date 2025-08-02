'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { DataTableRowActions } from '@/components/ui/data-table-row-actions';
import { formatPartType } from '@/lib/utils';
import { Prisma } from '@prisma/client';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type PartWithImage = Prisma.PartGetPayload<{
  include: {
    partImage: true;
  };
}>;

interface ColumnsProps {
  onDuplicate: (partId: string, partName: string) => void;
}

export const columns = ({ onDuplicate }: ColumnsProps): ColumnDef<PartWithImage>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Part" />
    ),
    cell: ({ row }) => {
      const router = useRouter();
      return (
        <Link
          href={`/parts/library/${row.original.id}`}
          className="flex items-center space-x-2 hover:underline"
        >
          <Image
            src={row.original?.partImage?.key || '/images/placeholder.svg'}
            alt={row.getValue('name')}
            width={32}
            height={32}
            className="rounded-sm"
          />
          <div className="flex flex-col">
            <span className="font-medium">{row.getValue('name')}</span>
            <span className="text-xs text-muted-foreground">
              {`${row.original.partNumber}/${row.original.partRevision}`}
            </span>
          </div>
        </Link>
      );
    },
  },
  {
    accessorKey: 'partType',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type" />
    ),
    cell: ({ row }) => <div>{formatPartType(row.getValue('partType'))}</div>,
  },
  {
    accessorKey: 'trackingType',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tracking Type" />
    ),
    cell: ({ row }) => <div>{row.getValue('trackingType')}</div>,
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <DataTableRowActions
        row={row}
        actions={[
          {
            label: 'Copy part ID',
            onClick: (part) => navigator.clipboard.writeText(part.id),
          },
          {
            label: 'View part details',
            onClick: (part) => window.location.href = `/parts/library/${part.id}`,
            separator: true,
          },
          {
            label: 'Edit part',
            onClick: (part) => console.log('Edit part:', part.id),
          },
          {
            label: 'Duplicate part',
            onClick: (part) => onDuplicate(part.id, part.name),
            separator: true,
          },
        ]}
      />
    ),
  },
];