export type UserSearchRow = {
  id: string
  name: string
  email: string
}

function normalize(s: string): string {
  return s.trim().toLowerCase()
}

/**
 * Client-side filter for assignee/creator comboboxes (no refetch per keystroke).
 */
export function filterUsersBySearch(
  users: UserSearchRow[],
  search: string
): UserSearchRow[] {
  const q = normalize(search)
  if (!q) return users
  return users.filter(
    (u) =>
      normalize(u.name).includes(q) || normalize(u.email).includes(q)
  )
}
