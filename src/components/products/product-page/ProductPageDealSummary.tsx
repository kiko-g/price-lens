"use client"

import type { StoreProduct } from "@/types"
import { useMemo } from "react"
import { usePricesWithAnalytics } from "@/hooks/usePrices"
import { useIdenticalStoreProducts } from "@/hooks/useProducts"
import { generateProductPath } from "@/lib/business/product"

import {
  DealSummaryCard,
  DealSummaryCardTrackedHint,
  type CheaperElsewhereHint,
} from "@/components/products/product-page/DealSummaryCard"

type Props = {
  sp: StoreProduct
  className?: string
}

function useCheaperElsewhereHint(
  sp: StoreProduct,
  identicalProducts: StoreProduct[] | undefined,
): CheaperElsewhereHint | null {
  return useMemo(() => {
    if (!identicalProducts?.length || sp.price == null || sp.id == null) return null
    const all: StoreProduct[] = [sp, ...identicalProducts]
    const priced = all.filter((p): p is StoreProduct & { price: number } => p.price != null)
    if (priced.length < 2) return null

    const cheapestVal = Math.min(...priced.map((p) => p.price))
    const highestVal = Math.max(...priced.map((p) => p.price))
    if (Math.round(highestVal * 100) <= Math.round(cheapestVal * 100)) return null
    if (sp.price <= cheapestVal) return null

    const atFloor = priced.filter((p) => p.price === cheapestVal)
    const winner = atFloor.find((p) => p.id !== sp.id) ?? atFloor[0]
    if (winner.id === sp.id) return null

    return {
      originId: winner.origin_id,
      saveAmount: Number((sp.price - cheapestVal).toFixed(2)),
      href: generateProductPath(winner),
    }
  }, [identicalProducts, sp])
}

export function ProductPageDealSummary({ sp, className }: Props) {
  const id = sp.id?.toString() || ""
  const isTracked = sp.priority != null && sp.priority > 0
  const { data, isLoading } = usePricesWithAnalytics(id, { enabled: isTracked && id.length > 0 })
  const { data: identicalProducts, isLoading: crossLoading } = useIdenticalStoreProducts(id, 10)

  const pricePoints = useMemo(() => data?.analytics?.pricePoints ?? null, [data?.analytics?.pricePoints])
  const mostCommon = useMemo(() => data?.analytics?.mostCommon ?? null, [data?.analytics?.mostCommon])
  const historyDays = useMemo(
    () => data?.analytics?.dateRange?.daysBetween ?? 0,
    [data?.analytics?.dateRange?.daysBetween],
  )

  const cheaperHint = useCheaperElsewhereHint(sp, identicalProducts)
  const resolvedCheaper = !crossLoading ? cheaperHint : null

  if (!isTracked) {
    return <DealSummaryCardTrackedHint className={className} cheaperHint={resolvedCheaper} />
  }

  return (
    <DealSummaryCard
      sp={sp}
      pricePoints={pricePoints}
      mostCommon={mostCommon}
      historyDays={historyDays}
      isLoading={isLoading}
      cheaperHint={resolvedCheaper}
      className={className}
    />
  )
}
