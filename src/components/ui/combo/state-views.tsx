import type { ReactNode } from "react"

import { cn } from "@/lib/utils"
import { getErrorDisplay } from "@/lib/errors"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty"

import { CircleOffIcon, RefreshCcwIcon, SearchXIcon, type LucideIcon } from "lucide-react"

// ---------------------------------------------------------------------------
// ErrorStateView
// ---------------------------------------------------------------------------

interface ErrorStateViewProps {
  error?: unknown
  title?: string
  message?: string
  onRetry?: () => void
  icon?: LucideIcon
  className?: string
}

export function ErrorStateView({
  error,
  title,
  message,
  onRetry,
  icon: Icon = CircleOffIcon,
  className,
}: ErrorStateViewProps) {
  const t = useTranslations("common.ui")
  const display = error
    ? getErrorDisplay(error)
    : { title: t("errorUnexpectedTitle"), message: t("errorUnexpectedMessage") }
  const resolvedTitle = title ?? display.title
  const resolvedMessage = message ?? display.message

  return (
    <Empty className={cn("border-destructive/20 bg-destructive/5 dark:bg-destructive/10 border py-10", className)}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon className="size-5" />
        </EmptyMedia>
        <EmptyTitle>{resolvedTitle}</EmptyTitle>
        <EmptyDescription>{resolvedMessage}</EmptyDescription>
      </EmptyHeader>
      {onRetry && (
        <EmptyContent>
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCcwIcon className="size-4" />
            {t("tryAgain")}
          </Button>
        </EmptyContent>
      )}
    </Empty>
  )
}

// ---------------------------------------------------------------------------
// EmptyStateView
// ---------------------------------------------------------------------------

interface EmptyStateViewProps {
  title: string
  message?: string | ReactNode
  icon?: LucideIcon
  actions?: ReactNode
  className?: string
}

export function EmptyStateView({ title, message, icon: Icon = SearchXIcon, actions, className }: EmptyStateViewProps) {
  return (
    <Empty className={cn("border-border bg-muted/30 border py-8", className)}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon className="size-5" />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        {message && typeof message === "string" ? <EmptyDescription>{message}</EmptyDescription> : message}
      </EmptyHeader>
      {actions && <EmptyContent>{actions}</EmptyContent>}
    </Empty>
  )
}
