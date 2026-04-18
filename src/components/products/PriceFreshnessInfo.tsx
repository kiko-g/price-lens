"use client"

import { useLocale, useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { formatRelativeTime } from "@/lib/business/chart"
import { PRIORITY_REFRESH_HOURS, formatHoursDuration } from "@/lib/business/priority"
import { isLocale, type Locale } from "@/i18n/config"
import { formatDateTime } from "@/lib/i18n/format"

import { ResponsiveTooltip } from "@/components/ui/combo/responsive-tooltip"
import { ClockIcon } from "lucide-react"

interface PriceFreshnessInfoProps {
  updatedAt: string | null
  priority: number | null
  className?: string
}

/**
 * Subtle informational component showing when a price was last verified.
 * Designed for product detail pages - informative without being alarming.
 */
export function PriceFreshnessInfo({ updatedAt, priority, className }: PriceFreshnessInfoProps) {
  const t = useTranslations("products.freshness")
  const localeRaw = useLocale()
  const locale: Locale = isLocale(localeRaw) ? localeRaw : "pt"

  if (!updatedAt) {
    return null
  }

  const updatedDate = new Date(updatedAt)
  const relativeTime = formatRelativeTime(updatedDate, "relative", locale)
  const refreshHours = priority !== null ? PRIORITY_REFRESH_HOURS[priority] : null
  const refreshLabel = refreshHours ? formatHoursDuration(refreshHours) : null

  const hoursSinceUpdate = (Date.now() - updatedDate.getTime()) / (1000 * 60 * 60)
  const isFresh = refreshHours ? hoursSinceUpdate <= refreshHours : hoursSinceUpdate <= 24

  const absoluteDateLabel = formatDateTime(updatedDate, locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <ResponsiveTooltip
      title={t("title")}
      drawerTitleClassName="text-[15px] font-medium text-muted-foreground"
      trigger={
        <button
          type="button"
          className={cn(
            "text-muted-foreground inline-flex cursor-pointer items-center gap-0.5 text-xs md:cursor-help",
            !isFresh && "opacity-100",
            className,
          )}
          aria-label={t("ariaLabel", { time: relativeTime })}
        >
          <ClockIcon className="size-3 shrink-0" aria-hidden />
          <span>{t("trigger", { time: relativeTime })}</span>
        </button>
      }
    >
      <div className="space-y-5 md:contents">
        <div className="md:hidden">
          <p className="text-3xl leading-none font-semibold tracking-tight tabular-nums">{absoluteDateLabel}</p>
          <p className="text-muted-foreground mt-3 text-sm leading-snug">{t("scrapeNote")}</p>
        </div>
        <p className="mt-1 hidden md:block">{absoluteDateLabel}</p>

        {priority !== null && priority > 0 && refreshLabel && (
          <>
            <p className="mt-1 hidden md:block">
              {t.rich("priorityDesktop", {
                priority,
                refresh: refreshLabel,
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed md:hidden">
              {t.rich("priorityMobile", {
                priority,
                refresh: refreshLabel,
                strong: (chunks) => <span className="text-foreground font-medium">{chunks}</span>,
              })}
            </p>
          </>
        )}

        {(priority === null || priority < 2) && (
          <>
            <p className="mt-1 hidden md:block">
              {t.rich("addToTrackDesktop", { strong: (chunks) => <strong>{chunks}</strong> })}
            </p>
            <div className="border-border/60 border-t pt-5 md:hidden">
              <p className="text-muted-foreground text-sm leading-relaxed">
                {t.rich("addToTrackMobile", {
                  strong: (chunks) => <span className="text-foreground font-medium">{chunks}</span>,
                })}
              </p>
            </div>
          </>
        )}
      </div>
    </ResponsiveTooltip>
  )
}
