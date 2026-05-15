"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { queryKeys } from "@/constants/query-keys"
import {
  cancelUserQueries,
  removeUserFromAdminList,
  removeUserFromAssignableList,
  restoreUserCaches,
  snapshotUserCaches,
  type UserCacheSnapshot,
} from "@/lib/helpers/user-list-cache"
import { deleteUser } from "@/services/users/deleteUser"

type Ctx = { previous: UserCacheSnapshot }

export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onMutate: (id) => {
      const previous = snapshotUserCaches(queryClient)
      removeUserFromAdminList(queryClient, id)
      removeUserFromAssignableList(queryClient, id)
      void cancelUserQueries(queryClient)
      return { previous } satisfies Ctx
    },
    onError: (e: Error, _vars, context) => {
      if (context?.previous) {
        restoreUserCaches(queryClient, context.previous)
      }
      toast.error(e.message ?? "Could not delete user")
    },
    onSuccess: (_data, id) => {
      toast.success("User deleted")
      void queryClient.removeQueries({ queryKey: queryKeys.users.detail(id) })
    },
  })
}
