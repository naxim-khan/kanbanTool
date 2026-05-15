"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronsUpDown, LogOut, UserCircle } from "lucide-react"

import { Button } from "@/components/Button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getSidebarNavGroups, PROFILE_ROUTE } from "@/config/sidebar"
import { cn } from "@/lib/utils"

import { BrandLogo } from "./brand-logo"
import { isSidebarHrefActive, SidebarNavItem } from "./sidebar-nav-item"

export type AppSidebarProps = {
  user: { name?: string | null; email?: string | null } | null
  isAdmin: boolean
  onLogout: () => void
  logoutPending?: boolean
}

function initialsFromUser(
  user: { name?: string | null; email?: string | null } | null
): string {
  if (!user?.name?.trim()) return "?"
  const parts = user.name.trim().split(/\s+/)
  const a = parts[0]?.[0] ?? ""
  const b = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : ""
  return (a + b).toUpperCase() || "?"
}

export function AppSidebar({
  user,
  isAdmin,
  onLogout,
  logoutPending = false,
}: AppSidebarProps) {
  const pathname = usePathname() ?? ""
  const { state } = useSidebar()
  const collapsed = state === "collapsed"
  const navGroups = getSidebarNavGroups(isAdmin)

  return (
    <Sidebar
      collapsible="icon"
      className="border-sidebar-border border-r shadow-none"
    >
      <SidebarHeader className="flex h-14 min-h-14 shrink-0 flex-row items-center justify-start border-b border-border px-3 py-2 transition-[padding] duration-300 ease-out">
        <Link
          href="/dashboard"
          aria-label="PM Kanban — go to dashboard"
          className={cn(
            "flex min-h-8 w-full min-w-0 items-center justify-start rounded-lg p-0 outline-none ring-sidebar-ring transition-[gap] duration-300 ease-out focus-visible:ring-2",
            collapsed ? "gap-0" : "gap-3"
          )}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center">
            <BrandLogo size={28} />
          </span>
          <div
            className={cn(
              "min-w-0 overflow-hidden transition-[max-width,opacity] duration-300 ease-out",
              collapsed
                ? "max-w-0 opacity-0"
                : "max-w-[min(14rem,calc(100%-2.5rem))] flex-1 opacity-100"
            )}
            aria-hidden={collapsed}
          >
            <div className="flex flex-col leading-tight">
              <span className="truncate text-sm font-semibold">PM Kanban</span>
              <span className="truncate text-xs text-muted-foreground">
                Workspace
              </span>
            </div>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="gap-0 px-0">
        {navGroups.map((group) => (
          <SidebarGroup key={group.id} className="px-3 py-2">
            <SidebarGroupLabel className="px-3 text-[11px] font-semibold tracking-wide text-sidebar-foreground/60 uppercase">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5 px-0">
                {group.items.map((item) => (
                  <SidebarNavItem
                    key={item.href}
                    item={item}
                    active={isSidebarHrefActive(pathname, item.href)}
                    collapsed={collapsed}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter className="gap-2 px-3 py-2">
        {isAdmin ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex w-full min-h-8 items-center justify-start rounded-lg p-2 text-left outline-none ring-sidebar-ring transition-[gap,padding] duration-300 ease-out hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50",
                  collapsed ? "gap-0" : "gap-2"
                )}
                aria-label="Open account menu"
              >
                <Avatar className="size-8 shrink-0">
                  <AvatarFallback>{initialsFromUser(user)}</AvatarFallback>
                </Avatar>
                <div
                  className={cn(
                    "min-w-0 overflow-hidden text-left transition-[max-width,opacity] duration-300 ease-out",
                    collapsed
                      ? "max-w-0 opacity-0"
                      : "max-w-[min(12rem,calc(100%-3rem))] flex-1 opacity-100"
                  )}
                  aria-hidden={collapsed}
                >
                  <div className="grid min-w-0 text-sm leading-tight">
                    <span className="truncate font-medium">
                      {user?.name ?? "Guest"}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user?.email ?? "—"}
                    </span>
                  </div>
                </div>
                <ChevronsUpDown
                  className={cn(
                    "size-4 shrink-0 text-muted-foreground transition-[max-width,opacity,margin] duration-300 ease-out",
                    collapsed
                      ? "ml-0 max-w-0 overflow-hidden opacity-0"
                      : "max-w-4 opacity-100"
                  )}
                  aria-hidden
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-56"
              side="right"
              align="end"
              sideOffset={8}
            >
              <DropdownMenuItem asChild>
                <Link href={PROFILE_ROUTE} className="cursor-pointer gap-2">
                  <UserCircle className="size-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                disabled={logoutPending}
                className="cursor-pointer gap-2"
                onSelect={(e) => {
                  e.preventDefault()
                  onLogout()
                }}
              >
                <LogOut className="size-4" />
                {logoutPending ? "Signing out…" : "Log out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <SidebarMenu className="gap-1 px-0">
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={isSidebarHrefActive(pathname, PROFILE_ROUTE)}
                tooltip="Profile"
                className="rounded-lg font-normal justify-start"
              >
                <Link
                  href={PROFILE_ROUTE}
                  className={cn(
                    "flex w-full min-w-0 items-center justify-start gap-2",
                    collapsed && "gap-0"
                  )}
                >
                  <UserCircle aria-hidden className="size-4 shrink-0" />
                  <span className={collapsed ? "sr-only" : undefined}>
                    Profile
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                fullWidth
                className="justify-start rounded-lg px-2 font-normal"
                leftIcon={<LogOut className="size-4" aria-hidden />}
                loading={logoutPending}
                loadingText="Signing out…"
                onClick={onLogout}
              >
                <span className={collapsed ? "sr-only" : undefined}>
                  Log out
                </span>
              </Button>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
