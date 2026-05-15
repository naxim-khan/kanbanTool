"use client"

import { useQuery } from "@tanstack/react-query"

import { queryKeys } from "@/constants/query-keys"
import { getProfile } from "@/services/auth/getProfile"
import { useAppSelector } from "@/store/hooks"

export function useProfile(alwaysFetch?: boolean) {
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated)
  const hasUser = useAppSelector((s) => Boolean(s.auth.user?.id))
  const hydrated = useAppSelector((s) => s.auth.hydrated)
  const sessionUser = useAppSelector((s) => s.auth.user)

  const bootstrapEnabled = hydrated && isAuthenticated && !hasUser
  const queryEnabled = alwaysFetch
    ? hydrated && isAuthenticated
    : bootstrapEnabled

  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: getProfile,
    enabled: queryEnabled,
    initialData: sessionUser ?? undefined,
    retry: false,
  })
}
