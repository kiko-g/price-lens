"use client"

import { useState } from "react"
import type { DealsResult } from "@/lib/queries/deals"
import type { StoreProduct } from "@/types"
import { SupermarketChain, STORE_NAMES } from "@/types/business"

import { StoreProductCard } from "@/components/products/StoreProductCard"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { SupermarketChainBadge } from "@/components/products/SupermarketChainBadge"

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
            onClick={() => setStoreFilter(filter.id)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              storeFilter === filter.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background hover:bg-accent border-border"
            }`}
          >
            {"originId" in filter && <SupermarketChainBadge originId={filter.originId} variant="logoSmall" />}
            {filter.label}
          </button>
        ))}
      </div>

      <Tabs defaultValue="price-drops">
        <TabsList>
          <TabsTrigger value="price-drops" className="gap-1.5">
            <TrendingDownIcon className="size-3.5" />
            Price Drops
            <Badge variant="secondary" className="ml-1 text-[10px]">
              {filteredDrops.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="discounts" className="gap-1.5">
            <TicketPercentIcon className="size-3.5" />
            Discounts
            <Badge variant="secondary" className="ml-1 text-[10px]">
              {filteredDiscounts.length}
            </Badge>
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

function EmptyDeals() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <TrendingDownIcon className="text-muted-foreground mb-3 size-10" />
      <p className="text-muted-foreground text-sm">No deals found for this filter. Try a different store.</p>
    </div>
  )
}
