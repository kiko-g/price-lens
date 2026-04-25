"use client"

import { useMemo } from "react"
import { useTranslations } from "next-intl"

import type { PricesWithAnalytics, StoreProduct } from "@/types"
import { shouldShowGoodDealOpportunity, type GoodDealAnalytics } from "@/lib/business/good-deal-opportunity"
import { usePricesWithAnalytics } from "@/hooks/usePrices"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Flame as FireIcon } from "lucide-react"

type Props = {
  sp: StoreProduct
  className?: string
}

function analyticsFromPricesData(data: PricesWithAnalytics | undefined): GoodDealAnalytics | null {
  if (!data?.analytics) return null
  const a = data.analytics
  return {
    pricePoints: a.pricePoints ?? null,
    mostCommon: a.mostCommon ?? null,
    historyDays: a.dateRange?.daysBetween ?? 0,
  }
}

export function GoodDealOpportunityBadge({ sp, className }: Props) {
  const t = useTranslations("products.hero.goodDeal")
  const id = sp.id?.toString() ?? ""
  const isTracked = sp.priority != null && sp.priority > 0
  const { data, isLoading } = usePricesWithAnalytics(id, { enabled: isTracked && id.length > 0 })

  const show = useMemo(() => {
    if (isTracked && isLoading) return false
    const analytics = isTracked ? analyticsFromPricesData(data) : null
    return shouldShowGoodDealOpportunity(sp, analytics)
  }, [sp, isTracked, isLoading, data])

  if (!show) return null

  return (
    <Badge
      variant="retail-deal"
      size="sm"
      roundedness="sm"
      className={cn("w-fit shrink-0 font-semibold", className)}
      aria-label={t("aria")}
    >
      <FireIcon className="size-3.5 shrink-0" strokeWidth={2.25} aria-hidden />
      {t("label")}
    </Badge>
  )
}
