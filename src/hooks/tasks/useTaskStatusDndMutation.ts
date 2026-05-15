"use client"

import { useCallback, useMemo, useReducer, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  enqueueTaskStatusMove,
  getPendingTaskStatusMoveIds,
  isTaskStatusMovePending,
  type TaskStatusMoveQueueCallbacks,
} from "@/lib/helpers/task-status-move-queue"
import type { TaskStatus } from "@/schemas/task-api.schema"

/** Kanban drag-and-drop status changes — serialized per task, optimistic list cache. */
export function useTaskStatusDndMutation() {
  const queryClient = useQueryClient()
  const [tick, bump] = useReducer((n: number) => n + 1, 0)
  const [failureCount, setFailureCount] = useState(0)

  const callbacks = useMemo<TaskStatusMoveQueueCallbacks>(
    () => ({
      onPendingChange: () => bump(),
      onFailure: () => {
        setFailureCount((c) => c + 1)
        toast.error("Could not move task")
        bump()
      },
    }),
    []
  )

  const mutate = useCallback(
    ({ id, status }: { id: string; status: TaskStatus }) => {
      void enqueueTaskStatusMove(queryClient, id, status, callbacks)
    },
    [queryClient, callbacks]
  )

  const pendingTaskIds = useMemo(
    () => getPendingTaskStatusMoveIds(),
    [tick]
  )

  const isTaskPending = useCallback(
    (taskId: string) => isTaskStatusMovePending(taskId),
    [tick]
  )

  return {
    mutate,
    failureCount,
    pendingTaskIds,
    isTaskPending,
  }
}
