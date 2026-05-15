"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  adminRowToAssignable,
  buildOptimisticAdminUser,
  cancelUserQueries,
  prependUserToAdminList,
  prependUserToAssignableList,
  replaceUserInAdminList,
  replaceUserInAssignableList,
  restoreUserCaches,
  setUserDetailCache,
  snapshotUserCaches,
  type UserCacheSnapshot,
} from "@/lib/helpers/user-list-cache"
import {
  createUser,
  type AdminCreateUserPayload,
} from "@/services/users/createUser"

type Ctx = { previous: UserCacheSnapshot; optimisticId: string }

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: AdminCreateUserPayload) => createUser(payload),
    onMutate: (payload) => {
      const optimistic = buildOptimisticAdminUser(payload)
      const previous = snapshotUserCaches(queryClient)
      prependUserToAdminList(queryClient, optimistic)
      prependUserToAssignableList(
        queryClient,
        adminRowToAssignable(optimistic)
      )
      void cancelUserQueries(queryClient)
      return { previous, optimisticId: optimistic.id } satisfies Ctx
    },
    onError: (e: Error, _vars, context) => {
      if (context?.previous) {
        restoreUserCaches(queryClient, context.previous)
      }
      toast.error(e.message ?? "Could not create user")
    },
    onSuccess: (serverUser, _vars, context) => {
      if (context?.optimisticId) {
        replaceUserInAdminList(queryClient, context.optimisticId, serverUser)
        replaceUserInAssignableList(
          queryClient,
          context.optimisticId,
          adminRowToAssignable(serverUser)
        )
      }
      setUserDetailCache(queryClient, serverUser)
      toast.success("User created")
    },
  })
}
