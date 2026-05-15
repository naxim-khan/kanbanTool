"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { queryKeys } from "@/constants/query-keys"
import {
  findAssignableUser,
  patchTaskInAllLists,
  restoreTaskLists,
  setTaskDetailCache,
  snapshotTaskLists,
  type TaskListCacheSnapshot,
} from "@/lib/helpers/task-list-cache"
import { updateTask, type UpdateTaskPayload } from "@/services/tasks/updateTask"

type Ctx = { previous: TaskListCacheSnapshot }

export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTaskPayload }) =>
      updateTask(id, payload),
    onMutate: ({ id, payload }) => {
      const previous = snapshotTaskLists(queryClient)
      patchTaskInAllLists(queryClient, id, (task) => {
        const next = { ...task, updatedAt: new Date().toISOString() }
        if (payload.title !== undefined) next.title = payload.title
        if (payload.description !== undefined) {
          next.description = payload.description
        }
        if (payload.priority !== undefined) next.priority = payload.priority
        if (payload.dueDate !== undefined) next.dueDate = payload.dueDate
        if (payload.assigneeId !== undefined) {
          next.assigneeId = payload.assigneeId
          if (payload.assigneeId === null) {
            next.assignee = null
          } else {
            const user = findAssignableUser(queryClient, payload.assigneeId)
            next.assignee = user ?? {
              id: payload.assigneeId,
              name: "…",
              email: "",
            }
          }
        }
        return next
      })
      return { previous } satisfies Ctx
    },
    onError: (e: Error, _vars, context) => {
      if (context?.previous) {
        restoreTaskLists(queryClient, context.previous)
      }
      toast.error(e.message ?? "Could not update task")
    },
    onSuccess: (serverTask) => {
      patchTaskInAllLists(queryClient, serverTask.id, serverTask)
      setTaskDetailCache(queryClient, serverTask)
      toast.success("Task updated")
    },
  })
}
