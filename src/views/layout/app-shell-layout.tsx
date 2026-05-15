"use client"

import type { ReactNode } from "react"

import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AppSidebar } from "@/components/layout/AppSidebar"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { useLogout } from "@/hooks/auth/useLogout"
import { useAppSelector } from "@/store/hooks"

type AppShellLayoutProps = {
  children: ReactNode
}

/**
 * Authenticated chrome: `SidebarProvider` + `TooltipProvider`.
 * Mutations and Redux reads live here so `components/layout/*` stays presentational.
 */
export function AppShellLayout({ children }: AppShellLayoutProps) {
  const user = useAppSelector((s) => s.auth.user)
  const isAdmin = user?.role === "ADMIN"
  const logout = useLogout()

  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider defaultOpen>
        <AppSidebar
          user={user}
          isAdmin={isAdmin}
          onLogout={() => {
            void logout.mutate()
          }}
          logoutPending={logout.isPending}
        />
        <SidebarInset>
          <header className="bg-background/80 supports-backdrop-filter:bg-background/60 sticky top-0 z-20 flex h-14 w-full min-w-0 shrink-0 items-center gap-2 border-b border-border px-3 backdrop-blur-md md:px-4">
            <SidebarTrigger className="-ml-0.5 shrink-0" />
            <Separator orientation="vertical" className="mr-1 h-6" />
            <span className="text-muted-foreground min-w-0 flex-1 text-sm leading-snug">
              Press{" "}
              <kbd className="bg-muted pointer-events-none rounded border px-1.5 py-0.5 font-mono text-[10px] font-medium">
                ⌘B
              </kbd>{" "}
              /{" "}
              <kbd className="bg-muted pointer-events-none rounded border px-1.5 py-0.5 font-mono text-[10px] font-medium">
                Ctrl+B
              </kbd>{" "}
              to toggle
            </span>
            <div className="flex shrink-0 items-center gap-2 border-l border-border pl-2 md:pl-3">
              <ThemeToggle />
            </div>
          </header>
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
