"use client"

import {
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query"

import { queryKeys } from "@/constants/query-keys"
import { getUserById } from "@/services/users/getUserById"
import type { AdminUserRow } from "@/schemas/user-api.schema"

function readCachedUser(
  queryClient: QueryClient,
  id: string
): AdminUserRow | undefined {
  const detail = queryClient.getQueryData<AdminUserRow>(
    queryKeys.users.detail(id)
  )
  if (detail) return detail

  const list = queryClient.getQueryData<AdminUserRow[]>(queryKeys.users.list())
  return list?.find((u) => u.id === id)
}

export function useUser(id: string | null, enabled: boolean) {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: id ? queryKeys.users.detail(id) : ["users", "detail", "none"],
    queryFn: () => getUserById(id as string),
    enabled: Boolean(id) && enabled,
    initialData: id ? () => readCachedUser(queryClient, id) : undefined,
  })
}
