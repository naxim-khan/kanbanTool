import type { LucideIcon } from "lucide-react"
import { ClipboardList, LayoutDashboard, UserCircle, Users } from "lucide-react"

/** Single navigable row (icon is a component reference, not JSX). */
export type SidebarNavLinkItem = {
  title: string
  href: string
  icon: LucideIcon
}

/**
 * Visual section in the sidebar. Add new groups as the app grows
 * (e.g. “Admin”, “Integrations”) without changing layout code.
 */
export type SidebarNavGroup = {
  id: string
  label: string
  items: SidebarNavLinkItem[]
}

/** Profile route — data from GET /api/auth/profile */
export const PROFILE_ROUTE = "/profile"

/**
 * Navigation groups filtered by role.
 * - All users: Dashboard, Tasks, Profile
 * - Admins only: Users
 */
export function getSidebarNavGroups(isAdmin: boolean): SidebarNavGroup[] {
  const workspaceItems: SidebarNavLinkItem[] = [
    { title: "Tasks", href: "/tasks", icon: ClipboardList },
  ]

  if (isAdmin) {
    workspaceItems.push({ title: "Users", href: "/users", icon: Users })
  }

  return [
    {
      id: "overview",
      label: "Overview",
      items: [
        { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      ],
    },
    {
      id: "workspace",
      label: "Workspace",
      items: workspaceItems,
    },
    {
      id: "account",
      label: "Account",
      items: [{ title: "Profile", href: PROFILE_ROUTE, icon: UserCircle }],
    },
  ]
}
