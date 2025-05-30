'use client'

import React from 'react'
import { useQueryStates, parseAsString } from 'nuqs'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  ArrowUpDown,
} from 'lucide-react'

/**
 * Available sorting keys.
 */
export type SortKey = "priority" | "due_date" | ""

/**
 * Possible sorting directions.
 */
export type SortDirection = "asc" | "desc"

/**
 * Labels for sort keys – used throughout the UI.
 */
const SORT_LABELS: Record<Exclude<SortKey, "">, string> = {
  priority: "Priority",
  due_date: "Due Date",
} as const

/**
 * Helper – get the opposite direction.
 */
const toggleDirection = (dir: SortDirection): SortDirection =>
  dir === "asc" ? "desc" : "asc"

/**
 * SortDropdown component – updates `sort` and `dir` search params using nuqs.
 */
export default function SortDropdown(): JSX.Element {
  const [{ sort = "", dir = "desc" }, setQuery] = useQueryStates({
    sort: parseAsString.withDefault(""),
    dir: parseAsString.withDefault("desc"),
  })

  const sortKey = sort as SortKey
  const sortDir = dir as SortDirection

  /**
   * Handle selection of a sort key: if the key is the same as the current one,
   * toggle the direction. Otherwise set the new key with ascending order.
   */
  const onSelectKey = (key: Exclude<SortKey, "">): void => {
    if (key === sortKey) {
      setQuery({ sort: key, dir: toggleDirection(sortDir) })
    } else {
      setQuery({ sort: key, dir: "desc" })
    }
  }

  /** Clear sorting params entirely. */
  const clearSorting = (): void => {
    setQuery({ sort: null, dir: null })
  }

  const renderDirIcon = (direction: SortDirection): JSX.Element =>
    direction === "asc" ? <ArrowUpWideNarrow className="ml-r h-4 w-4" /> : <ArrowDownWideNarrow className="ml-r h-4 w-4" />

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="space-x-1 justify-between"
        >
          {sortKey === "" ? (
            <>
                <ArrowUpDown className="h-4 w-4" />
                <span>Sort by</span>
            </>
          ) : (
            <>
                {renderDirIcon(sortDir)}
              <span>
                {SORT_LABELS[sortKey]}
              </span>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {Object.entries(SORT_LABELS).map(([key, label]) => {
          const typedKey = key as Exclude<SortKey, "">
          const isActive = sortKey === typedKey
          const activeDir = isActive ? sortDir : "asc"
          return (
            <DropdownMenuItem
              key={key}
              onSelect={() => onSelectKey(typedKey)}
              className="flex justify-between"
            >
              <span>
                {label}
              </span>
            </DropdownMenuItem>
          )
        })}
        <DropdownMenuItem onSelect={clearSorting} className="text-muted-foreground">
          Clear sorting
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 