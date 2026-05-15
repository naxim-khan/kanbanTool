"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export type ConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  confirmVariant?: "default" | "destructive"
  isConfirming?: boolean
  onConfirm: () => void
}

/**
 * Controlled confirm/cancel dialog (delete, discard changes, etc.).
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "default",
  isConfirming = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-sm" showCloseButton={false}>
        <DialogHeader className="border-border space-y-1 border-b px-4 py-3 text-left">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-row justify-end gap-2 border-t bg-muted/50 px-4 py-3">
          <Button
            type="button"
            variant="outline"
            disabled={isConfirming}
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={confirmVariant}
            disabled={isConfirming}
            onClick={onConfirm}
          >
            {isConfirming ? "Please wait…" : confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
