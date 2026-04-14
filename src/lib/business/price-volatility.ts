import { DEFAULT_LISTING_PRICE_CHANGE_RECENCY_DAYS, PLAUSIBLE_MAX_PRICE_CHANGE_MAGNITUDE } from "./price-change"

/** CV of log prices (90d); heuristic bands — tune against production distributions. */
const CV_LOW_MAX = 0.04
const CV_MEDIUM_MAX = 0.12

export type VolatilityBand = "low" | "medium" | "high"

export function volatilityBandFromCv(cv: number | null | undefined): VolatilityBand | null {
  if (cv == null || !Number.isFinite(cv) || cv < 0) return null
  if (cv <= CV_LOW_MAX) return "low"
  if (cv <= CV_MEDIUM_MAX) return "medium"
  return "high"
}

export function volatilityLabelPt(band: VolatilityBand): string {
  switch (band) {
    case "low":
      return "Baixa volatilidade"
    case "medium":
      return "Volatilidade moderada"
    case "high":
      return "Alta volatilidade"
  }
}

function isRecentPriceDrop(lastChangeAt: string | null | undefined, changeRatio: number | null | undefined): boolean {
  if (lastChangeAt == null || changeRatio == null || changeRatio >= 0) return false
  const t = new Date(lastChangeAt).getTime()
  if (!Number.isFinite(t)) return false
  const cutoff = Date.now() - DEFAULT_LISTING_PRICE_CHANGE_RECENCY_DAYS * 24 * 60 * 60 * 1000
  return t >= cutoff
}

export type PriceGuidanceTone = "info" | "warning"

export interface PriceGuidance {
  body: string
  tone: PriceGuidanceTone
}

/**
 * Short heuristic copy (not predictive). Call only when `hasSufficientPriceStats` is true.
 */
export function getPriceMovementGuidance(input: {
  priceChangePct: number | null | undefined
  lastPriceChangeAt: string | null | undefined
  obs90d: number | null | undefined
  band: VolatilityBand | null
}): PriceGuidance {
  const { priceChangePct, lastPriceChangeAt, obs90d, band } = input
  const obs = obs90d ?? 0
  const pct = priceChangePct ?? 0
  const absPct = Math.abs(pct)

  if (obs >= 2 && obs <= 5 && absPct >= 0.12) {
    return {
      tone: "warning",
      body: "A variação recente é forte, mas o histórico nesta janela ainda é limitado. Vale a pena cruzar com o gráfico e com outros produtos antes de decidir.",
    }
  }

  if (absPct >= PLAUSIBLE_MAX_PRICE_CHANGE_MAGNITUDE * 0.85 && obs < 6) {
    return {
      tone: "info",
      body: "A alteração indicada é grande face ao histórico disponível; trate como indicador aproximado e confira o gráfico.",
    }
  }

  if (band == null) {
    return {
      tone: "info",
      body: "Use o histórico ao lado para ver se o preço atual é habitual ou excecional.",
    }
  }

  if (isRecentPriceDrop(lastPriceChangeAt, priceChangePct ?? null) && band === "high") {
    return {
      tone: "warning",
      body: "Há uma queda recente num preço que costuma variar bastante — pode ser promoção. Compare com o histórico antes de comprar.",
    }
  }

  if (band === "low" && !isRecentPriceDrop(lastPriceChangeAt, priceChangePct ?? null)) {
    return {
      tone: "info",
      body: "O preço tem sido relativamente estável; menos urgência em agir só por esta leitura.",
    }
  }

  if (band === "low" && isRecentPriceDrop(lastPriceChangeAt, priceChangePct ?? null)) {
    return {
      tone: "info",
      body: "Queda recente num preço que costuma ser estável pode ser uma boa oportunidade; confirme no gráfico e noutras lojas.",
    }
  }

  return {
    tone: "info",
    body: "Use o histórico ao lado para ver se o preço atual é habitual ou excecional.",
  }
}

export function hasSufficientPriceStats(
  updatedAt: string | null | undefined,
  obs90d: number | null | undefined,
): boolean {
  if (updatedAt == null) return false
  const obs = obs90d ?? 0
  return obs >= 2
}
