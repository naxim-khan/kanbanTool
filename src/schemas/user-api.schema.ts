import { z } from "zod"

export const adminUserRowSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string(),
  role: z.enum(["USER", "ADMIN"]),
  createdAt: z.string(),
  updatedAt: z.string(),
  failedLoginAttempts: z.number().optional(),
  lockUntil: z.string().nullable().optional(),
})

export const adminUsersListSchema = z.array(adminUserRowSchema)

export type AdminUserRow = z.infer<typeof adminUserRowSchema>

/** GET /assignable-users — task assignee/creator pickers. */
export const assignableUserRowSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string(),
})

export const assignableUsersListSchema = z.array(assignableUserRowSchema)

export type AssignableUserRow = z.infer<typeof assignableUserRowSchema>
