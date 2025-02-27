"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import Image from "next/image"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import debounce from "lodash/debounce"
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
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, MoreHorizontal, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Part } from "@prisma/client"
// Define the Part type based on the schema

// Define the columns for the table
const columns: ColumnDef<Part>[] = [
  {
    id: "select",
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
    enableHiding: false,
  },
  {
    accessorKey: "description",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Part Name/Image
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => (
      <div className="flex items-center space-x-2">
        <Image
          src="/placeholder.svg"
          alt={row.getValue("description")}
          width={32}
          height={32}
          className="rounded-sm"
        />
        <div className="flex flex-col">
          <span>{row.getValue("description")}</span>
          <span className="text-xs text-muted-foreground">{row.getValue("partNumber")}</span>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => <div>{row.getValue("category")}</div>,
  },
  {
    accessorKey: "trackingType",
    header: "Tracking Type",
    cell: ({ row }) => <div>{row.getValue("trackingType")}</div>,
  },
  {
    accessorKey: "partNumber",
    header: "",
    cell: "",
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const part = row.original

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
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(part.id)}>Copy part ID</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View part details</DropdownMenuItem>
            <DropdownMenuItem>Edit part</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

export function PartsDataTable({parts, totalCount}: {parts: Part[], totalCount: number}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  // Get the initial search query from URL or empty string
  const initialQuery = searchParams.get("query") || ""
  const initialPage = Number(searchParams.get("page") || "1")
  const initialLimit = Number(searchParams.get("limit") || "2")
  
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [searchValue, setSearchValue] = useState<string>(initialQuery)
  
  // Create a debounced function to update URL
  const updateSearchQuery = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      
      if (value) {
        params.set("query", value)
        params.set("page", "1")
      } else {
        params.delete("query")
      }
      
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams]
  )

  const debouncedUpdateQuery = useCallback(debounce(updateSearchQuery, 500), [updateSearchQuery])

  // Handle search input changes
  // This approach directly triggers the debounced URL update from the onChange handler
  // instead of using a separate useEffect, which is cleaner and more efficient
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchValue(value)
    debouncedUpdateQuery(value)
  }, [debouncedUpdateQuery])
  
  // Cleanup debounced function on component unmount
  useEffect(() => {
    return () => {
      debouncedUpdateQuery.cancel()
    }
  }, [debouncedUpdateQuery])
  
  const updatePage = useCallback((page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", page.toString())
    router.push(`${pathname}?${params.toString()}`)
  }, [router, pathname, searchParams])

  if (!parts) return null;

  const table = useReactTable({
    data: parts,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter parts..."
          value={searchValue}
          onChange={handleSearchChange}
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="ml-4">
              <Plus className="mr-2 h-4 w-4" /> Add Part
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            {/* <DialogHeader>
              <DialogTitle>Add New Part</DialogTitle>
              <DialogDescription>Enter the details for the new part. Click save when you're done.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="partNumber" className="text-right">
                  Part Number
                </Label>
                <Input id="partNumber" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Input id="description" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">
                  Category
                </Label>
                <Select>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ASSEMBLY_400">Assembly</SelectItem>
                    <SelectItem value="MODULE_300">Module</SelectItem>
                    <SelectItem value="SUBASSEMBLY_200">Subassembly</SelectItem>
                    <SelectItem value="PART_100">Part</SelectItem>
                    <SelectItem value="RAW_000">Raw</SelectItem>
                    <SelectItem value="BIN">Bin</SelectItem>
                    <SelectItem value="SHIP">Ship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="trackingType" className="text-right">
                  Tracking Type
                </Label>
                <Select>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select tracking type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SERIAL">Serial</SelectItem>
                    <SelectItem value="BATCH">Batch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Save changes</Button>
            </DialogFooter> */}
          </DialogContent>
        </Dialog>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s)
          selected.
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
          <Button variant="outline" size="sm" onClick={() => updatePage(initialPage + 1)} disabled={initialPage === Math.ceil(totalCount / initialLimit)}>
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}

