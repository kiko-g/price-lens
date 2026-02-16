"use client"

import { ProductChart } from "@/components/products/ProductChart"
import type { StoreProduct } from "@/types"

export function StoreProductCardDrawerChart({ sp }: { sp: StoreProduct }) {
  const isTracked = sp.priority != null && sp.priority > 0

  return (
    <ProductChart.Root sp={sp} samplingMode="efficient">
      <ProductChart.FallbackDetails className="mb-4" />
      <ProductChart.NotTracked />
      {isTracked && (
        <>
          <ProductChart.NoData />
          <ProductChart.Error />
          <ProductChart.ChartContent>
            <ProductChart.PricesVariation showImage showBarcode />
            <ProductChart.PriceTable />
            <ProductChart.RangeSelector className="mt-2 mb-2" />
            <ProductChart.Graph />
          </ProductChart.ChartContent>
        </>
      )}
    </ProductChart.Root>
  )
}
