"use client"

import { memo } from "react"
import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { format } from "date-fns"

import { TaskRowActions } from "@/components/task/TaskRowActions"
import { Badge } from "@/components/ui/badge"
import { TASK_DRAG_TYPE } from "@/lib/dnd/task-drag-type"
import { cn } from "@/lib/utils"
import type { KanbanTaskCardItem, KanbanTaskCardModel } from "@/lib/kanban-presentational"

function formatDueShort(iso: string | null | undefined): string | null {
  if (!iso) return null
  try {
    return format(new Date(iso), "MMM d")
  } catch {
    return null
  }
}

function TaskCardBody({ model }: { model: KanbanTaskCardModel }) {
  const dueShort = formatDueShort(model.dueDate)

  return (
    <>
      <p className="line-clamp-2 text-sm font-medium leading-snug">{model.title}</p>
      <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        {model.assignee ? (
          <span className="max-w-[9rem] truncate" title={model.assignee.email}>
            {model.assignee.name}
          </span>
        ) : (
          <span className="italic">Unassigned</span>
        )}
        {dueShort ? (
          <>
            <span aria-hidden className="text-border">
              ·
            </span>
            <span className="tabular-nums">Due {dueShort}</span>
          </>
        ) : null}
      </div>
      <Badge
        variant={model.priorityBadgeVariant}
        className="mt-2 font-normal"
      >
        {model.priorityLabel}
      </Badge>
    </>
  )
}

export type TaskCardProps = {
  item: KanbanTaskCardItem
}

function TaskCardComponent({ item }: TaskCardProps) {
  const { model, permissions, viewTask, editTask, deleteTask } = item
  const { canEdit, canDelete, canChangeStatus } = permissions

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: model.id,
      disabled: !canChangeStatus,
      data: { type: TASK_DRAG_TYPE, preview: model },
    })

  const style = {
    transform: transform ? CSS.Translate.toString(transform) : undefined,
    ...(isDragging ? ({ willChange: "transform" } as const) : {}),
  }

  const dragHandleProps = canChangeStatus ? { ...listeners, ...attributes } : {}

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-card border-border hover:border-border relative flex min-w-0 w-full items-start gap-2 rounded-xl border p-3 shadow-sm transition-[box-shadow,border-color] hover:shadow-md",
        canChangeStatus ? "touch-none" : "",
        isDragging &&
          "z-50 cursor-grabbing shadow-lg ring-2 ring-ring/40 pointer-events-none opacity-0"
      )}
    >
      {canChangeStatus ? (
        <button
          type="button"
          className="min-w-0 flex-1 cursor-grab text-left"
          {...dragHandleProps}
        >
          <TaskCardBody model={model} />
        </button>
      ) : (
        <button
          type="button"
          className="min-w-0 flex-1 cursor-pointer text-left"
          onClick={viewTask}
        >
          <TaskCardBody model={model} />
        </button>
      )}
      <TaskRowActions
        rowLabel={model.title}
        canEdit={canEdit}
        canDelete={canDelete}
        onView={viewTask}
        onEdit={editTask}
        onDelete={deleteTask}
      />
    </div>
  )
}

export const TaskCard = memo(TaskCardComponent)

/** Read-only clone for `DragOverlay` — source card is hidden while dragging. */
export function TaskCardDragPreview({ model }: { model: KanbanTaskCardModel }) {
  return (
    <div className="bg-card border-border pointer-events-none flex w-[min(100vw-2rem,22rem)] min-w-0 max-w-[22rem] cursor-grabbing flex-col rounded-xl border p-3 shadow-xl ring-2 ring-ring/35">
      <TaskCardBody model={model} />
    </div>
  )
}
