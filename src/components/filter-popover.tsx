'use client'

import { useState, useEffect } from "react"
import { ChevronDown, X, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { UserSelect } from '@/components/user-select';
import { User } from "@prisma/client"
import { Switch } from "@/components/ui/switch"


export type FilterItem = {
  id: string
  type: string
  operator: string
  value: string
}

export type FilterOption = {
  label: string
  value: string
  icon: React.ReactNode
  inputType?: "text" | "number" | "date" | "user" | "boolean"
  userOptions?: any[]
}

export type OperatorOption = {
  label: string
  value: string
}

export type FilterPopoverProps = {
  /**
   * Filter options to show in the dropdown
   */
  filterOptions: FilterOption[]
  /**
   * Operator options for filtering
   */
  operatorOptions: OperatorOption[]
  /**
   * Function to call when filters are applied
   */
  onApplyFilters: (filters: FilterItem[]) => void
  /**
   * Optional storage key for persisting filters in localStorage
   */
  storageKey?: string
  /**
   * Initial filters to display
   */
  initialFilters?: FilterItem[]
  /**
   * Button label text
   */
  buttonText?: string
}

type FilterState = {
  filters: FilterItem[]
}

// Create a default atom outside of the component to avoid re-creation on each render
const defaultFilterStateAtom = atomWithStorage<FilterState>('defaultFilters', { filters: [] });

// Map to store atoms keyed by storageKey
const atomCache = new Map<string, ReturnType<typeof atomWithStorage<FilterState>>>();

// Function to get or create an atom for a specific key
const getAtomForKey = (key: string) => {
  if (!atomCache.has(key)) {
    atomCache.set(key, atomWithStorage<FilterState>(key, { filters: [] }));
  }
  return atomCache.get(key)!;
};

const ValueInput = ({ filter, filterOptions, updateFilter }: { filter: FilterItem, filterOptions: FilterOption[], updateFilter: (id: string, field: keyof FilterItem, value: string) => void }) => {
  const filterOption = filterOptions.find((opt) => opt.label === filter.type);
  
  if(filterOption?.inputType === "user") {
    const handleChange = (value: string | string[]) => {
      console.log(value)
      const selectedUser = filterOption.userOptions?.find((user) => user.id === value);
      const selectedUserEmail = selectedUser?.email;
      updateFilter(filter.id, "value", value.toString());
    }
    return <UserSelect
      users={filterOption.userOptions || []}
      value={filter.value}
      onChange={handleChange}
    />
  }

  if(filterOption?.inputType === "boolean") {
    return <Switch
      checked={filter.value === "true"}
      onCheckedChange={(checked: any) => updateFilter(filter.id, "value", checked.toString())}
    />
  }

  return (
    <Input
      type="text"
      value={filter.value}
      onChange={(e) => updateFilter(filter.id, "value", e.target.value)}
      className="w-full px-3 py-1.5 border border-gray-200 rounded-md focus:outline-none"
      placeholder="Enter value..."
    />
  )
}

/**
 * A way to get the atom using a key
 */
export function useFilterAtom(storageKey: string) {
    const filterStateAtom = storageKey ? getAtomForKey(storageKey) : defaultFilterStateAtom;
    return useAtom<FilterState>(filterStateAtom);
}

/**
 * A reusable filter popover component that can be used across the application
 */
export function FilterPopover({
  filterOptions,
  operatorOptions,
  onApplyFilters,
  storageKey,
  initialFilters = [], 
  buttonText = "Filter"
}: FilterPopoverProps) {
  const [open, setOpen] = useState(false)
  
  
  // Use the appropriate atom based on storageKey
  const filterStateAtom = storageKey ? getAtomForKey(storageKey) : defaultFilterStateAtom;
  const [filterState, setFilterState] = useAtom<FilterState>(filterStateAtom);
  
  // Initialize filters from either stored state or initialFilters
  const [filters, setFilters] = useState<FilterItem[]>(() => {
    if (storageKey && filterState.filters && filterState.filters.length > 0) {
      return filterState.filters;
    }
    return initialFilters;
  });

  // Update filters when initialFilters changes
  useEffect(() => {
    if (initialFilters) {
      setFilters(initialFilters);
    }
  }, [initialFilters]);
  
  const clearFilters = () => {
    setFilters([]);
    setFilterState({ filters: [] });
    onApplyFilters([]);
  }

  const updateFilter = (id: string, field: keyof FilterItem, value: string) => {
    setFilters(filters.map((filter) => (filter.id === id ? { ...filter, [field]: value } : filter)));
  }

  const removeFilter = (id: string) => {
    if (filters.length > 1) {
      setFilters(filters.filter((filter) => filter.id !== id));
    } else {
      // If it's the last filter, just clear its value
      updateFilter(id, "value", "");
    }
  }

  const getIconForType = (type: string) => {
    const option = filterOptions.find((opt) => opt.label === type);
    return option?.icon || filterOptions[0]?.icon || <Filter className="h-4 w-4 mr-2" />;
  }

  const applyFilters = () => {
    // Only keep filters that have values
    const validFilters = filters.filter((filter) => filter.value.trim() !== "");
    setFilterState({ filters: validFilters });
    onApplyFilters(validFilters);
    setOpen(false);
  }

  const getActiveFilterCount = () => {
    if(filterState?.filters) {
      return filterState.filters.length
    }
    return 0;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="h-4 w-4" />
          {buttonText}
          {getActiveFilterCount() > 0 && (
            <span className="ml-1 rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium">
              {getActiveFilterCount()}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[600px] p-4" align="end">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Filters</h2>
          <Button variant="ghost" onClick={clearFilters} className="text-gray-500 hover:text-gray-700 h-8 px-2">
            Clear
          </Button>
        </div>

        <div className="space-y-4">
          <div className="text-sm text-gray-500 font-medium">All filters</div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {filters.map((filter) => (
              <div key={filter.id} className="flex items-center gap-2">
                {/* Filter Type Dropdown */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex-1 justify-between border border-gray-200"
                    >
                      <span className="flex items-center">
                        {getIconForType(filter.type)}
                        {filter.type}
                      </span>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[240px] p-0" align="start">
                    <div className="max-h-[300px] overflow-auto">
                      {filterOptions.map((option) => (
                        <div
                          key={option.value}
                          className="flex items-center px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                          onClick={() => updateFilter(filter.id, "type", option.label)}
                        >
                          {option.icon}
                          {option.label}
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Operator Dropdown */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[100px] justify-between border border-gray-200">
                      <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                        {filter.operator}
                      </span>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0" align="start">
                    {operatorOptions.map((option) => (
                      <div
                        key={option.value}
                        className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                        onClick={() => updateFilter(filter.id, "operator", option.label)}
                      >
                        {option.label}
                      </div>
                    ))}
                  </PopoverContent>
                </Popover>

                {/* Value Input */}
                <div className="relative flex-1">
                  <ValueInput filter={filter} filterOptions={filterOptions} updateFilter={updateFilter}   />
                  {filter.value && (
                    <button
                      onClick={() => updateFilter(filter.id, "value", "")}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                    >
                      <X className="h-4 w-4 text-gray-400" />
                    </button>
                  )}
                </div>

                {/* Remove Filter Button */}
                <Button variant="ghost" size="icon" onClick={() => removeFilter(filter.id)} className="h-9 w-9">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Add Filter Button */}
          <Button
            variant="ghost" 
            className="text-sm"
            onClick={() => {
              const newId = filters.length.toString()
              setFilters([...filters, { 
                id: newId, 
                type: filterOptions[0]?.label || "", 
                operator: operatorOptions[0]?.label || "", 
                value: "" 
              }])
            }}
          >
            + Add filter
          </Button>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={applyFilters}>Apply Filters</Button>
        </div>
      </PopoverContent>
    </Popover>
  )
} 

/**
 * Filter functions that can be used to filter the data
 */
export function isValidUser(user: string[], operator: string, filterValue: string) {
  if(operator === "is") {
    return user.some(id => id === filterValue)
  }
  if(operator === "is not") {
    return !user.some(id => id === filterValue)
  }
  return false
}

export function isValidString(input: string[], operator: string, filterValue: string) {
  if(operator === "is") {
    return input.some(item => item === filterValue)
  }
  if(operator === "is not") {
    return !input.some(item => item === filterValue)
  }
  if(operator === "contains") {
    return input.some(item => item.includes(filterValue))
  }
  if(operator === "does not contain") {
    return !input.some(item => item.includes(filterValue))
  }
  return false
}

export function isValidDate(input: string, operator: string, filterValue: string) {
  if(operator === "is") {
    return input === filterValue
  }
  if(operator === "is not") {
    return input !== filterValue
  }
  return false
}