import type { UseMutateFunction } from "@tanstack/react-query"

/**
 * TanStack optimistic flow: `onMutate` updates the cache first (keep it synchronous),
 * then close UI immediately — do not wait for `onSuccess` or tie dialogs to `isPending`.
 * Errors roll back in the mutation hook's `onError` and surface via toast.
 */
export function runOptimisticMutation<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown,
>(
  mutate: UseMutateFunction<TData, TError, TVariables, TContext>,
  variables: TVariables,
  onClose: () => void
): void {
  mutate(variables)
  onClose()
}
