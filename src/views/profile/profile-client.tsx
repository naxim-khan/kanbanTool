"use client"

import { useEffect, startTransition, useState } from "react"
import { useForm, useFormState } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Pencil } from "lucide-react"

import { Button } from "@/components/Button"
import { ErrorState } from "@/components/ErrorState"
import { Input } from "@/components/Input"
import { PageLoader } from "@/components/PageLoader"
import { AppDialog } from "@/components/shared/app-dialog"
import { Button as UiButton } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useProfile } from "@/hooks/auth/useProfile"
import { useUpdateMyProfile } from "@/hooks/auth/useUpdateMyProfile"
import { runOptimisticMutation } from "@/lib/helpers/run-optimistic-mutation"
import {
  adminUserEditFormSchema,
  profileSelfUpdateFormSchema,
  type AdminUserEditFormValues,
  type ProfileSelfUpdateFormValues,
} from "@/schemas/user-form.schema"
import { useAppSelector } from "@/store/hooks"
import type { AuthUser } from "@/types/auth.types"

function ProfileDetails({ user }: { user: AuthUser }) {
  return (
    <dl className="border-border bg-card grid grid-cols-1 gap-4 rounded-lg border p-4 text-sm sm:grid-cols-2 sm:p-6">
      <div>
        <dt className="text-muted-foreground">Name</dt>
        <dd className="font-medium">{user.name}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Email</dt>
        <dd className="break-all font-medium">{user.email}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Role</dt>
        <dd className="font-medium">{user.role}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">User ID</dt>
        <dd className="text-muted-foreground font-mono text-xs">{user.id}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Member since</dt>
        <dd className="tabular-nums">
          {new Date(user.createdAt).toLocaleString()}
        </dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Last updated</dt>
        <dd className="tabular-nums">
          {new Date(user.updatedAt).toLocaleString()}
        </dd>
      </div>
    </dl>
  )
}

type ProfileEditFormProps = {
  user: AuthUser
  onDone: () => void
  onFooterStateChange?: (state: { valid: boolean }) => void
}

function ProfileSelfEditForm({
  user,
  onDone,
  onFooterStateChange,
}: ProfileEditFormProps) {
  const sessionUserId = useAppSelector((s) => s.auth.user?.id)
  const update = useUpdateMyProfile()
  const form = useForm<ProfileSelfUpdateFormValues>({
    resolver: zodResolver(profileSelfUpdateFormSchema),
    defaultValues: { name: user.name, password: "" },
    mode: "onChange",
    reValidateMode: "onChange",
  })
  const { isValid } = useFormState({ control: form.control })

  useEffect(() => {
    form.reset({ name: user.name, password: "" })
    void form.trigger()
  }, [user, form])

  useEffect(() => {
    onFooterStateChange?.({ valid: isValid })
  }, [isValid, onFooterStateChange])

  const onSubmit = form.handleSubmit((values) => {
    if (!sessionUserId) return
    const payload: { name: string; password?: string } = { name: values.name }
    const pw = values.password?.trim()
    if (pw) payload.password = pw
    runOptimisticMutation(
      update.mutate,
      { userId: sessionUserId, payload },
      onDone
    )
  })

  return (
    <form id="profile-edit-form" className="space-y-4" onSubmit={onSubmit}>
      <Input
        label="Name"
        required
        error={form.formState.errors.name?.message}
        {...form.register("name")}
      />
      <Input
        label="Email"
        value={user.email}
        disabled
        helperText="Email cannot be changed. Contact an administrator if needed."
      />
      <Input
        label="New password"
        type="password"
        autoComplete="new-password"
        placeholder="Leave blank to keep current password"
        error={form.formState.errors.password?.message}
        {...form.register("password")}
      />
    </form>
  )
}

function ProfileAdminEditForm({
  user,
  onDone,
  onFooterStateChange,
}: ProfileEditFormProps) {
  const sessionUserId = useAppSelector((s) => s.auth.user?.id)
  const update = useUpdateMyProfile()
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
    if (!sessionUserId) return
    const values = adminUserEditFormSchema.parse(raw)
    const payload: {
      name: string
      email: string
      role: AuthUser["role"]
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
      { userId: sessionUserId, payload },
      onDone
    )
  })

  return (
    <form id="profile-edit-form" className="space-y-4" onSubmit={onSubmit}>
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
            form.setValue("role", v as AuthUser["role"], {
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
        label="New password"
        type="password"
        autoComplete="new-password"
        placeholder="Leave blank to keep current password"
        error={form.formState.errors.password?.message}
        {...form.register("password")}
      />
    </form>
  )
}

export function ProfileClient() {
  const sessionUser = useAppSelector((s) => s.auth.user)
  const sessionRole = sessionUser?.role
  const isAdmin = sessionRole === "ADMIN"
  const { data, isPending, isError, error, refetch } = useProfile(true)
  const displayUser = sessionUser ?? data
  const [editOpen, setEditOpen] = useState(false)
  const [editFooter, setEditFooter] = useState({ valid: false })

  useEffect(() => {
    if (!editOpen) {
      startTransition(() => {
        setEditFooter({ valid: false })
      })
    }
  }, [editOpen])

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
          <p className="text-muted-foreground text-sm">
            Your account from{" "}
            <code className="text-xs">GET /api/auth/profile</code>.
          </p>
        </div>
        {displayUser ? (
          <Button
            type="button"
            variant="outline"
            leftIcon={<Pencil className="size-4" aria-hidden />}
            onClick={() => setEditOpen(true)}
          >
            Edit profile
          </Button>
        ) : null}
      </div>

      {isPending ? (
        <PageLoader message="Loading profile…" />
      ) : isError ? (
        <ErrorState
          message={error instanceof Error ? error.message : "Request failed"}
          onRetry={() => void refetch()}
        />
      ) : displayUser ? (
        <ProfileDetails user={displayUser} />
      ) : null}

      {displayUser ? (
        <AppDialog
          open={editOpen}
          onOpenChange={(open) => !open && setEditOpen(false)}
          title="Edit profile"
          description={
            isAdmin
              ? "Update your name, email, role, or password via PUT /users/:id."
              : "Update your name or password. Email and role cannot be changed."
          }
          contentClassName="sm:max-w-md"
          footer={
            <>
              <UiButton
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
              >
                Cancel
              </UiButton>
              <UiButton
                type="submit"
                form="profile-edit-form"
                disabled={!editFooter.valid}
              >
                Save changes
              </UiButton>
            </>
          }
        >
          {editOpen ? (
            isAdmin ? (
              <ProfileAdminEditForm
                user={displayUser}
                onDone={() => setEditOpen(false)}
                onFooterStateChange={setEditFooter}
              />
            ) : (
              <ProfileSelfEditForm
                user={displayUser}
                onDone={() => setEditOpen(false)}
                onFooterStateChange={setEditFooter}
              />
            )
          ) : null}
        </AppDialog>
      ) : null}
    </div>
  )
}
