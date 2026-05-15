"use client"

import { useEffect, useMemo, useState, startTransition } from "react"

import { UserSelect } from "@/components/shared/inputs/UserSelect"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_VALUES,
  TASK_STATUS_LABELS,
  TASK_STATUS_VALUES,
} from "@/constants/tasks"
import { useDebouncedValue } from "@/hooks/shared/useDebouncedValue"
import { useAssignableUsersList } from "@/hooks/users/useAssignableUsersList"
import { filterUsersBySearch } from "@/lib/helpers/filter-users-by-search"
import type {
  TaskPriorityFilter,
  TaskStatusFilter,
} from "@/store/slices/taskFilterSlice"

const ALL = "ALL" as const

export type TasksFilterToolbarProps = {
  status: TaskStatusFilter
  priority: TaskPriorityFilter
  assigneeId: string
  creatorId: string
  onStatusChange: (v: TaskStatusFilter) => void
  onPriorityChange: (v: TaskPriorityFilter) => void
  onAssigneeChange: (v: string) => void
  onCreatorChange: (v: string) => void
  onReset: () => void
}

/**
 * Tasks filter bar: Redux-driven selects + assignable-user comboboxes
 * (no UUID typing). Lives under `views/tasks` (not `src/pages` — reserved by Next.js).
 */
export function TasksFilterToolbar({
  status,
  priority,
  assigneeId,
  creatorId,
  onStatusChange,
  onPriorityChange,
  onAssigneeChange,
  onCreatorChange,
  onReset,
}: TasksFilterToolbarProps) {
  const { data, isPending, isFetching, isError, error, refetch } =
    useAssignableUsersList(true)

  const [assigneeSearch, setAssigneeSearch] = useState("")
  const [creatorSearch, setCreatorSearch] = useState("")
  const debouncedAssigneeSearch = useDebouncedValue(assigneeSearch, 400)
  const debouncedCreatorSearch = useDebouncedValue(creatorSearch, 400)

  const assigneeOptions = useMemo(
    () => filterUsersBySearch(data ?? [], debouncedAssigneeSearch),
    [data, debouncedAssigneeSearch]
  )
  const creatorOptions = useMemo(
    () => filterUsersBySearch(data ?? [], debouncedCreatorSearch),
    [data, debouncedCreatorSearch]
  )

  const assigneeSelectedDisplay = useMemo(() => {
    if (!assigneeId.trim() || !data) return null
    const u = data.find((x) => x.id === assigneeId.trim())
    return u
      ? { id: u.id, name: u.name, email: u.email }
      : { id: assigneeId.trim(), name: "Unknown user", email: "" }
  }, [assigneeId, data])

  const creatorSelectedDisplay = useMemo(() => {
    if (!creatorId.trim() || !data) return null
    const u = data.find((x) => x.id === creatorId.trim())
    return u
      ? { id: u.id, name: u.name, email: u.email }
      : { id: creatorId.trim(), name: "Unknown user", email: "" }
  }, [creatorId, data])

  useEffect(() => {
    if (!assigneeId.trim()) {
      startTransition(() => setAssigneeSearch(""))
    }
  }, [assigneeId])

  useEffect(() => {
    if (!creatorId.trim()) {
      startTransition(() => setCreatorSearch(""))
    }
  }, [creatorId])

  const listErrorMessage = isError
    ? error instanceof Error
      ? error.message
      : "Could not load users."
    : null

  return (
    <div className="border-border/70 bg-muted/25 flex flex-col gap-3 rounded-xl border p-3 md:flex-row md:flex-wrap md:items-end">
      {listErrorMessage ? (
        <div className="border-destructive/40 bg-destructive/5 text-destructive flex w-full flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm">
          <span>{listErrorMessage}</span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => void refetch()}
          >
            Retry
          </Button>
        </div>
      ) : null}
      <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="min-w-0 space-y-1.5">
          <span className="text-muted-foreground text-xs font-medium">
            Status
          </span>
          <Select
            value={status}
            onValueChange={(v) => onStatusChange(v as TaskStatusFilter)}
          >
            <SelectTrigger size="sm" className="w-full min-w-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All</SelectItem>
              {TASK_STATUS_VALUES.map((s) => (
                <SelectItem key={s} value={s}>
                  {TASK_STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-0 space-y-1.5">
          <span className="text-muted-foreground text-xs font-medium">
            Priority
          </span>
          <Select
            value={priority}
            onValueChange={(v) => onPriorityChange(v as TaskPriorityFilter)}
          >
            <SelectTrigger size="sm" className="w-full min-w-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All</SelectItem>
              {TASK_PRIORITY_VALUES.map((p) => (
                <SelectItem key={p} value={p}>
                  {TASK_PRIORITY_LABELS[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-0">
          <UserSelect
            label="Assignee"
            variant="toolbar"
            value={assigneeId.trim()}
            onChange={onAssigneeChange}
            options={assigneeOptions}
            selectedDisplay={assigneeSelectedDisplay}
            emptySelectionLabel="Any assignee"
            allowEmptyOption
            allowClear
            search={assigneeSearch}
            onSearchChange={setAssigneeSearch}
            isLoading={isPending}
            isFetching={isFetching}
            disabled={isError}
            fetchError={null}
            onRetry={() => void refetch()}
            placeholder="Search by name or email…"
            emptyMessage="No users match this search."
            clearSelectionTitle="Clear assignee filter"
          />
        </div>
        <div className="min-w-0">
          <UserSelect
            label="Creator"
            variant="toolbar"
            value={creatorId.trim()}
            onChange={onCreatorChange}
            options={creatorOptions}
            selectedDisplay={creatorSelectedDisplay}
            emptySelectionLabel="Any creator"
            allowEmptyOption
            allowClear
            search={creatorSearch}
            onSearchChange={setCreatorSearch}
            isLoading={isPending}
            isFetching={isFetching}
            disabled={isError}
            fetchError={null}
            onRetry={() => void refetch()}
            placeholder="Search by name or email…"
            emptyMessage="No users match this search."
            clearSelectionTitle="Clear creator filter"
          />
        </div>
      </div>
      <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={onReset}>
        Reset filters
      </Button>
    </div>
  )
}
