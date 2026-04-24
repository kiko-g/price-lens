"use client"

import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"

import type { ReactNode } from "react"
import type { StoreProduct } from "@/types"
import { RANGES, DateRange } from "@/types/business"
import {
  hasSufficientPriceStats,
  type PriceHistoryHint,
  shouldHideDesktopPriceStabilityCallout,
} from "@/lib/business/price-volatility"
import { useUpdateSearchParams } from "@/hooks/useUpdateSearchParams"
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed"

import { Separator } from "@/components/ui/separator"
import { ProductChart } from "@/components/products/ProductChart"
import { RelatedStoreProducts } from "@/components/products/RelatedStoreProducts"
import { IdenticalProductsCompare } from "@/components/products/IdenticalProductsCompare"

import { CategoryBreadcrumb } from "@/components/products/product-page/CategoryBreadcrumb"
import { ProductHeroDesktop } from "@/components/products/product-page/ProductHeroDesktop"
import { ProductHeroMobile } from "@/components/products/product-page/ProductHeroMobile"
import { ProductPageDealSummary } from "@/components/products/product-page/ProductPageDealSummary"
import { ProductPriceStatsCallout } from "@/components/products/product-page/ProductPriceStatsCallout"

const DEFAULT_RANGE = "1M" as const

function parseRangeParam(value: string | null): DateRange {
  if (value && RANGES.includes(value as DateRange)) return value as DateRange
  return DEFAULT_RANGE
}

/** Stacked table + legend + chart (e.g. mobile; also md–1280 with price table in the main column). */
function ProductChartDefaultAnalyticsGrid() {
  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2 xl:gap-x-6 xl:gap-y-3">
      <div className="order-2 flex max-w-2xl min-w-0 flex-col xl:col-start-1 xl:row-start-1">
        <ProductChart.PricesVariation showFreshnessInfo={false} />
      </div>

      <div className="order-1 max-w-2xl min-w-0 xl:col-start-1 xl:row-start-2">
        <ProductChart.PriceTable className="w-full max-w-full min-w-0" scrollable={false} />
      </div>

      <div className="xl:dark:bg-foreground/2 xl:bg-foreground/2 order-3 flex h-fit max-w-xl min-w-0 flex-col gap-2 xl:col-start-2 xl:row-span-2 xl:row-start-1 xl:rounded-lg xl:px-2 xl:pt-3 xl:pb-0">
        <ProductChart.RangeSelector className="xl:justify-start" />
        <ProductChart.Graph />
      </div>
    </div>
  )
}

/** Desktop (xl+): table in the left product rail; optional xl row [stability | legend] only — chart stays full width below. */
function ProductChartLeftRailDesktopLayout({ stabilityCallout }: { stabilityCallout?: ReactNode }) {
  const legend = (
    <div className="min-w-0 w-full">
      <ProductChart.PricesVariation showFreshnessInfo={false} wideCard className="mb-0" />
    </div>
  )

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {stabilityCallout != null ? (
        <div className="grid min-w-0 max-xl:grid-cols-1 max-xl:gap-3 xl:grid-cols-2 xl:items-start xl:gap-4">
          <div className="min-w-0 max-w-full [&>section]:max-w-full">{stabilityCallout}</div>
          {legend}
        </div>
      ) : (
        legend
      )}

      <div className="max-xl:block w-full min-w-0 xl:hidden">
        <ProductChart.PriceTable
          className="w-full min-w-0 [font-variant-numeric:tabular-nums] text-xs"
          scrollable={true}
        />
      </div>

      <div className="bg-foreground/2 dark:bg-foreground/2 flex min-w-0 w-full flex-col gap-2 rounded-lg px-0 pt-1 pb-0">
        <ProductChart.RangeSelector className="xl:justify-start" />
        <ProductChart.Graph />
      </div>
    </div>
  )
}

type ProductChartBlockProps = {
  sp: StoreProduct
  useLeftRailAtXl: boolean
  /** Desktop: optional row with PricesVariation; line chart + range stay full width below. */
  desktopStabilityCallout?: ReactNode
}

function StoreProductChartBlock({ sp, useLeftRailAtXl, desktopStabilityCallout }: ProductChartBlockProps) {
  return (
    <>
      <ProductChart.NotTracked />
      {sp.priority != null && sp.priority > 0 && (
        <>
          <ProductChart.NoData />
          <ProductChart.Error />

          <ProductChart.ChartContent>
            <ProductChart.AnalyticsDisclosure>
              {useLeftRailAtXl ? (
                <ProductChartLeftRailDesktopLayout stabilityCallout={desktopStabilityCallout} />
              ) : (
                <ProductChartDefaultAnalyticsGrid />
              )}
            </ProductChart.AnalyticsDisclosure>
          </ProductChart.ChartContent>
        </>
      )}
    </>
  )
}

type ChartSectionProps = {
  sp: StoreProduct
  rangeFromUrl: DateRange
  onRangeChange: (range: DateRange) => void
  onPriceHistoryHint?: (hint: PriceHistoryHint) => void
  /**
   * Desktop hero: price-frequency table in the left rail at xl+; full-width chart; hide duplicate in main.
   * Mobile/accordion: use false (default).
   */
  useLeftRailAtXl?: boolean
}

function ChartSection({ sp, rangeFromUrl, onRangeChange, onPriceHistoryHint, useLeftRailAtXl = false }: ChartSectionProps) {
  return (
    <ProductChart.Root
      sp={sp}
      defaultRange={rangeFromUrl}
      onRangeChange={onRangeChange}
      onPriceHistoryHint={onPriceHistoryHint}
      samplingMode="efficient"
      className="flex-1"
    >
      <StoreProductChartBlock sp={sp} useLeftRailAtXl={useLeftRailAtXl} />
    </ProductChart.Root>
  )
}

export function StoreProductPage({ sp }: { sp: StoreProduct }) {
  const searchParams = useSearchParams()
  const updateParams = useUpdateSearchParams()
  const { addItem } = useRecentlyViewed()

  const isTracked = sp.priority != null && sp.priority > 0
  const [priceHistoryHint, setPriceHistoryHint] = useState<PriceHistoryHint>(() => ({
    loading: isTracked,
    levels: null,
  }))

  const handlePriceHistoryHint = useCallback((hint: PriceHistoryHint) => {
    setPriceHistoryHint(hint)
  }, [])

  const rangeFromUrl = parseRangeParam(searchParams.get("range"))
  const storeProductId = sp.id?.toString() || ""

  useEffect(() => {
    setPriceHistoryHint({
      loading: sp.priority != null && sp.priority > 0,
      levels: null,
    })
  }, [sp.id, sp.priority])

  useEffect(() => {
    addItem({
      id: sp.id,
      name: sp.name,
      brand: sp.brand,
      image: sp.image,
      price: sp.price,
      origin_id: sp.origin_id,
    })
    // Track product view (fire-and-forget)
    fetch("/api/views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ store_product_id: sp.id }),
    }).catch((err) => console.error("[StoreProductPage] views POST failed:", err))
  }, [sp.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRangeChange = (range: DateRange) => {
    updateParams({ range: range === DEFAULT_RANGE ? null : range })
  }

  const priceStatsSufficient = hasSufficientPriceStats(sp.price_stats_updated_at, sp.price_stats_obs_90d)
  const canShowDesktopStabilityWithLegend =
    !shouldHideDesktopPriceStabilityCallout(priceHistoryHint) &&
    (priceStatsSufficient || !priceHistoryHint?.loading)

  return (
    <div className="mx-auto mb-8 flex w-full max-w-[1320px] flex-col py-0 lg:py-4">
      {/* Category Breadcrumb shown on both breakpoints */}
      <CategoryBreadcrumb sp={sp} className="mb-2 px-0 md:mb-3" />

      {/* Desktop hero (hidden below md) - Root spans aside + right column; xl+ table in left rail */}
      <ProductChart.Root
        sp={sp}
        defaultRange={rangeFromUrl}
        onRangeChange={handleRangeChange}
        onPriceHistoryHint={handlePriceHistoryHint}
        samplingMode="efficient"
        className="hidden w-full min-w-0 md:block"
      >
        <ProductHeroDesktop
          sp={sp}
          asideBelowBarcode={
            isTracked ? (
              <div className="hidden w-full min-w-0 xl:block">
                <ProductChart.PriceTable
                  className="w-full min-w-0 [font-variant-numeric:tabular-nums] text-xs"
                  scrollable={true}
                />
              </div>
            ) : null
          }
        >
          {/* Full-width stack: the prior xl:flex row squeezed the line chart to ~50% of the main column. */}
          <div className="mt-1 flex min-w-0 w-full max-w-full flex-col gap-3">
            {!isTracked ? (
              <ProductPriceStatsCallout
                sp={sp}
                className="max-w-none w-full"
                placement="desktop"
                priceHistoryHint={priceHistoryHint}
              />
            ) : null}
            <StoreProductChartBlock
              sp={sp}
              useLeftRailAtXl={true}
              desktopStabilityCallout={
                isTracked && canShowDesktopStabilityWithLegend ? (
                  <ProductPriceStatsCallout
                    sp={sp}
                    className="max-w-none w-full"
                    placement="desktop"
                    priceHistoryHint={priceHistoryHint}
                  />
                ) : undefined
              }
            />
          </div>
        </ProductHeroDesktop>
      </ProductChart.Root>

      {/* Mobile hero (hidden at md+) */}
      <ProductHeroMobile sp={sp} />

      <div className="mt-5 md:hidden">
        <ProductPageDealSummary sp={sp} />
      </div>

      <ProductPriceStatsCallout sp={sp} placement="mobile" className="mt-4 px-0 md:hidden" />

      {/* Mobile: price history accordion (compact when collapsed) before the full compare list */}
      <div className="mt-5 md:hidden">
        <ChartSection
          sp={sp}
          rangeFromUrl={rangeFromUrl}
          onRangeChange={handleRangeChange}
          onPriceHistoryHint={handlePriceHistoryHint}
        />
      </div>

      <div className="mt-6 md:hidden">
        <IdenticalProductsCompare currentProduct={sp} />
      </div>

      <Separator className="mt-3 mb-3 h-0 md:mt-8 md:mb-4 md:h-px" />

      <div className="hidden md:block">
        <IdenticalProductsCompare currentProduct={sp} />
      </div>
      <Separator className="mt-8 mb-4 hidden md:block" />
      <RelatedStoreProducts id={storeProductId} limit={20} />
    </div>
  )
}
