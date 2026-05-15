import { AlertCircle } from "lucide-react"

import { cn } from "@/lib/utils"

export type ValidationHintProps = {
  /** Associates the hint with the control (`aria-describedby`). */
  id?: string
  message?: string | null
  className?: string
}

/**
 * Original hint styling, floated over the gap below the control (like a native
 * `title` tooltip) so showing/hiding never resizes the field or dialog.
 * Parent control wrapper must be `relative`.
 */
export function ValidationHint({
  id,
  message,
  className,
}: ValidationHintProps) {
  const text = message?.trim()
  if (!text) return null

  return (
    <div
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      className={cn(
        "pointer-events-none absolute top-full left-0 z-30 mt-0.5 w-full",
        className
      )}
    >
      <p
        id={id}
        className="text-destructive flex w-full items-center gap-1.5 overflow-hidden rounded-md border border-destructive/30 bg-white/20 px-2 py-0.5 text-xs font-medium leading-snug shadow-lg ring-1 ring-white/50 backdrop-blur-xl backdrop-saturate-150 sm:text-[0.8125rem] dark:border-destructive/40 dark:bg-black/25 dark:ring-white/10"
      >
        <AlertCircle
          className="text-destructive/90 size-3.5 shrink-0 sm:size-4"
          strokeWidth={2}
          aria-hidden
        />
        <span className="line-clamp-1 min-w-0 flex-1" title={text}>
          {text}
        </span>
      </p>
    </div>
  )
}
