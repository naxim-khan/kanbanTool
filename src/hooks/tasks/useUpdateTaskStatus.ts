"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { enqueueTaskStatusMove } from "@/lib/helpers/task-status-move-queue"
import type { UpdateTaskStatusPayload } from "@/services/tasks/updateTaskStatus"

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string
      payload: UpdateTaskStatusPayload
    }) => {
      const result = await enqueueTaskStatusMove(
        queryClient,
        id,
        payload.status
      )
      if (!result) {
        throw new Error("Could not update status")
      }
      return result
    },
    onError: (e: Error) => {
      toast.error(e.message ?? "Could not update status")
    },
  })
}
