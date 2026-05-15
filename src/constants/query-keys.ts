import type { TasksQuery } from "@/schemas/tasks-query.schema"

export const queryKeys = {
  profile: ["profile"] as const,
  tasks: {
    root: ["tasks"] as const,
    /** Prefix for all paginated task lists — prefer this over `root` when invalidating lists only. */
    listPrefix: ["tasks", "list"] as const,
    /** List + filters — must match `TasksQuery` shape for cache updates. */
    list: (query: TasksQuery) => ["tasks", "list", query] as const,
    task: (id: string) => ["task", id] as const,
  },
  users: {
    root: ["users"] as const,
    list: () => ["users", "list"] as const,
    assignableList: () => ["users", "assignable"] as const,
    detail: (id: string) => ["users", "detail", id] as const,
  },
}
