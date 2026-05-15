"use client"

import { useMemo } from "react"
import {
  getCoreRowModel,
  useReactTable,
  type OnChangeFn,
  type PaginationState,
} from "@tanstack/react-table"

import { DataTable } from "@/components/shared/data-table"
import type { TaskWithRelations } from "@/schemas/task-api.schema"
import type { UserRole } from "@/types/auth.types"

import {
  createTasksTableColumns,
  type TasksTableMeta,
} from "./tasks-table-columns"

export type TasksTableClientProps = {
  /** Current server page rows (already sliced). */
  items: TaskWithRelations[]
  totalRows: number
  isLoading: boolean
  pagination: PaginationState
  onPaginationChange: OnChangeFn<PaginationState>
  taskRowActions: {
    onView: (task: TaskWithRelations) => void
    onEdit: (task: TaskWithRelations) => void
    onDelete: (task: TaskWithRelations) => void
  }
  sessionUserId: string | undefined
  sessionRole: UserRole | undefined
}

export function TasksTableClient({
  items,
  totalRows,
  isLoading,
  pagination,
  onPaginationChange,
  taskRowActions,
  sessionUserId,
  sessionRole,
}: TasksTableClientProps) {
  const columns = useMemo(() => createTasksTableColumns(), [])

  const tableMeta = useMemo(
    (): TasksTableMeta => ({
      taskRowActions,
      sessionUserId,
      sessionRole,
    }),
    [taskRowActions, sessionUserId, sessionRole]
  )

  const pageCount = Math.max(1, Math.ceil(totalRows / pagination.pageSize))

  const table = useReactTable({
    data: items,
    columns,
    meta: tableMeta,
    pageCount,
    state: { pagination },
    onPaginationChange,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <DataTable
      className="rounded-xl shadow-sm ring-1 ring-border/50"
      table={table}
      columns={columns}
      totalRows={totalRows}
      isLoading={isLoading}
      emptyMessage="No tasks match these filters."
    />
  )
}
