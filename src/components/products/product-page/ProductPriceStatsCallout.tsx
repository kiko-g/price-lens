"use client"

import type { StoreProduct } from "@/types"
import {
  getPriceMovementGuidance,
  hasSufficientPriceStats,
  volatilityBandFromCv,
  volatilityLabelPt,
} from "@/lib/business/price-volatility"
import { Callout } from "@/components/ui/callout"
import { useIsAdmin } from "@/contexts/UserContext"
import { BarChart3Icon, InfoIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type Props = {
  sp: StoreProduct
  className?: string
}

export function ProductPriceStatsCallout({ sp, className }: Props) {
  const isAdmin = useIsAdmin()
  const showDevScore = process.env.NODE_ENV === "development" || isAdmin

  const sufficient = hasSufficientPriceStats(sp.price_stats_updated_at, sp.price_stats_obs_90d)
  const band = volatilityBandFromCv(sp.price_stats_cv_ln_90d)
  const guidance = sufficient
    ? getPriceMovementGuidance({
        priceChangePct: sp.price_change_pct,
        lastPriceChangeAt: sp.last_price_change_at,
        obs90d: sp.price_stats_obs_90d,
        band,
      })
    : null

  const updatedLabel =
    sp.price_stats_updated_at != null
      ? new Date(sp.price_stats_updated_at).toLocaleDateString("pt-PT", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : null

  return (
    <section className={cn("flex flex-col gap-2", className)} aria-labelledby="price-stats-heading">
      <h2 id="price-stats-heading" className="text-foreground flex items-center gap-2 text-sm font-semibold">
        <BarChart3Icon className="size-4 shrink-0 opacity-80" aria-hidden />
        Histórico recente e volatilidade
      </h2>

      {!sufficient ? (
        <Callout variant="info" icon={InfoIcon}>
          <p className="font-medium">Ainda não há dados suficientes</p>
          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
            Precisamos de mais observações de preço nesta janela (90 dias) para caracterizar a volatilidade. O gráfico
            abaixo continua a ser a melhor referência.
          </p>
        </Callout>
      ) : (
        <>
          <div className="text-muted-foreground text-xs leading-relaxed">
            <span className="text-foreground font-medium">
              {band != null ? volatilityLabelPt(band) : "Volatilidade indisponível (CV)"}
            </span>
            {sp.price_stats_obs_90d != null ? (
              <>
                {" · "}
                {sp.price_stats_obs_90d} observações (90 dias)
              </>
            ) : null}
            {updatedLabel ? (
              <>
                {" · "}
                dados até {updatedLabel}
              </>
            ) : null}
          </div>

          {guidance ? (
            <Callout variant={guidance.tone === "warning" ? "warning" : "info"} icon={InfoIcon}>
              <p className="leading-relaxed">{guidance.body}</p>
              <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
                Informação sobre preços para comparar no dia a dia — não é aconselhamento financeiro nem recomendação de
                compra.
              </p>
            </Callout>
          ) : null}

          {showDevScore && sp.price_drop_smart_score != null ? (
            <p className="text-muted-foreground font-mono text-[11px]">
              price_drop_smart_score: {sp.price_drop_smart_score.toFixed(4)}
            </p>
          ) : null}
        </>
      )}
    </section>
  )
}
