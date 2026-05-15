"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

/** Vertical rhythm for forms inside {@link AppDialog}. */
export const dialogFormFieldsClass = "flex flex-col gap-3"

const dialogBodyClass =
  "max-h-[min(70vh,520px)] overflow-y-auto px-4 py-3 [&_dl]:gap-3 [&_form]:flex [&_form]:flex-col [&_form]:gap-3 [&_form>*+*]:mt-0 [&_form_.grid]:gap-3"

export type AppDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children?: React.ReactNode
  /** Primary actions (Save, etc.). Omit for read-only dialogs. */
  footer?: React.ReactNode
  contentClassName?: string
  showCloseButton?: boolean
}

/**
 * Reusable shadcn `Dialog` shell: header + body + optional footer.
 * Use for view/edit flows; pair with `ConfirmDialog` for destructive confirms.
 */
export function AppDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  contentClassName,
  showCloseButton = true,
}: AppDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "gap-0 p-0 sm:max-w-md",
          footer ? "pb-0" : undefined,
          contentClassName
        )}
        showCloseButton={showCloseButton}
      >
        <DialogHeader className="border-border space-y-1 border-b px-4 py-3 text-left">
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        {children ? (
          <div className={dialogBodyClass}>{children}</div>
        ) : null}
        {footer ? (
          <div className="border-border flex flex-col-reverse gap-2 border-t bg-muted/50 px-4 py-3 sm:flex-row sm:justify-end">
            {footer}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
