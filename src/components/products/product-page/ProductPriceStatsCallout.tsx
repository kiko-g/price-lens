"use client"

import { useLocale, useTranslations } from "next-intl"

import type { StoreProduct } from "@/types"
import {
  type PriceHistoryHint,
  getInsufficientPriceStatsMessage,
  getPriceMovementGuidance,
  hasSufficientPriceStats,
  shouldHideDesktopPriceStabilityCallout,
  shouldShowMobilePriceStatsCallout,
  volatilityBandFromCv,
  volatilityCasualLead,
} from "@/lib/business/price-volatility"
import { Callout } from "@/components/ui/callout"
import { useIsAdmin } from "@/contexts/UserContext"
import { AlertTriangleIcon, BarChart3Icon, InfoIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { isLocale, type Locale } from "@/i18n/config"
import { formatDate } from "@/lib/i18n/format"

type Props = {
  sp: StoreProduct
  className?: string
  /** `mobile`: below-the-fold strip on phones. `desktop`: card in hero (md+). */
  placement?: "mobile" | "desktop"
  /** When set (store page), aligns insufficient-stats copy with chart frequency data. */
  priceHistoryHint?: PriceHistoryHint
}

export function ProductPriceStatsCallout({ sp, className, placement = "desktop", priceHistoryHint }: Props) {
  const isAdmin = useIsAdmin()
  const showDevScore = process.env.NODE_ENV === "development" || isAdmin
  const t = useTranslations("products.priceStats")
  const localeRaw = useLocale()
  const locale: Locale = isLocale(localeRaw) ? localeRaw : "pt"

  const sufficient = hasSufficientPriceStats(sp.price_stats_updated_at, sp.price_stats_obs_90d)
  const showMobile = shouldShowMobilePriceStatsCallout(sp.price_stats_updated_at, sp.price_stats_obs_90d)
  const band = volatilityBandFromCv(sp.price_stats_cv_ln_90d)

  const guidanceInput = {
    priceChangePct: sp.price_change_pct,
    lastPriceChangeAt: sp.last_price_change_at,
    obs90d: sp.price_stats_obs_90d,
    band,
  }

  const guidance = sufficient ? getPriceMovementGuidance(guidanceInput) : null
  const guidanceCompact = sufficient ? getPriceMovementGuidance(guidanceInput, { compact: true }) : null

  const updatedLabel =
    sp.price_stats_updated_at != null
      ? formatDate(new Date(sp.price_stats_updated_at), locale, {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : null

  const metaDesktop =
    sufficient && sp.price_stats_obs_90d != null ? (
      <p className="text-muted-foreground max-w-[16rem] text-right text-xs leading-snug tabular-nums">
        {t("checksIn90d", { count: sp.price_stats_obs_90d })}
        {updatedLabel ? t("updatedSuffix", { date: updatedLabel }) : ""}
      </p>
    ) : null

  if (placement === "mobile") {
    if (!showMobile || !guidance || !guidanceCompact) return null

    const isWarning = guidance.tone === "warning"
    const StatusIcon = isWarning ? AlertTriangleIcon : BarChart3Icon

    return (
      <section className={cn(className)} aria-label={t("ariaLabel")}>
        <Callout variant={isWarning ? "warning" : "info"}>
          <div className="flex gap-2.5">
            <StatusIcon className="text-foreground mt-0.5 size-4 shrink-0 opacity-90" aria-hidden />
            <div className="min-w-0 space-y-1.5">
              <p className="text-foreground text-sm leading-snug font-semibold">{volatilityCasualLead(band, true)}</p>
              <p className="text-muted-foreground text-sm leading-snug">{guidanceCompact.body}</p>
              <p className="text-muted-foreground text-[11px] leading-snug">{t("infoOnlyShort")}</p>
            </div>
          </div>
        </Callout>
      </section>
    )
  }

  if (placement === "desktop" && shouldHideDesktopPriceStabilityCallout(priceHistoryHint)) {
    return null
  }

  if (placement === "desktop" && !sufficient && priceHistoryHint?.loading) {
    return null
  }

  const statsSyncGraceAnchorAt = sp.priority_updated_at ?? sp.created_at

  const insufficientMessage = !sufficient
    ? getInsufficientPriceStatsMessage(
        sp.price_stats_updated_at,
        sp.price_stats_obs_90d,
        priceHistoryHint,
        statsSyncGraceAnchorAt,
      )
    : null

  return (
    <section
      className={cn(
        "flex flex-col gap-2 md:gap-3",
        "md:border-border/70 md:bg-muted/20 md:rounded-xl md:border md:p-4",
        className,
      )}
      aria-label={t("ariaLabel")}
    >
      <div className="hidden md:flex md:items-start md:justify-between md:gap-4">
        <h2
          id="price-stability-heading"
          className="text-foreground flex min-w-0 items-center gap-2 text-base font-semibold tracking-tight"
        >
          <BarChart3Icon className="size-4 shrink-0 opacity-80" aria-hidden />
          {t("heading")}
        </h2>
        {metaDesktop}
      </div>

      {!sufficient && insufficientMessage ? (
        <p className="text-muted-foreground text-sm leading-snug md:mt-0">{insufficientMessage}</p>
      ) : null}

      {sufficient && guidance && guidanceCompact ? (
        <Callout variant={guidance.tone === "warning" ? "warning" : "info"} icon={InfoIcon}>
          <div className="hidden md:block">
            <p className="text-foreground text-sm font-semibold">{volatilityCasualLead(band, true)}</p>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{guidance.body}</p>
            <p className="text-muted-foreground mt-3 text-[11px] leading-snug">{t("infoOnlyLong")}</p>
          </div>

          {showDevScore && sp.price_drop_smart_score != null ? (
            <p className="text-muted-foreground mt-2 font-mono text-[11px]">
              price_drop_smart_score: {sp.price_drop_smart_score.toFixed(4)}
            </p>
          ) : null}
        </Callout>
      ) : null}
    </section>
  )
}
