"use client"

import { useCallback, useMemo, useState } from "react"
import type { PaginationState } from "@tanstack/react-table"

import { ErrorState } from "@/components/ErrorState"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { groupTasksByStatus } from "@/lib/helpers/group-tasks-by-status"
import { TASK_KANBAN_LIST_LIMIT } from "@/constants/tasks"
import { useCreateTask } from "@/hooks/tasks/useCreateTask"
import { useDeleteTask } from "@/hooks/tasks/useDeleteTask"
import { useTask } from "@/hooks/tasks/useTask"
import { useTasks } from "@/hooks/tasks/useTasks"
import { useTaskStatusDndMutation } from "@/hooks/tasks/useTaskStatusDndMutation"
import { useUpdateTask } from "@/hooks/tasks/useUpdateTask"
import { useUpdateTaskStatus } from "@/hooks/tasks/useUpdateTaskStatus"
import { datetimeLocalValueToIso } from "@/lib/helpers/datetime-local"
import { getTaskPermissions } from "@/lib/helpers/task-permissions"
import { mergeTasksListQuery } from "@/lib/helpers/merge-tasks-list-query"
import {
  taskEditFormSchema,
  type TaskEditFormValues,
} from "@/schemas/task-form.schema"
import type { TaskWithRelations } from "@/schemas/task-api.schema"
import type { CreateTaskPayload } from "@/services/tasks/createTask"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import {
  resetTaskFilters,
  setAssigneeFilter,
  setCreatorFilter,
  setPriorityFilter,
  setStatusFilter,
} from "@/store/slices/taskFilterSlice"

import { TasksFilterToolbar } from "./tasks-filter-toolbar"

import { TasksDialogs } from "./tasks-dialogs"
import { TasksKanbanClient } from "./tasks-kanban-client"
import { TasksTableClient } from "./tasks-table-client"

type TasksView = "kanban" | "table"

export function TasksClient() {
  const dispatch = useAppDispatch()
  const filters = useAppSelector((s) => s.taskFilters)
  const sessionUserId = useAppSelector((s) => s.auth.user?.id)
  const sessionRole = useAppSelector((s) => s.auth.user?.role)

  const [view, setView] = useState<TasksView>("kanban")
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  })

  const [viewTask, setViewTask] = useState<TaskWithRelations | null>(null)
  const [editTask, setEditTask] = useState<TaskWithRelations | null>(null)
  const [deleteTask, setDeleteTask] = useState<TaskWithRelations | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const kanbanQuery = useMemo(
    () =>
      mergeTasksListQuery(filters, {
        page: 1,
        limit: TASK_KANBAN_LIST_LIMIT,
      }),
    [filters]
  )

  const tableQuery = useMemo(
    () =>
      mergeTasksListQuery(filters, {
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      }),
    [filters, pagination.pageIndex, pagination.pageSize]
  )

  const listQuery = view === "kanban" ? kanbanQuery : tableQuery

  const { data, isPending, isError, error, refetch } = useTasks(listQuery)
  const viewDetail = useTask(viewTask?.id ?? null, Boolean(viewTask))
  const resolvedViewTask = (viewDetail.data ?? viewTask) as TaskWithRelations | null

  const moveStatus = useTaskStatusDndMutation()
  const createMut = useCreateTask()
  const updateMut = useUpdateTask()
  const updateStatusMut = useUpdateTaskStatus()
  const deleteMut = useDeleteTask()

  const onViewTask = useCallback((t: TaskWithRelations) => setViewTask(t), [])
  const onEditTask = useCallback((t: TaskWithRelations) => {
    if (
      !getTaskPermissions(t, sessionUserId, sessionRole).canEdit
    ) {
      return
    }
    setEditTask(t)
  }, [sessionUserId, sessionRole])
  const onDeleteTask = useCallback((t: TaskWithRelations) => {
    if (
      !getTaskPermissions(t, sessionUserId, sessionRole).canDelete
    ) {
      return
    }
    setDeleteTask(t)
  }, [sessionUserId, sessionRole])

  const taskRowActions = useMemo(
    () => ({
      onView: onViewTask,
      onEdit: onEditTask,
      onDelete: onDeleteTask,
    }),
    [onViewTask, onEditTask, onDeleteTask]
  )

  const handleCreateSubmit = useCallback(
    async (payload: CreateTaskPayload) => {
      await createMut.mutateAsync(payload)
    },
    [createMut]
  )

  const handleEditSubmit = useCallback(
    async (task: TaskWithRelations, raw: TaskEditFormValues) => {
      const values = taskEditFormSchema.parse(raw)
      const due = datetimeLocalValueToIso(values.dueDate)
      const assigneeRaw = values.assigneeId?.trim()
      let assigneeId: string | null | undefined
      if (assigneeRaw) assigneeId = assigneeRaw
      else if (task.assigneeId) assigneeId = null
      else assigneeId = undefined

      const runUpdate = () =>
        updateMut.mutateAsync({
          id: task.id,
          payload: {
            title: values.title,
            description: values.description || null,
            priority: values.priority,
            assigneeId,
            dueDate: due ?? null,
          },
        })

      if (values.status !== task.status) {
        await updateStatusMut.mutateAsync({
          id: task.id,
          payload: { status: values.status },
        })
      }
      await runUpdate()
    },
    [updateMut, updateStatusMut]
  )

  const handleDeleteConfirm = useCallback(
    async (id: string) => {
      await deleteMut.mutateAsync(id)
    },
    [deleteMut]
  )

  const items = data?.items ?? []
  const total = data?.total ?? 0

  const groupedByStatus = useMemo(() => groupTasksByStatus(items), [items])

  const boardCounts = useMemo(
    () => ({
      todo: groupedByStatus.TODO.length,
      inProgress: groupedByStatus.IN_PROGRESS.length,
      done: groupedByStatus.DONE.length,
      loaded: items.length,
    }),
    [groupedByStatus, items.length]
  )

  const tableRangeStart =
    total === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1
  const tableRangeEnd = Math.min(
    (pagination.pageIndex + 1) * pagination.pageSize,
    total
  )

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Tasks
          </h1>
          <p className="text-muted-foreground max-w-xl text-sm leading-relaxed">
            Plan work on the board or review everything in the table. Filters
            apply to both views; drag cards to change status.
          </p>
        </div>
        <div className="flex flex-shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="bg-muted/80 flex rounded-lg p-0.5 ring-1 ring-border/60">
            <Button
              type="button"
              size="sm"
              variant={view === "kanban" ? "default" : "ghost"}
              className="rounded-md px-4 shadow-none"
              onClick={() => setView("kanban")}
            >
              Board
            </Button>
            <Button
              type="button"
              size="sm"
              variant={view === "table" ? "default" : "ghost"}
              className="rounded-md px-4 shadow-none"
              onClick={() => setView("table")}
            >
              Table
            </Button>
          </div>
          <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
            New task
          </Button>
        </div>
      </div>

      <Card
        size="sm"
        className="gap-0 overflow-visible py-0 shadow-sm ring-1 ring-border/60"
      >
        <CardHeader className="border-border gap-1 border-b py-4">
          <CardTitle className="text-base">Workspace</CardTitle>
          <CardDescription>
            Filters and the active list share the same query so counts stay in
            sync with what you see.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 overflow-visible py-4">
          {view === "kanban" && !isError ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { label: "Loaded", value: boardCounts.loaded },
                { label: "To do", value: boardCounts.todo },
                { label: "In progress", value: boardCounts.inProgress },
                { label: "Done", value: boardCounts.done },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-muted/40 border-border/80 rounded-lg border px-3 py-2"
                >
                  <p className="text-muted-foreground text-xs font-medium">
                    {s.label}
                  </p>
                  <p className="text-lg font-semibold tabular-nums">{s.value}</p>
                </div>
              ))}
            </div>
          ) : view === "table" && !isError ? (
            <p className="text-muted-foreground text-xs">
              {total === 0
                ? "No tasks match these filters."
                : `Showing ${tableRangeStart}–${tableRangeEnd} of ${total} tasks (server pagination).`}
            </p>
          ) : null}

          {!isError ? <Separator /> : null}

          <TasksFilterToolbar
            status={filters.status}
            priority={filters.priority}
            assigneeId={filters.assigneeId}
            creatorId={filters.creatorId}
            onStatusChange={(v) => dispatch(setStatusFilter(v))}
            onPriorityChange={(v) => dispatch(setPriorityFilter(v))}
            onAssigneeChange={(v) => dispatch(setAssigneeFilter(v))}
            onCreatorChange={(v) => dispatch(setCreatorFilter(v))}
            onReset={() => dispatch(resetTaskFilters())}
          />

          <Separator />

          {isError ? (
            <ErrorState
              message={error instanceof Error ? error.message : "Request failed"}
              onRetry={() => void refetch()}
            />
          ) : view === "kanban" ? (
            <TasksKanbanClient
              grouped={groupedByStatus}
              isLoading={isPending && !data}
              sessionUserId={sessionUserId}
              sessionRole={sessionRole}
              onView={onViewTask}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              moveFailureCount={moveStatus.failureCount}
              pendingMoveTaskIds={moveStatus.pendingTaskIds}
              onMoveStatus={(args) => moveStatus.mutate(args)}
            />
          ) : (
            <TasksTableClient
              items={items}
              totalRows={total}
              isLoading={isPending && !data}
              pagination={pagination}
              onPaginationChange={(updater) => {
                const next =
                  typeof updater === "function" ? updater(pagination) : updater
                setPagination((prev) => {
                  const limitChanged = next.pageSize !== prev.pageSize
                  return {
                    pageIndex: limitChanged ? 0 : next.pageIndex,
                    pageSize: next.pageSize,
                  }
                })
              }}
              taskRowActions={taskRowActions}
              sessionUserId={sessionUserId}
              sessionRole={sessionRole}
            />
          )}
        </CardContent>
      </Card>

      <TasksDialogs
        viewTask={viewTask}
        resolvedViewTask={resolvedViewTask}
        onViewDismiss={() => setViewTask(null)}
        editTask={editTask}
        onEditDismiss={() => setEditTask(null)}
        deleteTask={deleteTask}
        onDeleteDismiss={() => setDeleteTask(null)}
        createOpen={createOpen}
        onCreateOpenChange={setCreateOpen}
        onCreateSubmit={handleCreateSubmit}
        createPending={createMut.isPending}
        onEditSubmit={handleEditSubmit}
        editPending={updateMut.isPending || updateStatusMut.isPending}
        onDeleteConfirm={handleDeleteConfirm}
        deletePending={deleteMut.isPending}
      />
    </div>
  )
}
