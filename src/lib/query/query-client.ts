import { QueryClient } from "@tanstack/react-query"

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        /** Server data is updated via mutations + cache writes; avoid refetch on every route visit. */
        staleTime: 5 * 60_000,
        gcTime: 15 * 60_000,
        retry: 1,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined

export function getQueryClient() {
  if (typeof window === "undefined") {
    return createQueryClient()
  }
  if (!browserQueryClient) {
    browserQueryClient = createQueryClient()
  }
  return browserQueryClient
}
