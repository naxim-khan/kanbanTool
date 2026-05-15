"use client"

import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

import { cn } from "@/lib/utils"

const iconClass =
  "size-[1.125rem] shrink-0 opacity-[0.92] drop-shadow-[0_1px_2px_oklch(0_0_0/0.12)] dark:drop-shadow-[0_1px_3px_oklch(0_0_0/0.45)]"

const defaultToastClassNames = {
  toast: "cn-toast",
  content: "sonner-toast-content",
  title: "sonner-toast-title",
  description: "sonner-toast-description",
  icon: "sonner-toast-icon",
  closeButton: "sonner-toast-close",
} as const

const glassStyle = {
  "--width": "min(calc(100vw - 2rem), 400px)",
  "--border-radius": "16px",
  "--normal-bg": "color-mix(in oklch, var(--card) 58%, transparent)",
  "--normal-text": "var(--foreground)",
  "--normal-border": "color-mix(in oklch, var(--foreground) 11%, transparent)",
} as const

function Toaster({ toastOptions, className, style, ...props }: ToasterProps) {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className={cn("toaster group sonner-premium", className)}
      icons={{
        success: <CircleCheckIcon className={iconClass} />,
        info: <InfoIcon className={iconClass} />,
        warning: <TriangleAlertIcon className={iconClass} />,
        error: <OctagonXIcon className={iconClass} />,
        loading: <Loader2Icon className={`${iconClass} animate-spin`} />,
      }}
      style={{ ...glassStyle, ...style } as React.CSSProperties}
      toastOptions={{
        ...toastOptions,
        classNames: {
          ...defaultToastClassNames,
          ...toastOptions?.classNames,
          toast: cn(defaultToastClassNames.toast, toastOptions?.classNames?.toast),
          content: cn(
            defaultToastClassNames.content,
            toastOptions?.classNames?.content
          ),
          title: cn(defaultToastClassNames.title, toastOptions?.classNames?.title),
          description: cn(
            defaultToastClassNames.description,
            toastOptions?.classNames?.description
          ),
          icon: cn(defaultToastClassNames.icon, toastOptions?.classNames?.icon),
          closeButton: cn(
            defaultToastClassNames.closeButton,
            toastOptions?.classNames?.closeButton
          ),
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
