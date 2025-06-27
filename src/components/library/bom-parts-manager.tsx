'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Part, BOMType, Prisma } from '@prisma/client';
import { getParts } from '@/lib/queries';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { UseFormReturn } from 'react-hook-form';

// Interface for BOM component items
export interface BOMPartsItem {
  id: string;
  part: Part;
  qty: number;
  bomType: BOMType;
}

export interface BOMPartsManagerProps {
  defaultValues?: BOMPartsItem[];
  onChange: (bomParts: BOMPartsItem[]) => void;
  defaultBomType?: BOMType;
}

export const BOMPartsManager = ({
  defaultValues,
  onChange,
  defaultBomType = BOMType.MANUFACTURING
}: BOMPartsManagerProps) => {
  // Internal state
  const [bomParts, setBomParts] = useState<BOMPartsItem[]>(defaultValues || []);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Part[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);

  // Update form value when bomComponents changes
  useEffect(() => {
    // Store the BOM components in the form
    onChange(bomParts);
  }, [bomParts, onChange]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Auto-search when debounced query changes
  useEffect(() => {
    if (debouncedQuery && showSearchResults) {
      void searchParts();
    }
  }, [debouncedQuery, showSearchResults]);

  // Handle click outside search results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        !target.closest('.search-container') &&
        !target.closest('.search-results')
      ) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Search for parts
  const searchParts = async (): Promise<void> => {
    if (!debouncedQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await getParts({
        query: debouncedQuery,
        page: 1,
        limit: 10,
        sortBy: 'partNumber',
        sortOrder: 'asc'
      });

      setSearchResults(results);
    } catch (error) {
      console.error('Error searching parts:', error);
      toast.error('Failed to search parts');
    } finally {
      setIsSearching(false);
    }
  };

  // Add part to BOM
  const addPartToBOM = (part: Part): void => {
    // Check if part already exists in BOM
    const exists = bomParts.some((item) => item.id === part.id);
    if (exists) {
      toast.error('Part already added to BOM');
      return;
    }

    // Add part to BOM with default quantity of 1

    setBomParts([
      ...bomParts,
      {
        id: part.id,
        part: part,
        qty: 1,
        bomType: defaultBomType
      }
    ]);

    // Clear search
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  // Update BOM component quantity
  const updateComponentQuantity = (index: number, quantity: number): void => {
    const updatedComponents = [...bomParts];
    updatedComponents[index].qty = quantity;
    setBomParts(updatedComponents);
  };

  // console.log(form.getValues())

  // Remove part from BOM
  const removePartFromBOM = (index: number): void => {
    const updatedComponents = bomParts.filter((_, i) => i !== index);
    setBomParts(updatedComponents);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        {/* Search Component */}
        <div className="relative search-container">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                placeholder="Search for parts by name or number"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSearchResults(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    searchParts();
                  }
                }}
                className="pr-8"
              />
              {searchQuery && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Search Results Dropdown */}
          {showSearchResults &&
            (searchResults.length > 0 || isSearching || searchQuery) && (
              <div className="absolute z-10 mt-1 w-full bg-popover shadow-md rounded-md border overflow-hidden search-results">
                {isSearching ? (
                  <div className="text-center py-4">
                    <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Searching...
                    </p>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="max-h-60 overflow-auto">
                    {searchResults.map((part) => {
                      const isAlreadyAdded = bomParts.some(
                        (item) => item.id === part.id
                      );

                      return (
                        <div
                          key={part.id}
                          className={`flex items-center justify-between p-2 hover:bg-accent cursor-pointer ${isAlreadyAdded ? 'bg-muted/50' : ''}`}
                          onClick={() => {
                            if (!isAlreadyAdded) {
                              addPartToBOM(part);
                            }
                          }}
                        >
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {part.description}
                              </span>
                            </div>
                            <span className="text-sm text-muted-foreground truncate max-w-xs">
                              {part.partNumber}
                            </span>
                          </div>
                          {isAlreadyAdded ? (
                            <span className="text-xs text-muted-foreground px-2">
                              Added
                            </span>
                          ) : (
                            <Plus className="h-4 w-4 text-primary" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : searchQuery ? (
                  <div className="text-center py-3 text-sm text-muted-foreground">
                    No parts found
                  </div>
                ) : (
                  <div className="text-center py-3 text-sm text-muted-foreground">
                    Enter a search term to find parts
                  </div>
                )}
              </div>
            )}
        </div>
      </div>

      {/* BOM Components Table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Part</TableHead>
              <TableHead>UOM</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bomParts.length > 0 ? (
              bomParts.map((bomPart, index) => (
                <TableRow key={bomPart.id}>
                  <TableCell className="flex flex-col">
                    {bomPart.part.description}
                    <span className="text-xs text-muted-foreground">
                      {bomPart.part.partNumber}
                    </span>
                  </TableCell>
                  <TableCell>{bomPart.part.unit}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={bomPart.qty}
                      min="1"
                      onChange={(e) =>
                        updateComponentQuantity(index, parseInt(e.target.value))
                      }
                      className="w-20"
                    />
                  </TableCell>
                  <TableCell className="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removePartFromBOM(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-24 text-center text-muted-foreground"
                >
                  No components added. Use the search above to add components.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
