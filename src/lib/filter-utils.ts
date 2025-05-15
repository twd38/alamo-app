import { FilterItem } from "@/components/filter-popover"

/**
 * Apply filter conditions to a data item
 * @param item The data item to filter
 * @param filters The filter conditions to apply
 * @param fieldMap A mapping of filter types to item property paths
 * @returns Whether the item matches all filter conditions
 */
export function applyFilters<T extends Record<string, any>>(
  item: T,
  filters: FilterItem[],
  fieldMap: Record<string, string | ((item: T) => any)>
): boolean {
  // If no filters, return all items
  if (!filters || filters.length === 0) return true

  // Check if item matches all filters (AND logic)
  return filters.every((filter) => {
    const { type, operator, value } = filter
    
    // Skip empty filters
    if (!value.trim()) return true

    // Convert value to lowercase for case-insensitive comparison
    const filterValue = value.toLowerCase().trim()
    
    // Get the item field value based on the type mapping
    const field = fieldMap[type]
    if (!field) return true
    
    // Get the item value using the field getter (function or property path)
    const itemValue = typeof field === 'function' 
      ? field(item) 
      : getNestedValue(item, field)
    
    // If the value is an array, check any of its items match
    if (Array.isArray(itemValue)) {
      const stringValues = itemValue
        .map(v => String(v).toLowerCase())
        .filter(Boolean)
        
      switch (operator) {
        case "is":
          return stringValues.some(v => v === filterValue)
        case "is not":
          return !stringValues.some(v => v === filterValue)
        case "contains":
          return stringValues.some(v => v.includes(filterValue))
        case "does not contain":
          return !stringValues.some(v => v.includes(filterValue))
        default:
          return true
      }
    } 
    
    // For string or number values
    const stringValue = String(itemValue || "").toLowerCase()
    
    switch (operator) {
      case "is":
        return stringValue === filterValue
      case "is not":
        return stringValue !== filterValue
      case "contains":
        return stringValue.includes(filterValue)
      case "does not contain":
        return !stringValue.includes(filterValue)
      default:
        return true
    }
  })
}

/**
 * Get a nested value from an object using a dot-notation path
 * @param obj The object to get the value from
 * @param path The path to the value using dot notation (e.g. "user.name")
 * @returns The value at the path or undefined
 */
function getNestedValue(obj: Record<string, any>, path: string): any {
  return path.split('.').reduce((o, p) => o?.[p], obj)
}

/**
 * Create a field mapper function for a specific data type
 * @param mapping Record of filter types to field paths or getter functions
 * @returns A function that can be used with applyFilters
 */
export function createFieldMapper<T extends Record<string, any>>(
  mapping: Record<string, string | ((item: T) => any)>
): (filterType: string) => string | ((item: T) => any) {
  return (filterType: string) => mapping[filterType] || filterType
}

/**
 * Create a filter function for a specific data type
 * @param fieldMap A mapping of filter types to item property paths
 * @returns A function that takes an item and filters and returns whether the item matches
 */
export function createFilterFn<T extends Record<string, any>>(
  fieldMap: Record<string, string | ((item: T) => any)>
): (item: T, filters: FilterItem[]) => boolean {
  return (item: T, filters: FilterItem[]) => applyFilters(item, filters, fieldMap)
} 