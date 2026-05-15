"use client"

import { useEffect, startTransition, useState } from "react"
import { useForm, useFormState } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import {
  AppDialog,
  dialogFormFieldsClass,
} from "@/components/shared/app-dialog"
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
import { useCreateTask } from "@/hooks/tasks/useCreateTask"
import { useDeleteTask } from "@/hooks/tasks/useDeleteTask"
import { useUpdateTaskEdit } from "@/hooks/tasks/useUpdateTaskEdit"
import { useAssignableUsers } from "@/hooks/users/useAssignableUsers"
import {
  datetimeLocalValueToIso,
  isoToDatetimeLocalValue,
} from "@/lib/helpers/datetime-local"
import { runOptimisticMutation } from "@/lib/helpers/run-optimistic-mutation"
import {
  taskCreateFormSchema,
  taskEditFormSchema,
  type TaskCreateFormValues,
  type TaskEditFormValues,
} from "@/schemas/task-form.schema"
import type { TaskWithRelations } from "@/schemas/task-api.schema"
import type { CreateTaskPayload } from "@/services/tasks/createTask"

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

function TaskCreateForm({
  onDone,
  onFooterStateChange,
}: {
  onDone: () => void
  onFooterStateChange?: (state: { valid: boolean }) => void
}) {
  const create = useCreateTask()
  const [assigneeSearch, setAssigneeSearch] = useState("")
  const {
    options: assigneeOptions,
    isPending: assigneeLoading,
    isFetching: assigneeFetching,
    isError: assigneeError,
    error: assigneeErr,
    refetch: refetchAssignees,
  } = useAssignableUsers(assigneeSearch, true)

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
    onFooterStateChange?.({ valid: isValid })
  }, [isValid, onFooterStateChange])

  const assigneeFetchError = assigneeError
    ? assigneeErr instanceof Error
      ? assigneeErr.message
      : "Could not load users."
    : null

  const onSubmit = form.handleSubmit((raw) => {
    const values = taskCreateFormSchema.parse(raw)
    const due = datetimeLocalValueToIso(values.dueDate)
    const payload: CreateTaskPayload = {
      title: values.title,
      description: values.description || undefined,
      status: values.status,
      priority: values.priority,
      assigneeId: values.assigneeId,
      dueDate: due,
    }
    runOptimisticMutation(create.mutate, payload, onDone)
  })

  return (
    <form
      id="task-create-form"
      className={dialogFormFieldsClass}
      onSubmit={onSubmit}
    >
      <Input
        label="Title"
        required
        error={form.formState.errors.title?.message}
        {...form.register("title")}
      />
      <Textarea
        label="Description"
        rows={3}
        error={form.formState.errors.description?.message}
        {...form.register("description")}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Status</span>
          <Select
            value={form.watch("status")}
            onValueChange={(v) =>
              form.setValue("status", v as TaskCreateFormValues["status"], {
                shouldValidate: true,
              })
            }
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
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Priority</span>
          <Select
            value={form.watch("priority")}
            onValueChange={(v) =>
              form.setValue("priority", v as TaskCreateFormValues["priority"], {
                shouldValidate: true,
              })
            }
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
          form.setValue("assigneeId", id, { shouldValidate: true })
        }
        options={assigneeOptions}
        isLoading={assigneeLoading}
        isFetching={assigneeFetching}
        search={assigneeSearch}
        onSearchChange={setAssigneeSearch}
        error={form.formState.errors.assigneeId?.message}
        fetchError={assigneeFetchError}
        onRetry={() => void refetchAssignees()}
      />
      <Input
        label="Due date (optional)"
        type="datetime-local"
        error={form.formState.errors.dueDate?.message}
        {...form.register("dueDate")}
      />
    </form>
  )
}

function TaskEditForm({
  task,
  onDone,
  onFooterStateChange,
}: {
  task: TaskWithRelations
  onDone: () => void
  onFooterStateChange?: (state: { valid: boolean }) => void
}) {
  const updateEdit = useUpdateTaskEdit()
  const [assigneeSearch, setAssigneeSearch] = useState("")
  const {
    options: assigneeOptions,
    isPending: assigneeLoading,
    isFetching: assigneeFetching,
    isError: assigneeError,
    error: assigneeErr,
    refetch: refetchAssignees,
  } = useAssignableUsers(assigneeSearch, true)

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

  useEffect(() => {
    onFooterStateChange?.({ valid: isValid })
  }, [isValid, onFooterStateChange])

  const assigneeFetchError = assigneeError
    ? assigneeErr instanceof Error
      ? assigneeErr.message
      : "Could not load users."
    : null

  const assigneeSelectedDisplay = task.assignee
    ? {
        id: task.assignee.id,
        name: task.assignee.name,
        email: task.assignee.email,
      }
    : null

  const onSubmit = form.handleSubmit((raw) => {
    const values = taskEditFormSchema.parse(raw)
    const due = datetimeLocalValueToIso(values.dueDate)
    const assigneeRaw = values.assigneeId?.trim()
    let assigneeId: string | null | undefined
    if (assigneeRaw) assigneeId = assigneeRaw
    else if (task.assigneeId) assigneeId = null
    else assigneeId = undefined

    const payload = {
      title: values.title,
      description: values.description || null,
      priority: values.priority,
      assigneeId,
      dueDate: due ?? null,
    }

    runOptimisticMutation(
      updateEdit.mutate,
      {
        id: task.id,
        previousStatus: task.status,
        nextStatus: values.status,
        payload,
      },
      onDone
    )
  })

  return (
    <form
      id="task-edit-form"
      className={dialogFormFieldsClass}
      onSubmit={onSubmit}
    >
      <Input
        label="Title"
        required
        error={form.formState.errors.title?.message}
        {...form.register("title")}
      />
      <Textarea
        label="Description"
        rows={3}
        error={form.formState.errors.description?.message}
        {...form.register("description")}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Status</span>
          <Select
            value={form.watch("status")}
            onValueChange={(v) =>
              form.setValue("status", v as TaskEditFormValues["status"], {
                shouldValidate: true,
              })
            }
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
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Priority</span>
          <Select
            value={form.watch("priority")}
            onValueChange={(v) =>
              form.setValue("priority", v as TaskEditFormValues["priority"], {
                shouldValidate: true,
              })
            }
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
        label="Assignee (optional, clear to unassign)"
        value={form.watch("assigneeId") ?? ""}
        onChange={(id) =>
          form.setValue("assigneeId", id, { shouldValidate: true })
        }
        options={assigneeOptions}
        selectedDisplay={assigneeSelectedDisplay}
        isLoading={assigneeLoading}
        isFetching={assigneeFetching}
        search={assigneeSearch}
        onSearchChange={setAssigneeSearch}
        error={form.formState.errors.assigneeId?.message}
        fetchError={assigneeFetchError}
        onRetry={() => void refetchAssignees()}
      />
      <Input
        label="Due date (optional)"
        type="datetime-local"
        error={form.formState.errors.dueDate?.message}
        {...form.register("dueDate")}
      />
    </form>
  )
}

export function TasksDialogs({
  viewTask,
  resolvedViewTask,
  onViewDismiss,
  editTask,
  onEditDismiss,
  deleteTask,
  onDeleteDismiss,
  createOpen,
  onCreateOpenChange,
}: TasksDialogsProps) {
  const del = useDeleteTask()
  const [taskCreateFooter, setTaskCreateFooter] = useState({ valid: false })
  const [taskEditFooter, setTaskEditFooter] = useState({ valid: false })

  useEffect(() => {
    if (!createOpen) {
      startTransition(() => {
        setTaskCreateFooter({ valid: false })
      })
    }
  }, [createOpen])

  useEffect(() => {
    if (!editTask) {
      startTransition(() => {
        setTaskEditFooter({ valid: false })
      })
    }
  }, [editTask])

  return (
    <>
      <AppDialog
        open={createOpen}
        onOpenChange={(o) => !o && onCreateOpenChange(false)}
        title="New task"
        description="Create a task via POST /tasks."
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
              disabled={!taskCreateFooter.valid}
            >
              Create task
            </Button>
          </>
        }
      >
        {createOpen ? (
          <TaskCreateForm
            onDone={() => onCreateOpenChange(false)}
            onFooterStateChange={setTaskCreateFooter}
          />
        ) : null}
      </AppDialog>

      <AppDialog
        open={Boolean(viewTask)}
        onOpenChange={(o) => !o && onViewDismiss()}
        title="Task details"
        description="Read-only view (refreshed when opened)."
      >
        {resolvedViewTask ? <TaskViewBody task={resolvedViewTask} /> : null}
      </AppDialog>

      <AppDialog
        open={Boolean(editTask)}
        onOpenChange={(o) => !o && onEditDismiss()}
        title="Edit task"
        description="Update fields via PATCH /tasks/:id; status changes use PATCH /tasks/:id/status."
        contentClassName="sm:max-w-lg"
        footer={
          <>
            <Button type="button" variant="outline" onClick={onEditDismiss}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="task-edit-form"
              disabled={!taskEditFooter.valid}
            >
              Save changes
            </Button>
          </>
        }
      >
        {editTask ? (
          <TaskEditForm
            task={editTask}
            onDone={onEditDismiss}
            onFooterStateChange={setTaskEditFooter}
          />
        ) : null}
      </AppDialog>

      <ConfirmDialog
        open={Boolean(deleteTask)}
        onOpenChange={(o) => !o && onDeleteDismiss()}
        title="Delete task?"
        description={
          deleteTask
            ? `DELETE /tasks/${deleteTask.id} for “${deleteTask.title}”. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        confirmVariant="destructive"
        onConfirm={() => {
          if (!deleteTask) return
          runOptimisticMutation(del.mutate, deleteTask.id, onDeleteDismiss)
        }}
      />
    </>
  )
}
