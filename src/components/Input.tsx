import * as React from "react"

import { Input as ShadcnInput } from "@/components/ui/input"
import { ValidationHint } from "@/components/ValidationHint"
import { cn } from "@/lib/utils"

export type InputProps = Omit<React.ComponentProps<typeof ShadcnInput>, "id"> & {
  label?: string
  helperText?: string
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  id?: string
  containerClassName?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input(
    {
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
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
    const inputId = idProp ?? generatedId
    const helperId = `${inputId}-helper`
    const errorId = `${inputId}-error`

    const describedBy = [
      ariaDescribedByProp,
      helperText ? helperId : undefined,
      error ? errorId : undefined,
    ]
      .filter(Boolean)
      .join(" ")

    return (
      <div className={cn("flex w-full flex-col gap-0", containerClassName)}>
        {/* Exactly 4px between label and control; hint is outside this group */}
        <div className="flex flex-col gap-1.5">
          {label ? (
            <label
              htmlFor={inputId}
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
            {leftIcon ? (
              <span
                className="pointer-events-none absolute top-1/2 left-3.5 z-10 inline-flex -translate-y-1/2 text-muted-foreground [&_svg]:size-[1.125rem]"
                aria-hidden
              >
                {leftIcon}
              </span>
            ) : null}

            <ShadcnInput
              ref={ref}
              id={inputId}
              disabled={disabled}
              required={required}
              aria-invalid={error ? true : undefined}
              aria-describedby={describedBy || undefined}
              className={cn(
                leftIcon && "pl-11",
                rightIcon && "pr-11",
                className
              )}
              {...props}
            />

            {rightIcon ? (
              <span className="absolute top-1/2 right-3.5 z-10 inline-flex -translate-y-1/2 text-muted-foreground [&_svg]:size-[1.125rem]">
                {rightIcon}
              </span>
            ) : null}

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

Input.displayName = "Input"
