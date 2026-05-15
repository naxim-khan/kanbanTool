"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"

import { TaskRowActions } from "@/components/task/TaskRowActions"
import { Badge } from "@/components/ui/badge"
import {
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
} from "@/constants/tasks"
import { getTaskPermissions } from "@/lib/helpers/task-permissions"
import type { TaskWithRelations } from "@/schemas/task-api.schema"
import type { UserRole } from "@/types/auth.types"

export type TasksTableMeta = {
  taskRowActions: {
    onView: (task: TaskWithRelations) => void
    onEdit: (task: TaskWithRelations) => void
    onDelete: (task: TaskWithRelations) => void
  }
  sessionUserId: string | undefined
  sessionRole: UserRole | undefined
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—"
  try {
    return format(new Date(value), "MMM d, yyyy")
  } catch {
    return "—"
  }
}

export function createTasksTableColumns(): ColumnDef<TaskWithRelations>[] {
  return [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <span className="max-w-[200px] truncate font-medium">
          {row.getValue("title") as string}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as keyof typeof TASK_STATUS_LABELS
        return (
          <Badge variant="secondary" className="font-normal">
            {TASK_STATUS_LABELS[status]}
          </Badge>
        )
      },
    },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => {
        const p = row.getValue("priority") as keyof typeof TASK_PRIORITY_LABELS
        return (
          <Badge variant="outline" className="font-normal">
            {TASK_PRIORITY_LABELS[p]}
          </Badge>
        )
      },
    },
    {
      id: "assignee",
      header: "Assignee",
      accessorFn: (row) => row.assignee?.name ?? "—",
      cell: ({ getValue }) => (
        <span className="text-muted-foreground max-w-[140px] truncate text-sm">
          {getValue() as string}
        </span>
      ),
    },
    {
      accessorKey: "updatedAt",
      header: "Updated",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm tabular-nums">
          {formatDate(row.getValue("updatedAt"))}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row, table }) => {
        const meta = table.options.meta as TasksTableMeta | undefined
        if (!meta?.taskRowActions) return null
        const permissions = getTaskPermissions(
          row.original,
          meta.sessionUserId,
          meta.sessionRole
        )
        return (
          <div className="flex justify-end">
            <TaskRowActions
              rowLabel={row.original.title}
              canEdit={permissions.canEdit}
              canDelete={permissions.canDelete}
              onView={() => meta.taskRowActions.onView(row.original)}
              onEdit={() => meta.taskRowActions.onEdit(row.original)}
              onDelete={() => meta.taskRowActions.onDelete(row.original)}
            />
          </div>
        )
      },
      size: 48,
      enableSorting: false,
      enableHiding: false,
    },
  ]
}
