"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { queryKeys } from "@/constants/query-keys"
import { updateStoredUser } from "@/lib/helpers/auth-storage"
import {
  adminRowToAuthUser,
  applyAdminUpdatePayload,
  applyAuthUpdatePayload,
  cancelUserQueries,
  restoreUserCaches,
  snapshotUserCaches,
  syncUserAcrossCaches,
  type UserCacheSnapshot,
} from "@/lib/helpers/user-list-cache"
import {
  updateUser,
  type AdminUpdateUserPayload,
} from "@/services/users/updateUser"
import { setUser } from "@/store/slices/authSlice"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import type { AuthUser } from "@/types/auth.types"

type Ctx = {
  previous: UserCacheSnapshot
  previousAuthUser: AuthUser | null
}

export function useUpdateMyProfile() {
  const dispatch = useAppDispatch()
  const queryClient = useQueryClient()
  const authUser = useAppSelector((s) => s.auth.user)

  return useMutation({
    mutationFn: ({
      userId,
      payload,
    }: {
      userId: string
      payload: AdminUpdateUserPayload
    }) => updateUser(userId, payload),
    onMutate: ({ userId, payload }) => {
      const previous = snapshotUserCaches(queryClient)
      const previousAuthUser = authUser ?? null

      if (authUser?.id === userId) {
        const nextAuth = applyAuthUpdatePayload(authUser, payload)
        dispatch(setUser(nextAuth))
        updateStoredUser(nextAuth)
        queryClient.setQueryData(queryKeys.profile, nextAuth)
      }

      syncUserAcrossCaches(queryClient, userId, (user) =>
        applyAdminUpdatePayload(user, payload)
      )
      void cancelUserQueries(queryClient)
      return { previous, previousAuthUser } satisfies Ctx
    },
    onError: (e: Error, _vars, context) => {
      if (context?.previous) {
        restoreUserCaches(queryClient, context.previous)
      }
      if (context?.previousAuthUser) {
        dispatch(setUser(context.previousAuthUser))
        updateStoredUser(context.previousAuthUser)
      }
      toast.error(e.message ?? "Could not update profile")
    },
    onSuccess: (data, variables) => {
      const nextAuth = adminRowToAuthUser(data)
      dispatch(setUser(nextAuth))
      updateStoredUser(nextAuth)
      queryClient.setQueryData(queryKeys.profile, nextAuth)
      syncUserAcrossCaches(queryClient, variables.userId, data)
      toast.success("Profile updated")
    },
  })
}
