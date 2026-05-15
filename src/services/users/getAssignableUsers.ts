import { api } from "@/lib/axios/axios"
import { unwrapSuccessData } from "@/lib/axios/unwrap-success"
import {
  assignableUsersListSchema,
  type AssignableUserRow,
} from "@/schemas/user-api.schema"

export async function getAssignableUsers(): Promise<AssignableUserRow[]> {
  const { data } = await api.get<unknown>("/assignable-users")
  const raw = unwrapSuccessData<unknown>(data)
  return assignableUsersListSchema.parse(raw)
}
