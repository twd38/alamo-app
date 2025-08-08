'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { ArrowUpDown, MoreHorizontal, Edit, Trash2, FileText } from 'lucide-react';

interface Operation {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  defaultDuration: number;
  setupTime: number;
  requiresSkill?: string | null;
  isActive: boolean;
  workCenterId: string;
  procedureId?: string | null;
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

interface ColumnsProps {
  onEdit: (operation: Operation) => void;
  onDelete: (id: string) => void;
  onAssignProcedure: (operation: Operation) => void;
  workCenters: { id: string; code: string; name: string }[];
}

export const columns = ({
  onEdit,
  onDelete,
  onAssignProcedure,
  workCenters
}: ColumnsProps): ColumnDef<Operation>[] => [
  {
    accessorKey: 'code',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Code
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <Badge variant="outline" className="font-mono">
        {row.getValue('code')}
      </Badge>
    )
  },
  {
    accessorKey: 'name',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
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
    accessorFn: (row) => row.workCenter.name,
    header: 'Work Center',
    cell: ({ row }) => (
      <Badge variant="secondary">
        {row.original.workCenter.name}
      </Badge>
    ),
    filterFn: (row, id, value) => {
      return row.original.workCenter.id === value;
    }
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
    id: 'skill',
    header: 'Required Skill',
    cell: ({ row }) => {
      const skill = row.original.requiresSkill;
      return skill ? (
        <Badge variant="outline">{skill}</Badge>
      ) : (
        <span className="text-sm text-muted-foreground">None</span>
      );
    }
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
            <DropdownMenuItem onClick={() => onAssignProcedure(operation)}>
              <FileText className="mr-2 h-4 w-4" />
              Assign Procedure
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(operation)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                if (confirm(`Are you sure you want to delete operation "${operation.name}"? This action cannot be undone.`)) {
                  onDelete(operation.id);
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
];