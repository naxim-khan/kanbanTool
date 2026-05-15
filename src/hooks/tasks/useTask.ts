"use client"

import {
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query"

import { queryKeys } from "@/constants/query-keys"
import type { PaginatedTasksResponse, TaskWithRelations } from "@/schemas/task-api.schema"
import { getTask } from "@/services/tasks/getTask"

function readCachedTask(
  queryClient: QueryClient,
  id: string
): TaskWithRelations | undefined {
  const detail = queryClient.getQueryData<TaskWithRelations>(
    queryKeys.tasks.task(id)
  )
  if (detail) return detail

  const lists = queryClient.getQueriesData<PaginatedTasksResponse>({
    queryKey: queryKeys.tasks.listPrefix,
  })
  for (const [, data] of lists) {
    const hit = data?.items.find((t) => t.id === id)
    if (hit) return hit
  }
  return undefined
}

export function useTask(id: string | null, enabled: boolean) {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: id ? queryKeys.tasks.task(id) : ["task", "none"],
    queryFn: () => getTask(id as string),
    enabled: Boolean(id) && enabled,
    initialData: id ? () => readCachedTask(queryClient, id) : undefined,
  })
}
