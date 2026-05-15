"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { queryKeys } from "@/constants/query-keys"
import {
  removeTaskFromAllLists,
  restoreTaskLists,
  snapshotTaskLists,
  type TaskListCacheSnapshot,
} from "@/lib/helpers/task-list-cache"
import { deleteTask } from "@/services/tasks/deleteTask"

type Ctx = { previous: TaskListCacheSnapshot }

export function useDeleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onMutate: (id) => {
      const previous = snapshotTaskLists(queryClient)
      removeTaskFromAllLists(queryClient, id)
      return { previous } satisfies Ctx
    },
    onError: (e: Error, _vars, context) => {
      if (context?.previous) {
        restoreTaskLists(queryClient, context.previous)
      }
      toast.error(e.message ?? "Could not delete task")
    },
    onSuccess: (_data, id) => {
      toast.success("Task deleted")
      void queryClient.removeQueries({ queryKey: queryKeys.tasks.task(id) })
    },
  })
}
