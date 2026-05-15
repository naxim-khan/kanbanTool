import { api } from "@/lib/axios/axios"
import { unwrapSuccessData } from "@/lib/axios/unwrap-success"
import {
  adminUserRowSchema,
  type AdminUserRow,
} from "@/schemas/user-api.schema"

export type AdminCreateUserPayload = {
  name: string
  email: string
  password: string
  role?: AdminUserRow["role"]
}

export async function createUser(
  payload: AdminCreateUserPayload
): Promise<AdminUserRow> {
  const { data } = await api.post<unknown>("/users", payload)
  const raw = unwrapSuccessData<unknown>(data)
  return adminUserRowSchema.parse(raw)
}
