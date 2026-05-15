import { z } from "zod"

/** Admin `PUT /users/:id` body (subset of `AdminUpdateUserDto`). */
export const adminUserEditFormSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Valid email required"),
    role: z.enum(["USER", "ADMIN"]),
    password: z.string().optional(),
  })
  .refine(
    (d) => !d.password?.trim() || d.password.trim().length >= 8,
    {
      message: "Password must be at least 8 characters or left blank",
      path: ["password"],
    }
  )

export type AdminUserEditFormValues = z.input<typeof adminUserEditFormSchema>

/** Admin `POST /users` body (`AdminCreateUserDto`). */
export const adminUserCreateFormSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters"),
  email: z.string().email("Valid email required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["USER", "ADMIN"]),
})

export type AdminUserCreateFormValues = z.infer<typeof adminUserCreateFormSchema>

const optionalPasswordRefine = {
  refine: (d: { password?: string }) =>
    !d.password?.trim() || d.password.trim().length >= 8,
  message: "Password must be at least 8 characters or left blank",
  path: ["password"] as const,
}

/** Regular user `PUT /users/:id` on own id (`UpdateUserDto` — name + password only). */
export const profileSelfUpdateFormSchema = z
  .object({
    name: z
      .string()
      .min(1, "Name is required")
      .min(2, "Name must be at least 2 characters"),
    password: z.string().optional(),
  })
  .refine(optionalPasswordRefine.refine, {
    message: optionalPasswordRefine.message,
    path: ["password"],
  })

export type ProfileSelfUpdateFormValues = z.infer<
  typeof profileSelfUpdateFormSchema
>
