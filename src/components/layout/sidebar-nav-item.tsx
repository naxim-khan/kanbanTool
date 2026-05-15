"use client"

import Link from "next/link"

import {
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import type { SidebarNavLinkItem } from "@/config/sidebar"
import { cn } from "@/lib/utils"

/** True when this href should show as active (supports nested routes). */
export function isSidebarHrefActive(pathname: string, href: string): boolean {
  if (pathname === href) return true
  if (href === "/") return false
  return pathname.startsWith(`${href}/`)
}

type SidebarNavItemProps = {
  item: SidebarNavLinkItem
  active: boolean
  /** Narrow icon rail (sidebar `state === "collapsed"`). */
  collapsed?: boolean
}

/**
 * One nav row: keyboard-accessible link + shadcn sidebar button styling.
 * Tooltip label matches shadcn’s collapsed “icon rail” pattern.
 */
export function SidebarNavItem({ item, active, collapsed }: SidebarNavItemProps) {
  const Icon = item.icon

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={active}
        tooltip={item.title}
        className="rounded-lg font-normal justify-start"
      >
        <Link
          href={item.href}
          prefetch={false}
          className={cn(
            "flex w-full min-w-0 items-center justify-start gap-2 transition-[gap] duration-300 ease-out",
            collapsed && "gap-0"
          )}
        >
          <Icon aria-hidden className="size-4 shrink-0" />
          <span className={collapsed ? "sr-only" : undefined}>{item.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
