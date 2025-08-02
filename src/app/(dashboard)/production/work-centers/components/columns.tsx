'use client';

import { ColumnDef } from '@tanstack/react-table';
import { WorkCenter } from '@prisma/client';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { DataTableRowActions } from '@/components/ui/data-table-row-actions';
import { Badge } from '@/components/ui/badge';
import {
  Factory,
  Wrench,
  Package,
  TestTube,
  Truck,
  CircleDot,
  CircleOff
} from 'lucide-react';

// Type icons mapping
const typeIcons = {
  MACHINING: Factory,
  ASSEMBLY: Wrench,
  PACKAGING: Package,
  TESTING: TestTube,
  SHIPPING: Truck
};

// Status icons and variants
const statuses = [
  {
    value: true,
    label: 'Active',
    icon: CircleDot
  },
  {
    value: false,
    label: 'Inactive',
    icon: CircleOff
  }
];

// Type options for filtering
export const types = Object.entries(typeIcons).map(([key, Icon]) => ({
  value: key,
  label: key.charAt(0) + key.slice(1).toLowerCase().replace('_', ' '),
  icon: Icon
}));

// Status options for filtering
export const statusOptions = statuses.map((status) => ({
  value: status.value.toString(),
  label: status.label,
  icon: status.icon
}));

interface ColumnsProps {
  onEdit: (workCenter: WorkCenter) => void;
  onDelete: (id: string) => void;
}

export const columns = ({
  onEdit,
  onDelete
}: ColumnsProps): ColumnDef<WorkCenter>[] => [
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
    enableHiding: false
  },
  {
    accessorKey: 'code',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Code" />
    ),
    cell: ({ row }) => (
      <div className="w-[100px] font-medium">{row.getValue('code')}</div>
    ),
    enableSorting: true,
    enableHiding: false
  },
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex space-x-2">
          <span className="max-w-[300px] truncate font-medium">
            {row.getValue('name')}
          </span>
        </div>
      );
    }
  },
  {
    accessorKey: 'type',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type" />
    ),
    cell: ({ row }) => {
      const type = row.getValue('type') as keyof typeof typeIcons;
      const Icon = typeIcons[type];
      const label =
        type.charAt(0) + type.slice(1).toLowerCase().replace('_', ' ');

      return (
        <div className="flex w-[100px] items-center">
          {Icon && <Icon className="mr-1 h-3.5 w-3.5 text-muted-foreground" />}
          <span>{label}</span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    }
  },
  {
    accessorKey: 'capacity',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Capacity" />
    ),
    cell: ({ row }) => {
      const capacity = row.getValue('capacity') as number;
      return <div className="w-[80px]">{capacity} u/hr</div>;
    }
  },
  {
    accessorKey: 'efficiency',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Efficiency" />
    ),
    cell: ({ row }) => {
      const efficiency = row.getValue('efficiency') as number;
      const percentage = (efficiency * 100).toFixed(0);

      return (
        <div className="flex w-[60px] items-center">
          <span>{percentage}%</span>
        </div>
      );
    }
  },
  {
    accessorKey: 'isActive',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const isActive = row.getValue('isActive') as boolean;
      const status = statuses.find((s) => s.value === isActive);

      if (!status) {
        return null;
      }

      const Icon = status.icon;

      return (
        <div className="flex w-[80px] items-center">
          <Icon className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
          <span>{status.label}</span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const rowValue = row.getValue(id);
      return value.includes(String(rowValue));
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <DataTableRowActions
        row={row}
        actions={[
          {
            label: 'Edit',
            onClick: (workCenter) => onEdit(workCenter as WorkCenter)
          },
          {
            label: 'Delete',
            onClick: (workCenter) => onDelete((workCenter as WorkCenter).id),
            separator: true,
            destructive: true
          }
        ]}
      />
    )
  }
];
