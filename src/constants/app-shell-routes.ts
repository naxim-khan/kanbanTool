/** Routes that render `AppShellLayout` (header includes theme toggle). */
export const APP_SHELL_ROUTE_PREFIXES = [
  "/dashboard",
  "/tasks",
  "/users",
  "/profile",
  "/billing",
  "/notifications",
  "/settings",
  "/analytics",
] as const

export function isAppShellPath(pathname: string | null): boolean {
  if (!pathname) return false
  return APP_SHELL_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}
