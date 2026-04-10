"use client"

import { useState } from "react"
import type { DealsResult } from "@/lib/queries/deals"
import type { StoreProduct } from "@/types"
import { SupermarketChain, STORE_NAMES } from "@/types/business"

import { StoreProductCard } from "@/components/products/StoreProductCard"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SupermarketChainBadge } from "@/components/products/SupermarketChainBadge"
import { cn } from "@/lib/utils"

import { TrendingDownIcon, TicketPercentIcon, FilterIcon } from "lucide-react"

const storeFilters = [
  { id: "all", label: "All Stores" },
  {
    id: String(SupermarketChain.Continente),
    label: STORE_NAMES[SupermarketChain.Continente],
    originId: SupermarketChain.Continente,
  },
  {
    id: String(SupermarketChain.Auchan),
    label: STORE_NAMES[SupermarketChain.Auchan],
    originId: SupermarketChain.Auchan,
  },
  {
    id: String(SupermarketChain.PingoDoce),
    label: STORE_NAMES[SupermarketChain.PingoDoce],
    originId: SupermarketChain.PingoDoce,
  },
] as const

function filterByStore(products: StoreProduct[], storeFilter: string): StoreProduct[] {
  if (storeFilter === "all") return products
  const originId = parseInt(storeFilter)
  return products.filter((p) => p.origin_id === originId)
}

export function DealsShowcase({ deals }: { deals: DealsResult }) {
  const [storeFilter, setStoreFilter] = useState("all")

  const filteredDrops = filterByStore(deals.priceDrops as StoreProduct[], storeFilter)
  const filteredDiscounts = filterByStore(deals.discounts as StoreProduct[], storeFilter)

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-8 lg:py-8">
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Deals & Price Drops</h1>
        <p className="text-muted-foreground text-sm lg:text-base">
          The biggest price drops and best discounts right now across Portuguese supermarkets.
        </p>
      </div>

      {/* Store filter chips */}
      <div className="mb-5 flex items-center gap-2 overflow-x-auto pb-1">
        <FilterIcon className="text-muted-foreground hidden size-4 shrink-0 sm:block" />
        {storeFilters.map((filter) => (
          <button
            key={filter.id}
            type="button"
            aria-label={filter.label}
            aria-pressed={storeFilter === filter.id}
            onClick={() => setStoreFilter(filter.id)}
            className={cn(
              "inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-full border px-3 text-sm font-medium transition-colors",
              "originId" in filter ? "min-w-[3rem] px-2.5" : "px-3.5",
              storeFilter === filter.id &&
                ("originId" in filter
                  ? "border-primary bg-primary/10 text-foreground ring-primary/20 ring-2"
                  : "border-primary bg-primary text-primary-foreground"),
              storeFilter !== filter.id && "border-border bg-background hover:bg-accent",
            )}
          >
            {"originId" in filter ? (
              <>
                <span className="sr-only">{filter.label}</span>
                <span className="flex h-5 items-center [&_img]:object-contain [&_svg]:max-h-5">
                  <SupermarketChainBadge originId={filter.originId} variant="logoSmall" />
                </span>
              </>
            ) : (
              filter.label
            )}
          </button>
        ))}
      </div>

      <Tabs defaultValue="price-drops">
        <TabsList className="h-auto min-h-10 gap-1 p-1">
          <TabsTrigger value="price-drops" className="gap-2 px-3 py-2 text-sm data-[state=active]:shadow-sm">
            <TrendingDownIcon className="size-4 shrink-0" />
            <span>Price Drops</span>
            <DealTabCount n={filteredDrops.length} />
          </TabsTrigger>
          <TabsTrigger value="discounts" className="gap-2 px-3 py-2 text-sm data-[state=active]:shadow-sm">
            <TicketPercentIcon className="size-4 shrink-0" />
            <span>Discounts</span>
            <DealTabCount n={filteredDiscounts.length} />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="price-drops" className="mt-4">
          {filteredDrops.length === 0 ? (
            <EmptyDeals />
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {filteredDrops.map((product) => (
                <StoreProductCard key={product.id} sp={product as StoreProduct} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="discounts" className="mt-4">
          {filteredDiscounts.length === 0 ? (
            <EmptyDeals />
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {filteredDiscounts.map((product) => (
                <StoreProductCard key={product.id} sp={product as StoreProduct} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function DealTabCount({ n }: { n: number }) {
  return (
    <span className="bg-muted-foreground/15 text-muted-foreground inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-xs font-semibold tabular-nums">
      {n}
    </span>
  )
}

function EmptyDeals() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <TrendingDownIcon className="text-muted-foreground mb-3 size-10" />
      <p className="text-muted-foreground text-sm">No deals found for this filter. Try a different store.</p>
    </div>
  )
}
