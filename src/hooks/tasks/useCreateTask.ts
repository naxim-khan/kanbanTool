"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { queryKeys } from "@/constants/query-keys"
import {
  buildOptimisticTask,
  findAssignableUser,
  prependTaskToAllLists,
  replaceTaskInAllLists,
  restoreTaskLists,
  setTaskDetailCache,
  snapshotTaskLists,
  type TaskListCacheSnapshot,
} from "@/lib/helpers/task-list-cache"
import { createTask, type CreateTaskPayload } from "@/services/tasks/createTask"
import { useAppSelector } from "@/store/hooks"

type Ctx = {
  previous: TaskListCacheSnapshot
  optimisticId: string
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  const user = useAppSelector((s) => s.auth.user)

  return useMutation({
    mutationFn: (payload: CreateTaskPayload) => createTask(payload),
    onMutate: (payload) => {
      if (!user) {
        return { previous: [], optimisticId: "" } satisfies Ctx
      }

      const assignee = payload.assigneeId
        ? findAssignableUser(queryClient, payload.assigneeId) ?? null
        : null
      const optimistic = buildOptimisticTask(payload, user, assignee)
      const previous = snapshotTaskLists(queryClient)
      prependTaskToAllLists(queryClient, optimistic)
      return { previous, optimisticId: optimistic.id } satisfies Ctx
    },
    onError: (e: Error, _vars, context) => {
      if (context?.previous.length) {
        restoreTaskLists(queryClient, context.previous)
      }
      toast.error(e.message ?? "Could not create task")
    },
    onSuccess: (serverTask, _vars, context) => {
      if (context?.optimisticId) {
        replaceTaskInAllLists(queryClient, context.optimisticId, serverTask)
      } else {
        prependTaskToAllLists(queryClient, serverTask)
      }
      setTaskDetailCache(queryClient, serverTask)
      toast.success("Task created")
    },
  })
}
