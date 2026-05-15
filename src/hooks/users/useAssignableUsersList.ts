"use client"

import { useQuery } from "@tanstack/react-query"

import { queryKeys } from "@/constants/query-keys"
import { getAssignableUsers } from "@/services/users/getAssignableUsers"

/** GET /assignable-users — any authenticated user (task filters & assignee pickers). */
export function useAssignableUsersList(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.users.assignableList(),
    queryFn: () => getAssignableUsers(),
    enabled,
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
  })
}
