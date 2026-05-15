import type { QueryClient } from "@tanstack/react-query"

import { queryKeys } from "@/constants/query-keys"
import type { CreateTaskPayload } from "@/services/tasks/createTask"
import type {
  PaginatedTasksResponse,
  TaskWithRelations,
} from "@/schemas/task-api.schema"
import type { AuthUser } from "@/types/auth.types"

export type TaskListCacheSnapshot = Array<{
  queryKey: readonly unknown[]
  data: PaginatedTasksResponse | undefined
}>

export function snapshotTaskLists(
  queryClient: QueryClient
): TaskListCacheSnapshot {
  return queryClient
    .getQueriesData<PaginatedTasksResponse>({
      queryKey: queryKeys.tasks.listPrefix,
    })
    .map(([queryKey, data]) => ({ queryKey, data }))
}

export function restoreTaskLists(
  queryClient: QueryClient,
  snapshot: TaskListCacheSnapshot
): void {
  for (const { queryKey, data } of snapshot) {
    queryClient.setQueryData(queryKey, data)
  }
}

export function updateAllTaskLists(
  queryClient: QueryClient,
  updater: (data: PaginatedTasksResponse) => PaginatedTasksResponse
): void {
  const queries = queryClient.getQueriesData<PaginatedTasksResponse>({
    queryKey: queryKeys.tasks.listPrefix,
  })
  for (const [queryKey, data] of queries) {
    if (!data) continue
    queryClient.setQueryData(queryKey, updater(data))
  }
}

export function findTaskInAllLists(
  queryClient: QueryClient,
  taskId: string
): TaskWithRelations | undefined {
  const lists = queryClient.getQueriesData<PaginatedTasksResponse>({
    queryKey: queryKeys.tasks.listPrefix,
  })
  for (const [, data] of lists) {
    const hit = data?.items.find((t) => t.id === taskId)
    if (hit) return hit
  }
  return undefined
}

export function patchTaskInAllLists(
  queryClient: QueryClient,
  taskId: string,
  patch:
    | Partial<TaskWithRelations>
    | ((task: TaskWithRelations) => TaskWithRelations)
): void {
  updateAllTaskLists(queryClient, (data) => ({
    ...data,
    items: data.items.map((t) => {
      if (t.id !== taskId) return t
      return typeof patch === "function" ? patch(t) : { ...t, ...patch }
    }),
  }))
}

export function removeTaskFromAllLists(
  queryClient: QueryClient,
  taskId: string
): void {
  updateAllTaskLists(queryClient, (data) => {
    const had = data.items.some((t) => t.id === taskId)
    return {
      ...data,
      items: data.items.filter((t) => t.id !== taskId),
      total: had ? Math.max(0, data.total - 1) : data.total,
    }
  })
}

export function prependTaskToAllLists(
  queryClient: QueryClient,
  task: TaskWithRelations
): void {
  updateAllTaskLists(queryClient, (data) => ({
    ...data,
    items: [task, ...data.items],
    total: data.total + 1,
  }))
}

export function replaceTaskInAllLists(
  queryClient: QueryClient,
  matchId: string,
  task: TaskWithRelations
): void {
  updateAllTaskLists(queryClient, (data) => ({
    ...data,
    items: data.items.map((t) => (t.id === matchId ? task : t)),
  }))
}

export function setTaskDetailCache(
  queryClient: QueryClient,
  task: TaskWithRelations
): void {
  queryClient.setQueryData(queryKeys.tasks.task(task.id), task)
}

export function findAssignableUser(
  queryClient: QueryClient,
  userId: string
): { id: string; name: string; email: string } | undefined {
  const lists = queryClient.getQueriesData<
    Array<{ id: string; name: string; email: string }>
  >({ queryKey: queryKeys.users.assignableList() })
  for (const [, users] of lists) {
    const hit = users?.find((u) => u.id === userId)
    if (hit) return hit
  }
  return undefined
}

export function buildOptimisticTask(
  payload: CreateTaskPayload,
  creator: AuthUser,
  assignee: { id: string; name: string; email: string } | null
): TaskWithRelations {
  const now = new Date().toISOString()
  return {
    id: `optimistic-${crypto.randomUUID()}`,
    title: payload.title,
    description: payload.description ?? null,
    status: payload.status,
    priority: payload.priority,
    dueDate: payload.dueDate ?? null,
    creatorId: creator.id,
    assigneeId: payload.assigneeId ?? null,
    createdAt: now,
    updatedAt: now,
    creator: {
      id: creator.id,
      name: creator.name,
      email: creator.email,
    },
    assignee,
  }
}
