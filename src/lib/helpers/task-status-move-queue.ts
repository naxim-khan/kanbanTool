import type { QueryClient } from "@tanstack/react-query"

import type { TaskStatus, TaskWithRelations } from "@/schemas/task-api.schema"
import { updateTaskStatus } from "@/services/tasks/updateTaskStatus"

import {
  findTaskInAllLists,
  patchTaskInAllLists,
  setTaskDetailCache,
} from "./task-list-cache"

type StatusWaiter = {
  status: TaskStatus
  resolve: (task: TaskWithRelations) => void
  reject: (error: Error) => void
}

type TaskStatusQueueEntry = {
  running: boolean
  pending: TaskStatus | null
  /** Last persisted status during this drain (for rollback after partial success). */
  rollbackStatus: TaskStatus | null
  waiters: StatusWaiter[]
}

const queues = new Map<string, TaskStatusQueueEntry>()

function getEntry(taskId: string): TaskStatusQueueEntry {
  let entry = queues.get(taskId)
  if (!entry) {
    entry = {
      running: false,
      pending: null,
      rollbackStatus: null,
      waiters: [],
    }
    queues.set(taskId, entry)
  }
  return entry
}

export type TaskStatusMoveQueueCallbacks = {
  onPendingChange?: () => void
  onFailure?: () => void
}

/**
 * Serializes PATCH /tasks/:id/status per task so rapid DnD cannot apply out-of-order responses.
 * Optimistic cache patch runs immediately; network calls run one at a time with coalescing.
 */
export function enqueueTaskStatusMove(
  queryClient: QueryClient,
  taskId: string,
  status: TaskStatus,
  callbacks?: TaskStatusMoveQueueCallbacks
): Promise<TaskWithRelations | void> {
  const entry = getEntry(taskId)

  if (!entry.running && entry.rollbackStatus === null) {
    const current = findTaskInAllLists(queryClient, taskId)
    entry.rollbackStatus = current?.status ?? status
  }

  patchTaskInAllLists(queryClient, taskId, { status })
  entry.pending = status
  callbacks?.onPendingChange?.()

  const promise = new Promise<TaskWithRelations | void>((resolve, reject) => {
    entry.waiters.push({
      status,
      resolve: (task) => resolve(task),
      reject,
    })
  })

  if (!entry.running) {
    void drainTaskStatusQueue(queryClient, taskId, callbacks)
  }

  return promise
}

function settleWaiters(
  entry: TaskStatusQueueEntry,
  serverTask: TaskWithRelations
): void {
  const remaining: StatusWaiter[] = []
  for (const waiter of entry.waiters) {
    if (waiter.status === serverTask.status) {
      waiter.resolve(serverTask)
    } else {
      remaining.push(waiter)
    }
  }
  entry.waiters = remaining
}

function rejectAllWaiters(entry: TaskStatusQueueEntry, error: Error): void {
  for (const waiter of entry.waiters) {
    waiter.reject(error)
  }
  entry.waiters = []
}

async function drainTaskStatusQueue(
  queryClient: QueryClient,
  taskId: string,
  callbacks?: TaskStatusMoveQueueCallbacks
): Promise<void> {
  const entry = getEntry(taskId)
  entry.running = true

  while (entry.pending) {
    const status = entry.pending
    entry.pending = null

    try {
      const serverTask = await updateTaskStatus(taskId, { status })

      if (entry.pending) {
        /** A newer column was chosen while this request was in flight — skip stale response. */
        entry.waiters = entry.waiters.filter((w) => w.status !== status)
        continue
      }

      patchTaskInAllLists(queryClient, serverTask.id, serverTask)
      setTaskDetailCache(queryClient, serverTask)
      entry.rollbackStatus = serverTask.status
      settleWaiters(entry, serverTask)
    } catch (unknown) {
      const error =
        unknown instanceof Error ? unknown : new Error("Could not move task")

      if (!entry.pending && entry.rollbackStatus) {
        patchTaskInAllLists(queryClient, taskId, {
          status: entry.rollbackStatus,
        })
      }

      rejectAllWaiters(entry, error)
      entry.pending = null
      callbacks?.onFailure?.()
      break
    }
  }

  entry.running = false
  entry.rollbackStatus = null
  callbacks?.onPendingChange?.()

  if (queues.get(taskId) && !entry.running && !entry.pending && entry.waiters.length === 0) {
    queues.delete(taskId)
  }
}

export function isTaskStatusMovePending(taskId: string): boolean {
  const entry = queues.get(taskId)
  return Boolean(entry && (entry.running || entry.pending))
}

export function getPendingTaskStatusMoveIds(): readonly string[] {
  const ids: string[] = []
  for (const [taskId, entry] of queues) {
    if (entry.running || entry.pending) {
      ids.push(taskId)
    }
  }
  return ids
}
