"use client"

import { useEffect, startTransition, useState } from "react"
import { useForm, useFormState } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { AppDialog } from "@/components/shared/app-dialog"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { Input } from "@/components/Input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCreateUser } from "@/hooks/users/useCreateUser"
import { useDeleteUser } from "@/hooks/users/useDeleteUser"
import { useUpdateUser } from "@/hooks/users/useUpdateUser"
import { useUser } from "@/hooks/users/useUser"
import {
  adminUserCreateFormSchema,
  adminUserEditFormSchema,
  type AdminUserCreateFormValues,
  type AdminUserEditFormValues,
} from "@/schemas/user-form.schema"
import { runOptimisticMutation } from "@/lib/helpers/run-optimistic-mutation"
import type { AdminUserRow } from "@/schemas/user-api.schema"

type UserTableDialogsProps = {
  viewUser: AdminUserRow | null
  onViewDismiss: () => void
  createOpen: boolean
  onCreateDismiss: () => void
  editUser: AdminUserRow | null
  onEditDismiss: () => void
  deleteUser: AdminUserRow | null
  onDeleteDismiss: () => void
}

function UserViewBody({ user }: { user: AdminUserRow }) {
  const detail = useUser(user.id, true)
  const u = detail.data ?? user

  return (
    <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
      <div>
        <dt className="text-muted-foreground">Name</dt>
        <dd className="font-medium">{u.name}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Email</dt>
        <dd className="break-all font-medium">{u.email}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Role</dt>
        <dd className="font-medium">{u.role}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">User ID</dt>
        <dd className="text-muted-foreground font-mono text-xs">{u.id}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Created</dt>
        <dd className="tabular-nums">
          {new Date(u.createdAt).toLocaleString()}
        </dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Updated</dt>
        <dd className="tabular-nums">
          {new Date(u.updatedAt).toLocaleString()}
        </dd>
      </div>
    </dl>
  )
}

function UserCreateForm({
  onDone,
  onFooterStateChange,
}: {
  onDone: () => void
  onFooterStateChange?: (state: { valid: boolean }) => void
}) {
  const create = useCreateUser()
  const form = useForm<AdminUserCreateFormValues>({
    resolver: zodResolver(adminUserCreateFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "USER",
    },
    mode: "onChange",
    reValidateMode: "onChange",
  })

  const { isValid } = useFormState({ control: form.control })

  useEffect(() => {
    onFooterStateChange?.({ valid: isValid })
  }, [isValid, onFooterStateChange])

  const onSubmit = form.handleSubmit((values) => {
    runOptimisticMutation(
      create.mutate,
      {
        name: values.name,
        email: values.email,
        password: values.password,
        role: values.role,
      },
      onDone
    )
  })

  return (
    <form id="user-create-form" className="space-y-4" onSubmit={onSubmit}>
      <Input
        label="Name"
        required
        error={form.formState.errors.name?.message}
        {...form.register("name")}
      />
      <Input
        label="Email"
        type="email"
        required
        error={form.formState.errors.email?.message}
        {...form.register("email")}
      />
      <Input
        label="Password"
        type="password"
        required
        autoComplete="new-password"
        error={form.formState.errors.password?.message}
        {...form.register("password")}
      />
      <div className="space-y-1.5">
        <span className="text-sm font-medium">Role</span>
        <p className="text-muted-foreground text-xs">
          Only administrators can assign roles when creating a user.
        </p>
        <Select
          value={form.watch("role")}
          onValueChange={(v) =>
            form.setValue("role", v as AdminUserRow["role"], {
              shouldValidate: true,
            })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="USER">USER</SelectItem>
            <SelectItem value="ADMIN">ADMIN</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </form>
  )
}

function UserEditForm({
  user,
  onDone,
  onFooterStateChange,
}: {
  user: AdminUserRow
  onDone: () => void
  onFooterStateChange?: (state: { valid: boolean }) => void
}) {
  const update = useUpdateUser()
  const form = useForm<AdminUserEditFormValues>({
    resolver: zodResolver(adminUserEditFormSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
      role: user.role,
      password: "",
    },
    mode: "onChange",
    reValidateMode: "onChange",
  })

  const { isValid } = useFormState({ control: form.control })

  useEffect(() => {
    form.reset({
      name: user.name,
      email: user.email,
      role: user.role,
      password: "",
    })
    void form.trigger()
  }, [user, form])

  useEffect(() => {
    onFooterStateChange?.({ valid: isValid })
  }, [isValid, onFooterStateChange])

  const onSubmit = form.handleSubmit((raw) => {
    const values = adminUserEditFormSchema.parse(raw)
    const payload: {
      name: string
      email: string
      role: AdminUserRow["role"]
      password?: string
    } = {
      name: values.name,
      email: values.email,
      role: values.role,
    }
    const pw = values.password?.trim()
    if (pw) payload.password = pw

    runOptimisticMutation(
      update.mutate,
      { id: user.id, payload },
      onDone
    )
  })

  return (
    <form id="user-edit-form" className="space-y-4" onSubmit={onSubmit}>
      <Input
        label="Name"
        required
        error={form.formState.errors.name?.message}
        {...form.register("name")}
      />
      <Input
        label="Email"
        type="email"
        required
        error={form.formState.errors.email?.message}
        {...form.register("email")}
      />
      <div className="space-y-1.5">
        <span className="text-sm font-medium">Role</span>
        <Select
          value={form.watch("role")}
          onValueChange={(v) =>
            form.setValue("role", v as AdminUserRow["role"], {
              shouldValidate: true,
            })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="USER">USER</SelectItem>
            <SelectItem value="ADMIN">ADMIN</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Input
        label="New password (optional)"
        type="password"
        autoComplete="new-password"
        placeholder="Leave blank to keep current password"
        error={form.formState.errors.password?.message}
        {...form.register("password")}
      />
    </form>
  )
}

export function UserTableDialogs({
  viewUser,
  onViewDismiss,
  createOpen,
  onCreateDismiss,
  editUser,
  onEditDismiss,
  deleteUser,
  onDeleteDismiss,
}: UserTableDialogsProps) {
  const del = useDeleteUser()
  const [userCreateFooter, setUserCreateFooter] = useState({ valid: false })
  const [userEditFooter, setUserEditFooter] = useState({ valid: false })

  useEffect(() => {
    if (!createOpen) {
      startTransition(() => {
        setUserCreateFooter({ valid: false })
      })
    }
  }, [createOpen])

  useEffect(() => {
    if (!editUser) {
      startTransition(() => {
        setUserEditFooter({ valid: false })
      })
    }
  }, [editUser])

  return (
    <>
      <AppDialog
        open={createOpen}
        onOpenChange={(o) => !o && onCreateDismiss()}
        title="Add user"
        description="Create a user via POST /users (admin). Role can only be set here by administrators."
        contentClassName="sm:max-w-md"
        footer={
          <>
            <Button type="button" variant="outline" onClick={onCreateDismiss}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="user-create-form"
              disabled={!userCreateFooter.valid}
            >
              Create user
            </Button>
          </>
        }
      >
        {createOpen ? (
          <UserCreateForm
            onDone={onCreateDismiss}
            onFooterStateChange={setUserCreateFooter}
          />
        ) : null}
      </AppDialog>

      <AppDialog
        open={Boolean(viewUser)}
        onOpenChange={(o) => !o && onViewDismiss()}
        title="User details"
        description="From GET /users/:id (refreshed when opened)."
      >
        {viewUser ? <UserViewBody user={viewUser} /> : null}
      </AppDialog>

      <AppDialog
        open={Boolean(editUser)}
        onOpenChange={(o) => !o && onEditDismiss()}
        title="Edit user"
        description="Admin update via PUT /users/:id (AdminUpdateUserDto)."
        contentClassName="sm:max-w-md"
        footer={
          <>
            <Button type="button" variant="outline" onClick={onEditDismiss}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="user-edit-form"
              disabled={!userEditFooter.valid}
            >
              Save changes
            </Button>
          </>
        }
      >
        {editUser ? (
          <UserEditForm
            user={editUser}
            onDone={onEditDismiss}
            onFooterStateChange={setUserEditFooter}
          />
        ) : null}
      </AppDialog>

      <ConfirmDialog
        open={Boolean(deleteUser)}
        onOpenChange={(o) => !o && onDeleteDismiss()}
        title="Delete user?"
        description={
          deleteUser
            ? `DELETE /users/${deleteUser.id} for “${deleteUser.name}”. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        confirmVariant="destructive"
        onConfirm={() => {
          if (!deleteUser) return
          runOptimisticMutation(del.mutate, deleteUser.id, onDeleteDismiss)
        }}
      />
    </>
  )
}
