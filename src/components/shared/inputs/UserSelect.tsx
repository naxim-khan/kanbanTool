"use client"

import { useEffect, useId, useRef, useState } from "react"
import {
  Check,
  ChevronDown,
  ChevronsUpDown,
  Loader2,
  Search,
  UserX,
} from "lucide-react"

import { ValidationHint } from "@/components/ValidationHint"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export type UserSelectOption = {
  id: string
  name: string
  email: string
}

export type UserSelectProps = {
  label: string
  value: string
  onChange: (userId: string) => void
  options: UserSelectOption[]
  /** Shown in the trigger when `value` is set but the user is missing from `options` (e.g. filtered out). */
  selectedDisplay?: UserSelectOption | null
  /**
   * When `value` is empty, show this in the trigger (e.g. filters: “Any assignee”).
   * If omitted, empty value shows the assignee-picker placeholder.
   */
  emptySelectionLabel?: string
  /** When set with `emptySelectionLabel`, adds a top list row to clear the selection (filters). */
  allowEmptyOption?: boolean
  /** Compact styling for dense filter toolbars. */
  variant?: "default" | "toolbar"
  isLoading?: boolean
  isFetching?: boolean
  search: string
  onSearchChange: (q: string) => void
  disabled?: boolean
  error?: string
  allowClear?: boolean
  placeholder?: string
  emptyMessage?: string
  fetchError?: string | null
  onRetry?: () => void
  /** Accessible label for the clear control (filter vs form assignee). */
  clearSelectionTitle?: string
}

function findOption(
  options: UserSelectOption[],
  id: string
): UserSelectOption | undefined {
  return options.find((o) => o.id === id)
}

export function UserSelect({
  label,
  value,
  onChange,
  options,
  selectedDisplay,
  emptySelectionLabel,
  allowEmptyOption = false,
  variant = "default",
  isLoading = false,
  isFetching = false,
  search,
  onSearchChange,
  disabled = false,
  error,
  allowClear = true,
  placeholder = "Search users…",
  emptyMessage = "No users found",
  fetchError,
  onRetry,
  clearSelectionTitle = "Clear assignee",
}: UserSelectProps) {
  const [open, setOpen] = useState(false)
  const listId = useId()
  const searchRef = useRef<HTMLInputElement>(null)

  const selected =
    (value && findOption(options, value)) ||
    (value && selectedDisplay?.id === value ? selectedDisplay : undefined)

  useEffect(() => {
    if (!open) return
    const id = requestAnimationFrame(() => {
      searchRef.current?.focus()
      searchRef.current?.select()
    })
    return () => cancelAnimationFrame(id)
  }, [open])

  const isToolbar = variant === "toolbar"

  const triggerFallbackText =
    !value && emptySelectionLabel
      ? emptySelectionLabel
      : !value
        ? "Select assignee…"
        : !selected
          ? "Unknown user"
          : null

  return (
    <div className="w-full min-w-0">
      <div className="flex flex-col gap-1.5">
        <span
          className={cn(
            isToolbar
              ? "text-muted-foreground text-xs font-medium"
              : "text-[0.9375rem] font-medium leading-snug"
          )}
        >
          {label}
        </span>
        <div className="relative">
          <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) onSearchChange("")
        }}
      >
        <div className="flex w-full min-w-0 gap-2">
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size={isToolbar ? "sm" : "default"}
              role="combobox"
              aria-expanded={open}
              aria-controls={listId}
              disabled={disabled}
              className={cn(
                "min-w-0 flex-1 justify-between font-normal",
                !isToolbar && "h-10 min-h-10",
                !selected && !value && "text-muted-foreground",
                value && !selected && "text-muted-foreground",
                error && "border-destructive"
              )}
            >
              <span className="truncate text-left">
                {selected ? (
                  <span className="text-foreground">
                    <span className="font-medium">{selected.name}</span>
                    {!isToolbar && selected.email ? (
                      <span className="ml-2 text-muted-foreground">
                        {selected.email}
                      </span>
                    ) : null}
                  </span>
                ) : (
                  <span className="text-muted-foreground">{triggerFallbackText}</span>
                )}
              </span>
              {isToolbar ? (
                <ChevronDown className="pointer-events-none ml-2 size-4 shrink-0 text-muted-foreground opacity-50" />
              ) : (
                <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
              )}
            </Button>
          </PopoverTrigger>
          {allowClear && value ? (
            <Button
              type="button"
              variant="outline"
              size={isToolbar ? "icon-sm" : "icon"}
              className="shrink-0"
              disabled={disabled}
              title={clearSelectionTitle}
              onClick={() => {
                onChange("")
                onSearchChange("")
              }}
            >
              <UserX className="size-4" />
            </Button>
          ) : null}
        </div>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] min-w-[280px] max-w-[min(100vw-2rem,420px)] p-0 sm:min-w-[320px]"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="flex flex-col gap-0 border-b border-border p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={searchRef}
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={placeholder}
                className="h-9 pl-9"
                disabled={disabled}
                aria-label="Search users by name or email"
              />
              {isFetching && !isLoading ? (
                <Loader2 className="absolute right-2.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              ) : null}
            </div>
          </div>
          <div
            id={listId}
            role="listbox"
            aria-label="Users"
            className="max-h-60 overflow-y-auto p-1"
          >
            {fetchError ? (
              <div className="space-y-2 px-2 py-6 text-center text-sm">
                <p className="text-destructive">{fetchError}</p>
                {onRetry ? (
                  <Button type="button" size="sm" variant="secondary" onClick={onRetry}>
                    Retry
                  </Button>
                ) : null}
              </div>
            ) : isLoading ? (
              <div className="space-y-2 p-2">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
              </div>
            ) : (
              <>
                {allowEmptyOption && emptySelectionLabel ? (
                  <button
                    type="button"
                    role="option"
                    aria-selected={!value}
                    className={cn(
                      "mb-1 flex w-full cursor-pointer flex-col rounded-md border border-border/60 px-2 py-2 text-left text-sm outline-none transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      "focus-visible:bg-accent focus-visible:text-accent-foreground",
                      !value && "bg-accent/40"
                    )}
                    onClick={() => {
                      onChange("")
                      setOpen(false)
                      onSearchChange("")
                    }}
                  >
                    <span className="font-medium">{emptySelectionLabel}</span>
                    <span className="text-xs text-muted-foreground">
                      Do not filter by this field
                    </span>
                  </button>
                ) : null}
                {options.length === 0 ? (
                  <p className="px-2 py-8 text-center text-sm text-muted-foreground">
                    {emptyMessage}
                  </p>
                ) : (
                  options.map((user) => {
                    const isActive = user.id === value
                    return (
                      <button
                        key={user.id}
                        type="button"
                        role="option"
                        aria-selected={isActive}
                        className={cn(
                          "flex w-full cursor-pointer flex-col gap-0.5 rounded-md px-2 py-2 text-left text-sm outline-none transition-colors",
                          "hover:bg-accent hover:text-accent-foreground",
                          "focus-visible:bg-accent focus-visible:text-accent-foreground",
                          isActive && "bg-accent/60"
                        )}
                        onClick={() => {
                          onChange(user.id)
                          setOpen(false)
                          onSearchChange("")
                        }}
                      >
                        <span className="flex items-center gap-2 font-medium">
                          {isActive ? (
                            <Check className="size-4 shrink-0 text-primary" />
                          ) : (
                            <span className="inline-block size-4 shrink-0" />
                          )}
                          <span className="truncate">{user.name}</span>
                        </span>
                        <span className="truncate pl-6 text-xs text-muted-foreground">
                          {user.email}
                        </span>
                      </button>
                    )
                  })
                )}
              </>
            )}
          </div>
        </PopoverContent>
          </Popover>
          <ValidationHint message={error} />
        </div>
      </div>
    </div>
  )
}
