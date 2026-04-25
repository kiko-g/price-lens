"use client"

import { useLocale, useTranslations } from "next-intl"

import type { StoreProduct } from "@/types"
import {
  type InsufficientPriceStatsKind,
  type PriceGuidanceScenario,
  type PriceHistoryHint,
  type VolatilityLeadKey,
  getInsufficientPriceStatsResult,
  getPriceMovementGuidance,
  getVolatilityLeadKey,
  hasSufficientPriceStats,
  shouldHideDesktopPriceStabilityCallout,
  shouldShowMobilePriceStatsCallout,
  volatilityBandFromCv,
} from "@/lib/business/price-volatility"
import { Callout } from "@/components/ui/callout"
import { useIsAdmin } from "@/contexts/UserContext"
import { AlertTriangleIcon, BarChart3Icon, InfoIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { isLocale, type Locale } from "@/i18n/config"
import { formatDate } from "@/lib/i18n/format"

type PriceStatsT = ReturnType<typeof useTranslations<"products.priceStats">>

function leadCopy(t: PriceStatsT, key: VolatilityLeadKey) {
  switch (key) {
    case "collecting":
      return t("leads.collecting")
    case "steady":
      return t("leads.steady")
    case "medium":
      return t("leads.medium")
    case "jumpy":
      return t("leads.jumpy")
    case "unclear":
      return t("leads.unclear")
  }
}

function guidanceCopy(t: PriceStatsT, scenario: PriceGuidanceScenario, mode: "compact" | "long") {
  const compact = mode === "compact"
  switch (scenario) {
    case "fewPointsBigMove":
      return compact ? t("guidance.fewPointsBigMove.compact") : t("guidance.fewPointsBigMove.long")
    case "hugeSwing":
      return compact ? t("guidance.hugeSwing.compact") : t("guidance.hugeSwing.long")
    case "seeChart":
      return compact ? t("guidance.seeChart.compact") : t("guidance.seeChart.long")
    case "dropWhenVolatile":
      return compact ? t("guidance.dropWhenVolatile.compact") : t("guidance.dropWhenVolatile.long")
    case "calmNoRecentDrop":
      return compact ? t("guidance.calmNoRecentDrop.compact") : t("guidance.calmNoRecentDrop.long")
    case "unusualDropWhenCalm":
      return compact ? t("guidance.unusualDropWhenCalm.compact") : t("guidance.unusualDropWhenCalm.long")
  }
}

function insufficientCopy(t: PriceStatsT, kind: InsufficientPriceStatsKind) {
  switch (kind) {
    case "sameLevel":
      return t("insufficient.sameLevel")
    case "stillSyncing":
      return t("insufficient.stillSyncing")
    case "noSummaryYet":
      return t("insufficient.noSummaryYet")
    case "noHistory":
      return t("insufficient.noHistory")
    case "oneCheck":
      return t("insufficient.oneCheck")
    case "noChecks90d":
      return t("insufficient.noChecks90d")
    case "needMoreData":
      return t("insufficient.needMoreData")
    case "fallback":
      return t("insufficient.fallback")
  }
}

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
    if (!showMobile || !guidance) return null

    const isWarning = guidance.tone === "warning"
    const StatusIcon = isWarning ? AlertTriangleIcon : BarChart3Icon

    return (
      <section className={cn(className)} aria-label={t("ariaLabel")}>
        <Callout variant={isWarning ? "warning" : "info"}>
          <div className="flex gap-2.5">
            <StatusIcon className="text-foreground mt-0.5 size-4 shrink-0 opacity-90" aria-hidden />
            <div className="min-w-0 space-y-1.5">
              <p className="text-foreground text-sm leading-snug font-semibold">
                {leadCopy(t, getVolatilityLeadKey(band, true))}
              </p>
              <p className="text-muted-foreground text-sm leading-snug">
                {guidanceCopy(t, guidance.scenario, "compact")}
              </p>
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

  const insufficient = !sufficient
    ? getInsufficientPriceStatsResult(
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

      {!sufficient && insufficient ? (
        <p className="text-muted-foreground text-sm leading-snug md:mt-0">{insufficientCopy(t, insufficient.kind)}</p>
      ) : null}

      {sufficient && guidance ? (
        <Callout variant={guidance.tone === "warning" ? "warning" : "info"} icon={InfoIcon}>
          <div className="hidden md:block">
            <p className="text-foreground text-sm font-semibold">{leadCopy(t, getVolatilityLeadKey(band, true))}</p>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              {guidanceCopy(t, guidance.scenario, "long")}
            </p>
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
