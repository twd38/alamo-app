'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { DataTableRowActions } from '@/components/ui/data-table-row-actions';
import { Badge } from '@/components/ui/badge';
import { 
  CircleDot,
  CircleOff,
  Clock,
  Wrench
} from 'lucide-react';
import { Prisma } from '@prisma/client';

type OperationWithWorkCenter = Prisma.OperationGetPayload<{
  include: {
    workCenter: true;
  };
}>;

// Status icons and variants
const statuses = [
  {
    value: true,
    label: 'Active',
    icon: CircleDot,
  },
  {
    value: false,
    label: 'Inactive',
    icon: CircleOff,
  },
];

// Status options for filtering
export const statusOptions = statuses.map((status) => ({
  value: status.value.toString(),
  label: status.label,
  icon: status.icon,
}));

interface ColumnsProps {
  onEdit: (operation: OperationWithWorkCenter) => void;
  onDelete: (id: string) => void;
}

export const columns = ({
  onEdit,
  onDelete
}: ColumnsProps): ColumnDef<OperationWithWorkCenter>[] => [
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
    accessorKey: 'code',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Code" />
    ),
    cell: ({ row }) => (
      <div className="w-[100px] font-medium">{row.getValue('code')}</div>
    ),
    enableSorting: true,
    enableHiding: false,
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
    },
  },
  {
    accessorKey: 'workCenter',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Work Center" />
    ),
    cell: ({ row }) => {
      const workCenter = row.original.workCenter;
      return (
        <div className="flex w-[150px] items-center">
          <Wrench className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
          <span>{workCenter.name}</span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.original.workCenter.id);
    },
  },
  {
    accessorKey: 'defaultDuration',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Duration" />
    ),
    cell: ({ row }) => {
      const duration = row.getValue('defaultDuration') as number;
      const setupTime = row.original.setupTime;
      return (
        <div className="flex items-center w-[120px]">
          <Clock className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm">
            {duration} min
            {setupTime > 0 && (
              <span className="text-muted-foreground"> (+{setupTime})</span>
            )}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: 'requiresSkill',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Required Skill" />
    ),
    cell: ({ row }) => {
      const skill = row.getValue('requiresSkill') as string | null;
      return skill ? (
        <Badge variant="outline">{skill}</Badge>
      ) : (
        <span className="text-muted-foreground">-</span>
      );
    },
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
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <DataTableRowActions
        row={row}
        actions={[
          {
            label: 'Edit',
            onClick: (operation) => onEdit(operation as OperationWithWorkCenter),
          },
          {
            label: 'Delete',
            onClick: (operation) => onDelete((operation as OperationWithWorkCenter).id),
            separator: true,
            destructive: true,
          },
        ]}
      />
    ),
  },
];