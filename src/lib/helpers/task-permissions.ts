import type { UserRole } from "@/types/auth.types"

export type TaskAuthFields = {
  creatorId: string
  assigneeId: string | null
}

export type TaskPermissions = {
  canEdit: boolean
  canDelete: boolean
  canChangeStatus: boolean
}

/** Mirrors `Backend/src/tasks/tasks.service.ts` authorization checks. */
export function getTaskPermissions(
  task: TaskAuthFields,
  userId: string | undefined,
  role: UserRole | undefined
): TaskPermissions {
  if (!userId || !role) {
    return { canEdit: false, canDelete: false, canChangeStatus: false }
  }
  if (role === "ADMIN") {
    return { canEdit: true, canDelete: true, canChangeStatus: true }
  }
  const isCreator = task.creatorId === userId
  const isAssignee = task.assigneeId === userId
  return {
    canEdit: isCreator,
    canDelete: isCreator,
    canChangeStatus: isCreator || isAssignee,
  }
}
