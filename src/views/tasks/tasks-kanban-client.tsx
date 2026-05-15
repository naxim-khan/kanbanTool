"use client"

import { useLayoutEffect, useMemo, useRef, useState, startTransition } from "react"
import { flushSync } from "react-dom"
import {
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"

import { KanbanBoard } from "@/components/board/KanbanBoard"
import { TaskCardDragPreview } from "@/components/board/TaskCard"
import { Skeleton } from "@/components/ui/skeleton"
import {
  TASK_PRIORITY_LABELS,
  TASK_STATUS_DOT_CLASS,
  TASK_STATUS_LABELS,
  TASK_STATUS_VALUES,
} from "@/constants/tasks"
import { TASK_DRAG_TYPE } from "@/lib/dnd/task-drag-type"
import {
  applyStatusOverrideToGrouped,
  type TasksByStatus,
} from "@/lib/helpers/group-tasks-by-status"
import type { TaskPriority, TaskStatus, TaskWithRelations } from "@/schemas/task-api.schema"
import { getTaskPermissions } from "@/lib/helpers/task-permissions"
import type {
  KanbanBoardColumn,
  KanbanTaskCardModel,
  TaskPriorityBadgeVariant,
} from "@/lib/kanban-presentational"
import type { UserRole } from "@/types/auth.types"

export type TasksKanbanClientProps = {
  grouped: TasksByStatus
  isLoading: boolean
  sessionUserId: string | undefined
  sessionRole: UserRole | undefined
  onView: (task: TaskWithRelations) => void
  onEdit: (task: TaskWithRelations) => void
  onDelete: (task: TaskWithRelations) => void
  onMoveStatus: (args: { id: string; status: TaskStatus }) => void
  /** When this increments, any optimistic column override is cleared (mutation failed). */
  moveFailureCount: number
  /** Task ids with in-flight or queued status PATCH — keep column override until settled. */
  pendingMoveTaskIds: readonly string[]
}

function priorityBadgeVariantFor(p: TaskPriority): TaskPriorityBadgeVariant {
  if (p === "URGENT") return "destructive"
  if (p === "HIGH") return "default"
  if (p === "MEDIUM") return "secondary"
  return "outline"
}

function toKanbanTaskCardModel(task: TaskWithRelations): KanbanTaskCardModel {
  return {
    id: task.id,
    title: task.title,
    priorityLabel: TASK_PRIORITY_LABELS[task.priority],
    priorityBadgeVariant: priorityBadgeVariantFor(task.priority),
    dueDate: task.dueDate,
    assignee: task.assignee
      ? { name: task.assignee.name, email: task.assignee.email }
      : null,
  }
}

export function TasksKanbanClient({
  grouped,
  isLoading,
  sessionUserId,
  sessionRole,
  onView,
  onEdit,
  onDelete,
  onMoveStatus,
  moveFailureCount,
  pendingMoveTaskIds,
}: TasksKanbanClientProps) {
  const [activePreview, setActivePreview] = useState<KanbanTaskCardModel | null>(
    null
  )
  const [columnOverride, setColumnOverride] = useState<{
    taskId: string
    status: TaskStatus
  } | null>(null)

  const displayedGrouped = useMemo(
    () => applyStatusOverrideToGrouped(grouped, columnOverride),
    [grouped, columnOverride]
  )

  const boardColumns: KanbanBoardColumn[] = useMemo(
    () =>
      TASK_STATUS_VALUES.map((status) => ({
        statusId: status,
        label: TASK_STATUS_LABELS[status],
        dotClassName: TASK_STATUS_DOT_CLASS[status],
        items: displayedGrouped[status].map((task) => {
          const permissions = getTaskPermissions(
            task,
            sessionUserId,
            sessionRole
          )
          return {
            model: toKanbanTaskCardModel(task),
            permissions,
            viewTask: () => onView(task),
            editTask: () => onEdit(task),
            deleteTask: () => onDelete(task),
          }
        }),
      })),
    [
      displayedGrouped,
      sessionUserId,
      sessionRole,
      onView,
      onEdit,
      onDelete,
    ]
  )

  const prevFailureRef = useRef(moveFailureCount)
  useLayoutEffect(() => {
    if (moveFailureCount > prevFailureRef.current) {
      startTransition(() => setColumnOverride(null))
    }
    prevFailureRef.current = moveFailureCount
  }, [moveFailureCount])

  useLayoutEffect(() => {
    if (!columnOverride) return
    if (pendingMoveTaskIds.includes(columnOverride.taskId)) return
    const flat = [...grouped.TODO, ...grouped.IN_PROGRESS, ...grouped.DONE]
    const t = flat.find((x) => x.id === columnOverride.taskId)
    if (t?.status === columnOverride.status) {
      startTransition(() => setColumnOverride(null))
    }
  }, [grouped, columnOverride, pendingMoveTaskIds])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  const onDragStart = (event: DragStartEvent) => {
    const payload = event.active.data.current
    if (
      payload &&
      payload.type === TASK_DRAG_TYPE &&
      "preview" in payload &&
      payload.preview
    ) {
      setActivePreview(payload.preview as KanbanTaskCardModel)
    }
  }

  const onDragCancel = () => {
    setActivePreview(null)
  }

  const onDragEnd = (event: DragEndEvent) => {
    try {
      const { active, over } = event
      if (!over) return
      const payload = active.data.current
      if (!payload || payload.type !== TASK_DRAG_TYPE) return
      const taskId = String(active.id)
      const flat = [
        ...displayedGrouped.TODO,
        ...displayedGrouped.IN_PROGRESS,
        ...displayedGrouped.DONE,
      ]
      const task = flat.find((t) => t.id === taskId)
      if (!task) return
      const overId = String(over.id)
      if (!TASK_STATUS_VALUES.includes(overId as TaskStatus)) return
      const nextStatus = overId as TaskStatus
      const permissions = getTaskPermissions(task, sessionUserId, sessionRole)
      if (!permissions.canChangeStatus) return
      if (task.status === nextStatus) return
      flushSync(() => {
        setColumnOverride({ taskId: task.id, status: nextStatus })
      })
      onMoveStatus({ id: task.id, status: nextStatus })
    } finally {
      setActivePreview(null)
    }
  }

  if (isLoading) {
    return (
      <div
        className="overflow-x-auto pb-1"
        aria-busy="true"
        aria-label="Loading board"
      >
        <div className="grid min-w-[640px] gap-4 md:min-w-0 md:grid-cols-3">
          {[0, 1, 2].map((col) => (
            <div key={col} className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-5 w-8 rounded-md" />
              </div>
              <div className="border-border bg-muted/20 flex min-h-[220px] flex-col gap-2 rounded-xl border border-dashed p-2 md:min-h-[280px]">
                <Skeleton className="h-[4.5rem] w-full rounded-lg" />
                <Skeleton className="h-[4.5rem] w-full rounded-lg" />
                <Skeleton className="h-[4.5rem] w-full shrink-0 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={onDragStart}
      onDragCancel={onDragCancel}
      onDragEnd={onDragEnd}
    >
      <KanbanBoard columns={boardColumns} />
      <DragOverlay dropAnimation={null}>
        {activePreview ? <TaskCardDragPreview model={activePreview} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
