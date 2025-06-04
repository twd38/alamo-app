"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2 } from "lucide-react";

export type Column<T> = {
  header: string;
  accessorKey: string;
  cell?: (value: any) => React.ReactNode;
};

interface PartsTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onDelete?: (item: T) => Promise<void>;
  onSelectionChange?: (selectedItems: T[]) => void;
  isLoading?: boolean;
}

const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

export function PartsTable<T>({
  columns,
  data,
  onDelete,
  onSelectionChange,
  isLoading = false,
}: PartsTableProps<T>) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [itemToDelete, setItemToDelete] = useState<T | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSelectRow = (id: string) => {
    const newSelectedRows = new Set(selectedRows);
    if (newSelectedRows.has(id)) {
      newSelectedRows.delete(id);
    } else {
      newSelectedRows.add(id);
    }
    setSelectedRows(newSelectedRows);

    if (onSelectionChange) {
      const selectedItems = data.filter((item: any) => newSelectedRows.has(item.id));
      onSelectionChange(selectedItems);
    }
  };

  const handleSelectAll = () => {
    if (selectedRows.size === data.length) {
      setSelectedRows(new Set());
      if (onSelectionChange) {
        onSelectionChange([]);
      }
    } else {
      const allIds = new Set(data.map((item: any) => item.id));
      setSelectedRows(allIds);
      if (onSelectionChange) {
        onSelectionChange(data);
      }
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete || !onDelete) return;

    try {
      setIsDeleting(true);
      await onDelete(itemToDelete);
      setItemToDelete(null);
    } catch (error) {
      console.error("Error deleting item:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedRows.size === data.length && data.length > 0}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              {columns.map((column) => (
                <TableHead key={String(column.accessorKey)}>
                  {column.header}
                </TableHead>
              ))}
              {onDelete && <TableHead className="w-[100px]"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length + 2} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 2} className="text-center">
                  No items found
                </TableCell>
              </TableRow>
            ) : (
              data.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedRows.has(item.id)}
                      onCheckedChange={() => handleSelectRow(item.id)}
                      aria-label={`Select item ${item.id}`}
                    />
                  </TableCell>
                  {columns.map((column) => (
                    <TableCell key={String(column.accessorKey)}>
                      {column.cell
                        ? column.cell(getNestedValue(item, column.accessorKey))
                        : String(getNestedValue(item, column.accessorKey) ?? '')}
                    </TableCell>
                  ))}
                  {onDelete && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        size="icon"
                        onClick={() => setItemToDelete(item)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently remove the selected item from the part.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
