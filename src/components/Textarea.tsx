import * as React from "react"

import { Textarea as ShadcnTextarea } from "@/components/ui/textarea"
import { ValidationHint } from "@/components/ValidationHint"
import { cn } from "@/lib/utils"

export type TextareaProps = Omit<
  React.ComponentProps<typeof ShadcnTextarea>,
  "id"
> & {
  label?: string
  helperText?: string
  error?: string
  id?: string
  containerClassName?: string
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    {
      label,
      helperText,
      error,
      id: idProp,
      className,
      disabled,
      required,
      containerClassName,
      "aria-describedby": ariaDescribedByProp,
      ...props
    },
    ref
  ) {
    const generatedId = React.useId()
    const fieldId = idProp ?? generatedId
    const helperId = `${fieldId}-helper`
    const errorId = `${fieldId}-error`

    const describedBy = [
      ariaDescribedByProp,
      helperText ? helperId : undefined,
      error ? errorId : undefined,
    ]
      .filter(Boolean)
      .join(" ")

    return (
      <div className={cn("flex w-full flex-col gap-0", containerClassName)}>
        <div className="flex flex-col gap-1.5">
          {label ? (
            <label
              htmlFor={fieldId}
              className="text-foreground block text-[0.9375rem] font-medium leading-snug"
            >
              {label}
              {required ? (
                <span className="text-destructive" aria-hidden>
                  {" "}
                  *
                </span>
              ) : null}
            </label>
          ) : null}

          <div className="relative">
            <ShadcnTextarea
              ref={ref}
              id={fieldId}
              disabled={disabled}
              required={required}
              aria-invalid={error ? true : undefined}
              aria-describedby={describedBy || undefined}
              className={className}
              {...props}
            />
            <ValidationHint id={errorId} message={error} />
          </div>
        </div>

        {helperText && !error ? (
          <p
            id={helperId}
            className="text-muted-foreground mt-1 text-[0.9375rem] leading-snug"
          >
            {helperText}
          </p>
        ) : null}
      </div>
    )
  }
)

Textarea.displayName = "Textarea"
