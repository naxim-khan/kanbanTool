import type { QueryClient } from "@tanstack/react-query"

import { queryKeys } from "@/constants/query-keys"
import type {
  AdminUserRow,
  AssignableUserRow,
} from "@/schemas/user-api.schema"
import type { AdminCreateUserPayload } from "@/services/users/createUser"
import type { AdminUpdateUserPayload } from "@/services/users/updateUser"
import type { AuthUser } from "@/types/auth.types"

export type UserCacheSnapshot = {
  adminList: AdminUserRow[] | undefined
  assignableList: AssignableUserRow[] | undefined
  details: Array<{
    queryKey: readonly unknown[]
    data: AdminUserRow | undefined
  }>
  profile: AuthUser | undefined
}

export function snapshotUserCaches(
  queryClient: QueryClient
): UserCacheSnapshot {
  const details = queryClient
    .getQueriesData<AdminUserRow>({ queryKey: queryKeys.users.root })
    .filter(([key]) => {
      const k = key as readonly string[]
      return k.length === 3 && k[0] === "users" && k[1] === "detail"
    })
    .map(([queryKey, data]) => ({ queryKey, data }))

  return {
    adminList: queryClient.getQueryData<AdminUserRow[]>(queryKeys.users.list()),
    assignableList: queryClient.getQueryData<AssignableUserRow[]>(
      queryKeys.users.assignableList()
    ),
    details,
    profile: queryClient.getQueryData<AuthUser>(queryKeys.profile),
  }
}

export function cancelUserQueries(queryClient: QueryClient): void {
  void queryClient.cancelQueries({ queryKey: queryKeys.users.root })
  void queryClient.cancelQueries({ queryKey: queryKeys.profile })
}

export function restoreUserCaches(
  queryClient: QueryClient,
  snapshot: UserCacheSnapshot
): void {
  queryClient.setQueryData(queryKeys.users.list(), snapshot.adminList)
  queryClient.setQueryData(
    queryKeys.users.assignableList(),
    snapshot.assignableList
  )
  for (const { queryKey, data } of snapshot.details) {
    queryClient.setQueryData(queryKey, data)
  }
  queryClient.setQueryData(queryKeys.profile, snapshot.profile)
}

function updateAdminList(
  queryClient: QueryClient,
  updater: (users: AdminUserRow[]) => AdminUserRow[]
): void {
  const current = queryClient.getQueryData<AdminUserRow[]>(queryKeys.users.list())
  if (!current) return
  queryClient.setQueryData(queryKeys.users.list(), updater(current))
}

function updateAssignableList(
  queryClient: QueryClient,
  updater: (users: AssignableUserRow[]) => AssignableUserRow[]
): void {
  const current = queryClient.getQueryData<AssignableUserRow[]>(
    queryKeys.users.assignableList()
  )
  if (!current) return
  queryClient.setQueryData(queryKeys.users.assignableList(), updater(current))
}

export function patchUserInAdminList(
  queryClient: QueryClient,
  userId: string,
  patch:
    | Partial<AdminUserRow>
    | ((user: AdminUserRow) => AdminUserRow)
): void {
  updateAdminList(queryClient, (users) =>
    users.map((u) => {
      if (u.id !== userId) return u
      return typeof patch === "function" ? patch(u) : { ...u, ...patch }
    })
  )
}

export function patchUserInAssignableList(
  queryClient: QueryClient,
  userId: string,
  patch: Partial<AssignableUserRow>
): void {
  updateAssignableList(queryClient, (users) =>
    users.map((u) => (u.id === userId ? { ...u, ...patch } : u))
  )
}

export function prependUserToAdminList(
  queryClient: QueryClient,
  user: AdminUserRow
): void {
  updateAdminList(queryClient, (users) => [user, ...users])
}

export function prependUserToAssignableList(
  queryClient: QueryClient,
  user: AssignableUserRow
): void {
  updateAssignableList(queryClient, (users) => [user, ...users])
}

export function removeUserFromAdminList(
  queryClient: QueryClient,
  userId: string
): void {
  updateAdminList(queryClient, (users) => users.filter((u) => u.id !== userId))
}

export function removeUserFromAssignableList(
  queryClient: QueryClient,
  userId: string
): void {
  updateAssignableList(queryClient, (users) =>
    users.filter((u) => u.id !== userId)
  )
}

export function replaceUserInAssignableList(
  queryClient: QueryClient,
  matchId: string,
  user: AssignableUserRow
): void {
  updateAssignableList(queryClient, (users) =>
    users.map((u) => (u.id === matchId ? user : u))
  )
}

export function replaceUserInAdminList(
  queryClient: QueryClient,
  matchId: string,
  user: AdminUserRow
): void {
  updateAdminList(queryClient, (users) =>
    users.map((u) => (u.id === matchId ? user : u))
  )
}

export function setUserDetailCache(
  queryClient: QueryClient,
  user: AdminUserRow
): void {
  queryClient.setQueryData(queryKeys.users.detail(user.id), user)
}

export function buildOptimisticAdminUser(
  payload: AdminCreateUserPayload
): AdminUserRow {
  const now = new Date().toISOString()
  return {
    id: `optimistic-${crypto.randomUUID()}`,
    name: payload.name,
    email: payload.email,
    role: payload.role ?? "USER",
    createdAt: now,
    updatedAt: now,
  }
}

export function applyAdminUpdatePayload(
  user: AdminUserRow,
  payload: AdminUpdateUserPayload
): AdminUserRow {
  const next = { ...user, updatedAt: new Date().toISOString() }
  if (payload.name !== undefined) next.name = payload.name
  if (payload.email !== undefined) next.email = payload.email
  if (payload.role !== undefined) next.role = payload.role
  return next
}

export function adminRowToAssignable(row: AdminUserRow): AssignableUserRow {
  return { id: row.id, name: row.name, email: row.email }
}

export function adminRowToAuthUser(row: AdminUserRow): AuthUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export function applyAuthUpdatePayload(
  user: AuthUser,
  payload: AdminUpdateUserPayload
): AuthUser {
  return {
    ...user,
    ...(payload.name !== undefined ? { name: payload.name } : {}),
    ...(payload.email !== undefined ? { email: payload.email } : {}),
    ...(payload.role !== undefined ? { role: payload.role } : {}),
    updatedAt: new Date().toISOString(),
  }
}

export function syncUserAcrossCaches(
  queryClient: QueryClient,
  userId: string,
  patch:
    | Partial<AdminUserRow>
    | ((user: AdminUserRow) => AdminUserRow)
): AdminUserRow | undefined {
  let updated: AdminUserRow | undefined

  updateAdminList(queryClient, (users) =>
    users.map((u) => {
      if (u.id !== userId) return u
      updated =
        typeof patch === "function" ? patch(u) : { ...u, ...patch }
      return updated
    })
  )

  if (updated) {
    const { name, email } = updated
    patchUserInAssignableList(queryClient, userId, { name, email })
    setUserDetailCache(queryClient, updated)
    const profile = queryClient.getQueryData<AuthUser>(queryKeys.profile)
    if (profile?.id === userId) {
      queryClient.setQueryData(queryKeys.profile, adminRowToAuthUser(updated))
    }
  }

  return updated
}
