"use client"

import { useSearchParams } from "next/navigation"

import type { StoreProduct } from "@/types"
import { RANGES, DateRange } from "@/types/business"
import { useUpdateSearchParams } from "@/hooks/useUpdateSearchParams"

import { Separator } from "@/components/ui/separator"
import { ProductChart } from "@/components/products/ProductChart"
import { RelatedStoreProducts } from "@/components/products/RelatedStoreProducts"
import { IdenticalProductsCompare } from "@/components/products/IdenticalProductsCompare"

import { CategoryBreadcrumb } from "@/components/products/product-page/CategoryBreadcrumb"
import { ProductHeroDesktop } from "@/components/products/product-page/ProductHeroDesktop"
import { ProductHeroMobile } from "@/components/products/product-page/ProductHeroMobile"

const DEFAULT_RANGE = "Max" as const

function parseRangeParam(value: string | null): DateRange {
  if (value && RANGES.includes(value as DateRange)) return value as DateRange
  return DEFAULT_RANGE
}

function ChartSection({
  sp,
  rangeFromUrl,
  onRangeChange,
}: {
  sp: StoreProduct
  rangeFromUrl: DateRange
  onRangeChange: (range: DateRange) => void
}) {
  return (
    <ProductChart.Root
      sp={sp}
      defaultRange={rangeFromUrl}
      onRangeChange={onRangeChange}
      samplingMode="efficient"
      className="flex-1"
    >
      <ProductChart.NotTracked />
      {sp.priority != null && sp.priority > 0 && (
        <>
          <ProductChart.NoData />
          <ProductChart.Error />

          <ProductChart.ChartContent>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 xl:gap-x-6 xl:gap-y-3">
              <div className="order-2 flex max-w-2xl flex-col xl:col-start-1 xl:row-start-1">
                <ProductChart.PricesVariation showFreshnessInfo={false} />
              </div>

              <div className="order-1 max-w-2xl xl:col-start-1 xl:row-start-2">
                <ProductChart.PriceTable className="max-h-[280px] min-w-100 xl:max-h-80 xl:max-w-full" scrollable />
              </div>

              <div className="xl:dark:bg-foreground/2 xl:bg-foreground/2 order-3 flex h-fit max-w-xl flex-col gap-2 xl:col-start-2 xl:row-span-2 xl:row-start-1 xl:rounded-lg xl:px-2 xl:pt-3 xl:pb-0">
                <ProductChart.RangeSelector className="xl:justify-start" />
                <ProductChart.Graph />
              </div>
            </div>
          </ProductChart.ChartContent>
        </>
      )}
    </ProductChart.Root>
  )
}

export function StoreProductPage({ sp }: { sp: StoreProduct }) {
  const searchParams = useSearchParams()
  const updateParams = useUpdateSearchParams()

  const rangeFromUrl = parseRangeParam(searchParams.get("range"))
  const storeProductId = sp.id?.toString() || ""

  const handleRangeChange = (range: DateRange) => {
    updateParams({ range: range === DEFAULT_RANGE ? null : range })
  }

  return (
    <div className="mx-auto mb-8 flex w-full max-w-[1320px] flex-col py-0 lg:py-4">
      {/* Category Breadcrumb - shown on both breakpoints */}
      <CategoryBreadcrumb sp={sp} className="mb-2 px-0 md:mb-3" />

      {/* Desktop hero (hidden below md) - chart lives inside the right column */}
      <ProductHeroDesktop sp={sp}>
        <ChartSection sp={sp} rangeFromUrl={rangeFromUrl} onRangeChange={handleRangeChange} />
      </ProductHeroDesktop>

      {/* Mobile hero (hidden at md+) */}
      <ProductHeroMobile sp={sp} />

      {/* Mobile chart - full width, hidden on desktop (already rendered inside hero) */}
      <div className="mt-4 md:hidden">
        <ChartSection sp={sp} rangeFromUrl={rangeFromUrl} onRangeChange={handleRangeChange} />
      </div>

      <Separator className="mt-8 mb-4" />
      <IdenticalProductsCompare currentProduct={sp} />
      <Separator className="mt-8 mb-4" />
      <RelatedStoreProducts id={storeProductId} limit={20} />
    </div>
  )
}
