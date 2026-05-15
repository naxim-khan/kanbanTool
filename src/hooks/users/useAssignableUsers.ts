"use client"

import { useMemo } from "react"

import { useDebouncedValue } from "@/hooks/shared/useDebouncedValue"
import { filterUsersBySearch } from "@/lib/helpers/filter-users-by-search"

import { useAssignableUsersList } from "./useAssignableUsersList"

const DEBOUNCE_MS = 400

/**
 * Cached GET /assignable-users + debounced client-side name/email filter.
 */
export function useAssignableUsers(searchInput: string, enabled: boolean) {
  const debouncedSearch = useDebouncedValue(searchInput, DEBOUNCE_MS)
  const query = useAssignableUsersList(enabled)

  const options = useMemo(
    () => filterUsersBySearch(query.data ?? [], debouncedSearch),
    [query.data, debouncedSearch]
  )

  return {
    ...query,
    debouncedSearch,
    options,
  }
}
