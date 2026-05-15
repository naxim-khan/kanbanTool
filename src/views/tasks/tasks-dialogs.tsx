"use client"

import { useEffect, startTransition, useState } from "react"
import { useForm, useFormState } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { AppDialog } from "@/components/shared/app-dialog"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { UserSelect } from "@/components/shared/inputs/UserSelect"
import { Input } from "@/components/Input"
import { Textarea } from "@/components/Textarea"
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
import {
  datetimeLocalValueToIso,
  isoToDatetimeLocalValue,
} from "@/lib/helpers/datetime-local"
import {
  taskCreateFormSchema,
  taskEditFormSchema,
  type TaskCreateFormValues,
  type TaskEditFormValues,
} from "@/schemas/task-form.schema"
import type { TaskWithRelations } from "@/schemas/task-api.schema"
import type { CreateTaskPayload } from "@/services/tasks/createTask"
import { useAssignableUsers } from "@/hooks/users/useAssignableUsers"

export type TasksDialogsProps = {
  viewTask: TaskWithRelations | null
  /** Merged server row + optional GET /tasks/:id refresh (from parent). */
  resolvedViewTask: TaskWithRelations | null
  onViewDismiss: () => void
  editTask: TaskWithRelations | null
  onEditDismiss: () => void
  deleteTask: TaskWithRelations | null
  onDeleteDismiss: () => void
  createOpen: boolean
  onCreateOpenChange: (open: boolean) => void
  onCreateSubmit: (payload: CreateTaskPayload) => Promise<void>
  createPending: boolean
  onEditSubmit: (
    task: TaskWithRelations,
    values: TaskEditFormValues
  ) => Promise<void>
  editPending: boolean
  onDeleteConfirm: (id: string) => Promise<void>
  deletePending: boolean
}

function TaskViewBody({ task }: { task: TaskWithRelations }) {
  return (
    <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
      <div>
        <dt className="text-muted-foreground">Title</dt>
        <dd className="font-medium">{task.title}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Status</dt>
        <dd className="font-medium">{TASK_STATUS_LABELS[task.status]}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Priority</dt>
        <dd className="font-medium">{TASK_PRIORITY_LABELS[task.priority]}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Assignee</dt>
        <dd className="font-medium">{task.assignee?.name ?? "—"}</dd>
      </div>
      <div className="sm:col-span-2">
        <dt className="text-muted-foreground">Description</dt>
        <dd className="text-foreground/90 mt-1 whitespace-pre-wrap">
          {task.description?.trim() ? task.description : "—"}
        </dd>
      </div>
      <div className="sm:col-span-2">
        <dt className="text-muted-foreground">Due</dt>
        <dd className="font-medium tabular-nums">
          {task.dueDate
            ? new Date(task.dueDate).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })
            : "—"}
        </dd>
      </div>
    </dl>
  )
}

function TaskCreateFormFields({
  isPending,
  assigneeUsersEnabled,
  onSubmit,
  onValidityChange,
}: {
  isPending: boolean
  assigneeUsersEnabled: boolean
  onSubmit: (payload: CreateTaskPayload) => Promise<void>
  onValidityChange?: (valid: boolean) => void
}) {
  const [assigneeSearch, setAssigneeSearch] = useState("")
  const {
    options: assigneeOptions,
    isPending: assigneeListPending,
    isFetching: assigneeListFetching,
    isError: assigneeListError,
    error: assigneeListErr,
    refetch: refetchAssignees,
  } = useAssignableUsers(assigneeSearch, assigneeUsersEnabled)

  useEffect(() => {
    if (!assigneeUsersEnabled) setAssigneeSearch("")
  }, [assigneeUsersEnabled])

  const form = useForm<TaskCreateFormValues>({
    resolver: zodResolver(taskCreateFormSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "TODO",
      priority: "MEDIUM",
      assigneeId: "",
      dueDate: "",
    },
    mode: "onChange",
    reValidateMode: "onChange",
  })

  const { isValid } = useFormState({ control: form.control })

  useEffect(() => {
    onValidityChange?.(isValid)
  }, [isValid, onValidityChange])

  const handle = form.handleSubmit(async (raw) => {
    const values = taskCreateFormSchema.parse(raw)
    const due = datetimeLocalValueToIso(values.dueDate)
    await onSubmit({
      title: values.title,
      description: values.description || undefined,
      status: values.status,
      priority: values.priority,
      assigneeId: values.assigneeId,
      dueDate: due,
    })
  })

  return (
    <form id="task-create-form" className="space-y-4" onSubmit={handle}>
      <Input
        label="Title"
        required
        disabled={isPending}
        error={form.formState.errors.title?.message}
        {...form.register("title")}
      />
      <Textarea
        label="Description"
        rows={3}
        disabled={isPending}
        error={form.formState.errors.description?.message}
        {...form.register("description")}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <span className="text-sm font-medium">Status</span>
          <Select
            value={form.watch("status")}
            onValueChange={(v) =>
              form.setValue("status", v as TaskCreateFormValues["status"], {
                shouldValidate: true,
              })
            }
            disabled={isPending}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TASK_STATUS_VALUES.map((s) => (
                <SelectItem key={s} value={s}>
                  {TASK_STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <span className="text-sm font-medium">Priority</span>
          <Select
            value={form.watch("priority")}
            onValueChange={(v) =>
              form.setValue("priority", v as TaskCreateFormValues["priority"], {
                shouldValidate: true,
              })
            }
            disabled={isPending}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TASK_PRIORITY_VALUES.map((p) => (
                <SelectItem key={p} value={p}>
                  {TASK_PRIORITY_LABELS[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <UserSelect
        label="Assignee (optional)"
        value={form.watch("assigneeId") ?? ""}
        onChange={(id) =>
          form.setValue("assigneeId", id, { shouldValidate: true, shouldDirty: true })
        }
        options={assigneeOptions}
        isLoading={assigneeListPending}
        isFetching={assigneeListFetching}
        search={assigneeSearch}
        onSearchChange={setAssigneeSearch}
        disabled={isPending}
        error={form.formState.errors.assigneeId?.message}
        allowClear
        fetchError={
          assigneeListError
            ? assigneeListErr instanceof Error
              ? assigneeListErr.message
              : "Could not load users."
            : null
        }
        onRetry={() => void refetchAssignees()}
      />
      <Input
        label="Due date (optional)"
        type="datetime-local"
        disabled={isPending}
        error={form.formState.errors.dueDate?.message}
        {...form.register("dueDate")}
      />
    </form>
  )
}

function TaskEditFormFields({
  task,
  isPending,
  assigneeUsersEnabled,
  onSubmit,
  onValidityChange,
}: {
  task: TaskWithRelations
  isPending: boolean
  assigneeUsersEnabled: boolean
  onSubmit: (task: TaskWithRelations, values: TaskEditFormValues) => Promise<void>
  onValidityChange?: (valid: boolean) => void
}) {
  const [assigneeSearch, setAssigneeSearch] = useState("")
  const {
    options: assigneeOptions,
    isPending: assigneeListPending,
    isFetching: assigneeListFetching,
    isError: assigneeListError,
    error: assigneeListErr,
    refetch: refetchAssignees,
  } = useAssignableUsers(assigneeSearch, assigneeUsersEnabled)

  useEffect(() => {
    if (!assigneeUsersEnabled) setAssigneeSearch("")
  }, [assigneeUsersEnabled])

  const form = useForm<TaskEditFormValues>({
    resolver: zodResolver(taskEditFormSchema),
    defaultValues: {
      title: task.title,
      description: task.description ?? "",
      status: task.status,
      priority: task.priority,
      assigneeId: task.assigneeId ?? "",
      dueDate: isoToDatetimeLocalValue(task.dueDate),
    },
    mode: "onChange",
    reValidateMode: "onChange",
  })

  const { isValid } = useFormState({ control: form.control })

  useEffect(() => {
    onValidityChange?.(isValid)
  }, [isValid, onValidityChange])

  useEffect(() => {
    form.reset({
      title: task.title,
      description: task.description ?? "",
      status: task.status,
      priority: task.priority,
      assigneeId: task.assigneeId ?? "",
      dueDate: isoToDatetimeLocalValue(task.dueDate),
    })
    void form.trigger()
  }, [task, form])

  const handle = form.handleSubmit(async (raw) => {
    await onSubmit(task, raw)
  })

  return (
    <form id="task-edit-form" className="space-y-4" onSubmit={handle}>
      <Input
        label="Title"
        required
        disabled={isPending}
        error={form.formState.errors.title?.message}
        {...form.register("title")}
      />
      <Textarea
        label="Description"
        rows={3}
        disabled={isPending}
        error={form.formState.errors.description?.message}
        {...form.register("description")}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <span className="text-sm font-medium">Status</span>
          <Select
            value={form.watch("status")}
            onValueChange={(v) =>
              form.setValue("status", v as TaskEditFormValues["status"], {
                shouldValidate: true,
              })
            }
            disabled={isPending}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TASK_STATUS_VALUES.map((s) => (
                <SelectItem key={s} value={s}>
                  {TASK_STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <span className="text-sm font-medium">Priority</span>
          <Select
            value={form.watch("priority")}
            onValueChange={(v) =>
              form.setValue("priority", v as TaskEditFormValues["priority"], {
                shouldValidate: true,
              })
            }
            disabled={isPending}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TASK_PRIORITY_VALUES.map((p) => (
                <SelectItem key={p} value={p}>
                  {TASK_PRIORITY_LABELS[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <UserSelect
        label="Assignee (optional)"
        value={form.watch("assigneeId") ?? ""}
        onChange={(id) =>
          form.setValue("assigneeId", id, { shouldValidate: true, shouldDirty: true })
        }
        options={assigneeOptions}
        selectedDisplay={
          task.assignee
            ? {
                id: task.assignee.id,
                name: task.assignee.name,
                email: task.assignee.email,
              }
            : null
        }
        isLoading={assigneeListPending}
        isFetching={assigneeListFetching}
        search={assigneeSearch}
        onSearchChange={setAssigneeSearch}
        disabled={isPending}
        error={form.formState.errors.assigneeId?.message}
        allowClear
        emptyMessage="No users found — clear search or try another name or email."
        fetchError={
          assigneeListError
            ? assigneeListErr instanceof Error
              ? assigneeListErr.message
              : "Could not load users."
            : null
        }
        onRetry={() => void refetchAssignees()}
      />
      <Input
        label="Due date (optional)"
        type="datetime-local"
        disabled={isPending}
        error={form.formState.errors.dueDate?.message}
        {...form.register("dueDate")}
      />
    </form>
  )
}

export function TasksDialogs(props: TasksDialogsProps) {
  const {
    viewTask,
    resolvedViewTask,
    onViewDismiss,
    editTask,
    onEditDismiss,
    deleteTask,
    onDeleteDismiss,
    createOpen,
    onCreateOpenChange,
    onCreateSubmit,
    createPending,
    onEditSubmit,
    editPending,
    onDeleteConfirm,
    deletePending,
  } = props

  const [createFormValid, setCreateFormValid] = useState(false)
  const [editFormValid, setEditFormValid] = useState(false)

  useEffect(() => {
    if (!createOpen) {
      startTransition(() => {
        setCreateFormValid(false)
      })
    }
  }, [createOpen])

  useEffect(() => {
    if (!editTask) {
      startTransition(() => {
        setEditFormValid(false)
      })
    }
  }, [editTask])

  return (
    <>
      <AppDialog
        open={Boolean(viewTask)}
        onOpenChange={(o) => !o && onViewDismiss()}
        title="Task details"
        description="Read-only view."
      >
        {resolvedViewTask ? <TaskViewBody task={resolvedViewTask} /> : null}
      </AppDialog>

      <AppDialog
        open={createOpen}
        onOpenChange={onCreateOpenChange}
        title="New task"
        description="POST /api/tasks"
        contentClassName="sm:max-w-lg"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => onCreateOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="task-create-form"
              disabled={createPending || !createFormValid}
            >
              {createPending ? "Creating…" : "Create"}
            </Button>
          </>
        }
      >
        <TaskCreateFormFields
          isPending={createPending}
          assigneeUsersEnabled={createOpen}
          onValidityChange={setCreateFormValid}
          onSubmit={async (payload) => {
            await onCreateSubmit(payload)
            onCreateOpenChange(false)
          }}
        />
      </AppDialog>

      <AppDialog
        open={Boolean(editTask)}
        onOpenChange={(o) => !o && onEditDismiss()}
        title="Edit task"
        description="PATCH /api/tasks/:id and PATCH /api/tasks/:id/status when needed."
        contentClassName="sm:max-w-lg"
        footer={
          <>
            <Button type="button" variant="outline" onClick={onEditDismiss}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="task-edit-form"
              disabled={editPending || !editFormValid}
            >
              {editPending ? "Saving…" : "Save changes"}
            </Button>
          </>
        }
      >
        {editTask ? (
          <TaskEditFormFields
            task={editTask}
            isPending={editPending}
            assigneeUsersEnabled={Boolean(editTask)}
            onValidityChange={setEditFormValid}
            onSubmit={async (task, raw) => {
              await onEditSubmit(task, raw)
              onEditDismiss()
            }}
          />
        ) : null}
      </AppDialog>

      <ConfirmDialog
        open={Boolean(deleteTask)}
        onOpenChange={(o) => !o && onDeleteDismiss()}
        title="Delete task?"
        description={
          deleteTask
            ? `DELETE /api/tasks/${deleteTask.id} — “${deleteTask.title}”.`
            : ""
        }
        confirmLabel="Delete"
        confirmVariant="destructive"
        isConfirming={deletePending}
        onConfirm={async () => {
          if (!deleteTask) return
          await onDeleteConfirm(deleteTask.id)
          onDeleteDismiss()
        }}
      />
    </>
  )
}
