"use client"

import type { StoreProduct } from "@/types"
import {
  getPriceMovementGuidance,
  hasSufficientPriceStats,
  shouldShowMobilePriceStatsCallout,
  volatilityBandFromCv,
  volatilityCasualLead,
} from "@/lib/business/price-volatility"
import { Callout } from "@/components/ui/callout"
import { useIsAdmin } from "@/contexts/UserContext"
import { AlertTriangleIcon, BarChart3Icon, InfoIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type Props = {
  sp: StoreProduct
  className?: string
  /** `mobile`: below-the-fold strip on phones. `desktop`: card in hero (md+). */
  placement?: "mobile" | "desktop"
}

export function ProductPriceStatsCallout({ sp, className, placement = "desktop" }: Props) {
  const isAdmin = useIsAdmin()
  const showDevScore = process.env.NODE_ENV === "development" || isAdmin

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
      ? new Date(sp.price_stats_updated_at).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : null

  const metaDesktop =
    sufficient && sp.price_stats_obs_90d != null ? (
      <p className="text-muted-foreground max-w-[16rem] text-right text-xs leading-snug tabular-nums">
        {sp.price_stats_obs_90d} price checks in the last 90 days
        {updatedLabel ? ` · updated ${updatedLabel}` : ""}
      </p>
    ) : null

  if (placement === "mobile") {
    if (!showMobile || !guidance || !guidanceCompact) return null

    const isWarning = guidance.tone === "warning"
    const StatusIcon = isWarning ? AlertTriangleIcon : BarChart3Icon

    return (
      <section className={cn(className)} aria-label="How stable is this price?">
        <Callout variant={isWarning ? "warning" : "info"}>
          <div className="flex gap-2.5">
            <StatusIcon className="text-foreground mt-0.5 size-4 shrink-0 opacity-90" aria-hidden />
            <div className="min-w-0 space-y-1.5">
              <p className="text-foreground text-sm leading-snug font-semibold">{volatilityCasualLead(band, true)}</p>
              <p className="text-muted-foreground text-sm leading-snug">{guidanceCompact.body}</p>
              <p className="text-muted-foreground text-[11px] leading-snug">Informative only. Not advice.</p>
            </div>
          </div>
        </Callout>
      </section>
    )
  }

  return (
    <section
      className={cn(
        "flex flex-col gap-2 md:gap-3",
        "md:border-border/70 md:bg-muted/20 md:rounded-xl md:border md:p-5",
        className,
      )}
      aria-label="How stable is this price?"
    >
      <div className="hidden md:flex md:items-start md:justify-between md:gap-4">
        <h2
          id="price-stability-heading"
          className="text-foreground flex min-w-0 items-center gap-2 text-base font-semibold tracking-tight"
        >
          <BarChart3Icon className="size-4 shrink-0 opacity-80" aria-hidden />
          How stable is this price?
        </h2>
        {metaDesktop}
      </div>

      {!sufficient ? (
        <Callout variant="info" icon={InfoIcon} className="md:mt-0">
          <p className="text-muted-foreground text-sm leading-snug">
            We need more recorded prices in the last 90 days before we can say how jumpy this product usually is. The
            chart below is still the best place to look.
          </p>
        </Callout>
      ) : guidance && guidanceCompact ? (
        <Callout variant={guidance.tone === "warning" ? "warning" : "info"} icon={InfoIcon}>
          <div className="hidden md:block">
            <p className="text-foreground text-sm font-semibold">{volatilityCasualLead(band, true)}</p>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{guidance.body}</p>
            <p className="text-muted-foreground mt-3 text-[11px] leading-snug">
              Informative only. Not financial advice.
            </p>
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
