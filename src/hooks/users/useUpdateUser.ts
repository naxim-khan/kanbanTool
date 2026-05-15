"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  applyAdminUpdatePayload,
  cancelUserQueries,
  restoreUserCaches,
  snapshotUserCaches,
  syncUserAcrossCaches,
  type UserCacheSnapshot,
} from "@/lib/helpers/user-list-cache"
import { updateUser, type AdminUpdateUserPayload } from "@/services/users/updateUser"

type Ctx = { previous: UserCacheSnapshot }

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: AdminUpdateUserPayload
    }) => updateUser(id, payload),
    onMutate: ({ id, payload }) => {
      const previous = snapshotUserCaches(queryClient)
      syncUserAcrossCaches(queryClient, id, (user) =>
        applyAdminUpdatePayload(user, payload)
      )
      void cancelUserQueries(queryClient)
      return { previous } satisfies Ctx
    },
    onError: (e: Error, _vars, context) => {
      if (context?.previous) {
        restoreUserCaches(queryClient, context.previous)
      }
      toast.error(e.message ?? "Could not update user")
    },
    onSuccess: (serverUser) => {
      syncUserAcrossCaches(queryClient, serverUser.id, serverUser)
      toast.success("User updated")
    },
  })
}
