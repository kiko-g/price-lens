"use client"

import { ProductPriceStatsCallout } from "@/components/products/product-page/ProductPriceStatsCallout"
import {
  PRICE_STATS_CALLOUT_PREVIEW_SCENARIOS,
  previewBaseStoreProduct,
} from "@/lib/business/price-stats-callout-preview"
import { MOBILE_PRICE_STATS_MIN_OBSERVATIONS } from "@/lib/business/price-volatility"

export default function AdminProductStatsPreviewPage() {
  const base = previewBaseStoreProduct()

  return (
    <div className="mx-auto max-w-4xl overflow-auto p-6 pb-16">
      <h1 className="text-foreground text-xl font-semibold tracking-tight">Product stats callout: UI preview</h1>
      <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">
        Emulated <code className="text-xs">store_products</code> stats fields for each scenario. Same component as the
        live product page (English until i18n). This page shows the desktop card; on the real site the mobile strip only
        appears when there are at least {MOBILE_PRICE_STATS_MIN_OBSERVATIONS} observations in the 90-day window (see{" "}
        <code className="text-xs">MOBILE_PRICE_STATS_MIN_OBSERVATIONS</code>).
      </p>

      <ul className="text-muted-foreground mt-4 max-w-2xl list-inside list-disc space-y-1 text-sm">
        <li>Deal summary card only appears on the real product page.</li>
        <li>Chart accordion on mobile: &quot;Price points, chart and analysis&quot;.</li>
      </ul>

      <div className="mt-8 space-y-10">
        {PRICE_STATS_CALLOUT_PREVIEW_SCENARIOS.map((scenario) => {
          const sp = { ...base, ...scenario.patch }
          return (
            <section key={scenario.id} className="border-border space-y-3 rounded-xl border p-4">
              <div>
                <h2 className="text-foreground font-medium">{scenario.title}</h2>
                <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{scenario.description}</p>
                <p className="text-muted-foreground mt-2 font-mono text-[10px] leading-relaxed break-all">
                  id: {scenario.id}
                </p>
              </div>
              <ProductPriceStatsCallout sp={sp} className="border-border/60 bg-muted/20 rounded-lg border p-3" />
            </section>
          )
        })}
      </div>
    </div>
  )
}
