"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"

import type { StoreProduct, Price } from "@/types"
import { RANGES, DateRange } from "@/types/business"
import { cn } from "@/lib/utils"
import { generateProductPath, discountValueToPercentage } from "@/lib/business/product"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BackButton } from "@/components/ui/combo/back-button"
import { Barcode } from "@/components/ui/combo/barcode"
import { NutriScoreBadge } from "@/components/ui/combo/nutri-score"
import { SupermarketChainBadge } from "@/components/products/SupermarketChainBadge"
import { ComparisonChart } from "@/components/products/ComparisonChart"

import {
  ArrowUpRightIcon,
  TrophyIcon,
  TagIcon,
  Loader2Icon,
  LinkIcon,
  ChevronDownIcon,
  TrendingDownIcon,
  BarChart3Icon,
  ShieldCheckIcon,
  LayersIcon,
  InfoIcon,
} from "lucide-react"

export interface ProductWithPrices {
  product: StoreProduct
  prices: Price[]
}

interface BarcodeCompareProps {
  products: StoreProduct[]
  productsWithPrices: ProductWithPrices[]
  barcode: string
  barcodes?: string[]
}

// ─── Helpers ─────────────────────────────────────────────────────────

function resolveImageUrl(image: string, size = 80) {
  const url = new URL(image)
  const p = url.searchParams
  const fieldsToDelete = ["sm", "w", "h", "sw", "sh"]
  fieldsToDelete.forEach((k) => p.delete(k))
  p.set("sw", String(size))
  p.set("sh", String(size))
  p.set("sm", "fit")
  return url.toString()
}

interface DealInsights {
  isHistoricalLow: boolean
  belowAveragePct: number | null
  stableDays: number | null
}

function computeDealInsights(product: StoreProduct, prices: Price[]): DealInsights {
  const validPrices = prices.map((p) => p.price).filter((p): p is number => p !== null && p > 0)

  if (validPrices.length === 0 || !product.price) {
    return { isHistoricalLow: false, belowAveragePct: null, stableDays: null }
  }

  const historicalLow = Math.min(...validPrices)
  const isHistoricalLow = product.price <= historicalLow && validPrices.length > 1

  const avg = validPrices.reduce((sum, p) => sum + p, 0) / validPrices.length
  const belowAveragePct = product.price < avg ? Math.round(((avg - product.price) / avg) * 100) : null

  let stableDays: number | null = null
  if (prices.length >= 2) {
    const sorted = [...prices].sort(
      (a, b) => new Date(b.valid_from || 0).getTime() - new Date(a.valid_from || 0).getTime(),
    )
    const latest = sorted[0]
    if (latest?.valid_from) {
      stableDays = Math.floor((Date.now() - new Date(latest.valid_from).getTime()) / (1000 * 60 * 60 * 24))
    }
  }

  return { isHistoricalLow, belowAveragePct, stableDays: stableDays && stableDays >= 30 ? stableDays : null }
}

// ─── Sub-components ──────────────────────────────────────────────────

function SharedRangeSelector({
  selectedRange,
  onRangeChange,
  isLoading,
}: {
  selectedRange: DateRange
  onRangeChange: (range: DateRange) => void
  isLoading?: boolean
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {RANGES.map((range) => (
        <Button
          key={range}
          variant={range === selectedRange ? "default" : "ghost"}
          onClick={() => onRangeChange(range)}
          className="size-8 px-2 text-xs"
        >
          {range}
        </Button>
      ))}
      {isLoading && <Loader2Icon className="text-muted-foreground ml-2 h-4 w-4 animate-spin" />}
    </div>
  )
}

function CompareCard({
  product,
  isCheapest,
  priceDiff,
  insights,
}: {
  product: StoreProduct
  isCheapest: boolean
  priceDiff: number | null
  insights: DealInsights
}) {
  const hasDiscount = product.price_recommended && product.price && product.price_recommended !== product.price

  return (
    <div
      className={cn(
        "bg-card relative flex flex-col overflow-hidden rounded-xl border",
        isCheapest && "border-success/30 bg-success/5 dark:border-success/40",
      )}
    >
      <div className="flex items-start gap-2 p-2.5">
        <Link
          href={generateProductPath(product)}
          className="relative size-20 shrink-0 overflow-hidden rounded-lg border bg-white"
        >
          {product.image ? (
            <Image
              src={resolveImageUrl(product.image, 500)}
              alt={product.name || "Product"}
              fill
              className="object-contain p-1"
              sizes="48px"
            />
          ) : (
            <div className="bg-muted text-muted-foreground flex h-full w-full items-center justify-center text-[10px]">
              N/A
            </div>
          )}
        </Link>

        <div className="flex flex-1 flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center rounded-full border bg-white px-1.5 py-0.5">
              <SupermarketChainBadge originId={product.origin_id} variant="logo" />
            </span>

            {isCheapest && (
              <Badge variant="success" size="xs" className="absolute top-0 right-0 rounded-none rounded-bl-md">
                <TrophyIcon className="h-3 w-3" />
                Best
              </Badge>
            )}
            {product.available === false && (
              <Badge variant="destructive" size="xs">
                Out
              </Badge>
            )}
          </div>

          {product.name && (
            <p className="text-muted-foreground line-clamp-1 text-xs">{product.name}</p>
          )}

          <div className="flex items-baseline gap-2">
            {hasDiscount ? (
              <>
                <span className={cn("text-lg font-bold", isCheapest && "text-success")}>
                  {product.price?.toFixed(2)}€
                </span>
                <span className="text-muted-foreground text-sm line-through">{product.price_recommended}€</span>
                {product.discount && (
                  <Badge variant="destructive" size="xs">
                    <TagIcon className="h-2.5 w-2.5" />-{discountValueToPercentage(product.discount)}
                  </Badge>
                )}
              </>
            ) : product.price ? (
              <span className="text-lg font-bold">{product.price?.toFixed(2)}€</span>
            ) : (
              <span className="text-muted-foreground text-lg font-bold">--.--€</span>
            )}
          </div>

          <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
            {product.price_per_major_unit && product.major_unit && (
              <span>
                {product.price_per_major_unit}€
                {product.major_unit.startsWith("/") ? product.major_unit : `/${product.major_unit}`}
              </span>
            )}
            {product.pack && <span>· {product.pack}</span>}
            {priceDiff !== null && priceDiff > 0 && (
              <Badge variant="retail" size="xs">
                +{priceDiff.toFixed(2)}€
              </Badge>
            )}
          </div>

          {/* Deal insight badges */}
          <div className="flex flex-wrap items-center gap-1">
            {insights.isHistoricalLow && (
              <Badge variant="success" size="xs" className="gap-0.5">
                <TrendingDownIcon className="h-2.5 w-2.5" />
                Historical low
              </Badge>
            )}
            {insights.belowAveragePct !== null && insights.belowAveragePct > 0 && (
              <Badge variant="success" size="xs" className="gap-0.5">
                <BarChart3Icon className="h-2.5 w-2.5" />
                {insights.belowAveragePct}% below avg
              </Badge>
            )}
            {insights.stableDays !== null && (
              <Badge variant="secondary" size="xs" className="gap-0.5">
                <ShieldCheckIcon className="h-2.5 w-2.5" />
                Stable {insights.stableDays}d
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div
        className={cn(
          "flex items-center justify-end gap-2 border-t p-2",
          isCheapest && "border-success/30 dark:border-success/40",
        )}
      >
        <Button asChild variant="outline" size="sm" className="h-8 bg-white text-xs dark:bg-white/10">
          <Link href={generateProductPath(product)}>View details</Link>
        </Button>

        <Button asChild variant="outline" size="icon-sm" className="h-8 w-8">
          <Link href={product.url || "#"} target="_blank" rel="noopener noreferrer" title="Open in store">
            <ArrowUpRightIcon className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}

interface OffData {
  imageUrl?: string | null
  nutriscoreGrade?: string | null
  quantity?: string | null
  categories?: string | null
}

function OffEnrichmentSection({ barcode }: { barcode: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [offData, setOffData] = useState<OffData | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetched, setFetched] = useState(false)

  const handleToggle = async () => {
    const next = !isOpen
    setIsOpen(next)

    if (next && !fetched) {
      setLoading(true)
      setFetched(true)
      try {
        const res = await fetch(
          `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=product_name,brands,quantity,categories,image_front_small_url,nutriscore_grade`,
        )
        if (res.ok) {
          const json = await res.json()
          if (json.status === 1 && json.product) {
            const p = json.product
            setOffData({
              imageUrl: p.image_front_small_url || null,
              nutriscoreGrade: p.nutriscore_grade || null,
              quantity: p.quantity || null,
              categories: p.categories || null,
            })
          }
        }
      } catch {
        // OFF unavailable — silently ignore
      } finally {
        setLoading(false)
      }
    }
  }

  const categories = offData?.categories
    ?.split(",")
    .map((c) => c.trim())
    .filter(Boolean)
    .slice(0, 5)

  const validGrade = offData?.nutriscoreGrade?.toUpperCase()
  const isValidNutriGrade = validGrade && ["A", "B", "C", "D", "E"].includes(validGrade)

  return (
    <div className="bg-card rounded-lg border">
      <button
        onClick={handleToggle}
        className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium"
      >
        <span className="flex items-center gap-2">
          <InfoIcon className="text-muted-foreground h-4 w-4" />
          Product Details (Open Food Facts)
        </span>
        <ChevronDownIcon className={cn("text-muted-foreground h-4 w-4 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="flex flex-wrap items-center gap-4 border-t px-3 py-3">
          {loading && <Loader2Icon className="text-muted-foreground h-5 w-5 animate-spin" />}

          {!loading && !offData && fetched && (
            <p className="text-muted-foreground text-xs">No data found on Open Food Facts for this barcode.</p>
          )}

          {offData && (
            <>
              {offData.imageUrl && (
                <Image
                  src={offData.imageUrl}
                  alt="Product"
                  width={56}
                  height={56}
                  className="shrink-0 rounded-lg object-contain"
                  unoptimized
                />
              )}

              {isValidNutriGrade && (
                <NutriScoreBadge
                  grade={validGrade as "A" | "B" | "C" | "D" | "E"}
                  showNewCalculation={false}
                  size={0.65}
                />
              )}

              {offData.quantity && (
                <Badge variant="secondary" className="gap-1">
                  <TagIcon className="h-3 w-3" />
                  {offData.quantity}
                </Badge>
              )}

              {categories && categories.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <LayersIcon className="text-muted-foreground h-3.5 w-3.5" />
                  {categories.map((cat) => (
                    <Badge key={cat} variant="secondary" className="text-xs font-normal">
                      {cat}
                    </Badge>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

function StoreComparisonTable({
  products,
  productsWithPrices,
  cheapestPrice,
}: {
  products: StoreProduct[]
  productsWithPrices: ProductWithPrices[]
  cheapestPrice: number | null
}) {
  const rows = useMemo(() => {
    return products.map((product) => {
      const pwp = productsWithPrices.find((p) => p.product.id === product.id)
      const validPrices = (pwp?.prices ?? []).map((p) => p.price).filter((p): p is number => p !== null && p > 0)
      const historicalLow = validPrices.length > 0 ? Math.min(...validPrices) : null

      return {
        product,
        historicalLow,
        dataPoints: pwp?.prices.length ?? 0,
        isCheapest: cheapestPrice !== null && product.price === cheapestPrice,
      }
    })
  }, [products, productsWithPrices, cheapestPrice])

  return (
    <div className="bg-card overflow-hidden rounded-lg border">
      <div className="border-b px-3 py-2">
        <h3 className="text-sm font-semibold">Price Comparison</h3>
      </div>
      <div className="divide-y">
        {rows.map(({ product, historicalLow, dataPoints, isCheapest }) => (
          <div key={product.id} className={cn("flex items-center gap-3 px-3 py-2", isCheapest && "bg-success/5")}>
            <div className="flex w-16 shrink-0 items-center justify-center">
              <SupermarketChainBadge originId={product.origin_id} variant="logoSmall" />
            </div>

            <div className="grid flex-1 grid-cols-2 gap-x-3 gap-y-0.5 text-xs sm:grid-cols-4">
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase">Price</span>
                <span className={cn("font-semibold", isCheapest && "text-success")}>
                  {product.price ? `${product.price.toFixed(2)}€` : "—"}
                </span>
                {isCheapest && <TrophyIcon className="text-success ml-1 inline h-3 w-3" />}
              </div>

              <div>
                <span className="text-muted-foreground block text-[10px] uppercase">Recommended</span>
                <span className={cn(product.price_recommended !== product.price && "text-muted-foreground line-through")}>
                  {product.price_recommended ? `${product.price_recommended.toFixed(2)}€` : "—"}
                </span>
              </div>

              <div>
                <span className="text-muted-foreground block text-[10px] uppercase">Per unit</span>
                <span>
                  {product.price_per_major_unit && product.major_unit
                    ? `${product.price_per_major_unit}€${product.major_unit.startsWith("/") ? product.major_unit : `/${product.major_unit}`}`
                    : "—"}
                </span>
              </div>

              <div>
                <span className="text-muted-foreground block text-[10px] uppercase">Hist. low</span>
                <span>{historicalLow !== null ? `${historicalLow.toFixed(2)}€` : "—"}</span>
                <span className="text-muted-foreground ml-1">({dataPoints} pts)</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────

export function BarcodeCompare({
  products,
  productsWithPrices,
  barcode,
  barcodes: barcodesProp,
}: BarcodeCompareProps) {
  const [selectedRange, setSelectedRange] = useState<DateRange>("1M")

  const productsWithPrice = products.filter((p) => p.price !== null && p.price !== undefined)
  const cheapestPrice = productsWithPrice.length > 0 ? Math.min(...productsWithPrice.map((p) => p.price!)) : null
  const maxPrice = productsWithPrice.length > 0 ? Math.max(...productsWithPrice.map((p) => p.price!)) : null
  const savings = cheapestPrice !== null && maxPrice !== null ? maxPrice - cheapestPrice : 0

  const firstProduct = products[0]
  const storeCount = new Set(products.map((p) => p.origin_id)).size
  const uniqueBarcodes = barcodesProp ?? ([...new Set(products.map((p) => p.barcode).filter(Boolean))] as string[])
  const isMultiBarcode = uniqueBarcodes.length > 1

  const insightsMap = useMemo(() => {
    const map = new Map<number, DealInsights>()
    for (const { product, prices } of productsWithPrices) {
      if (product.id) {
        map.set(product.id, computeDealInsights(product, prices))
      }
    }
    return map
  }, [productsWithPrices])

  return (
    <div className="mx-auto w-full max-w-7xl">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-3">
        <div className="hidden w-min md:flex">
          <BackButton />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              {firstProduct?.brand && (
                <Badge variant="blue" size="sm">
                  {firstProduct.brand}
                </Badge>
              )}
              <Badge variant="boring" size="xs">
                {storeCount} store{storeCount !== 1 ? "s" : ""} · {products.length} listing
                {products.length !== 1 ? "s" : ""}
              </Badge>
              {isMultiBarcode && (
                <Badge variant="secondary" size="xs" className="gap-1">
                  <LinkIcon className="h-3 w-3" />
                  {uniqueBarcodes.length} barcodes
                </Badge>
              )}
            </div>
            <h1 className="text-xl font-bold md:text-2xl">{firstProduct?.name || "Compare Prices"}</h1>
          </div>

          {isMultiBarcode ? (
            <div className="hidden flex-col gap-1 sm:flex">
              {uniqueBarcodes.map((b) => (
                <span key={b} className="bg-muted rounded px-2 py-0.5 font-mono text-xs">
                  {b}
                </span>
              ))}
            </div>
          ) : (
            <Barcode value={barcode} height={40} width={1.5} className="hidden sm:flex" />
          )}
        </div>

        {savings > 0 && (
          <div className="border-success/30 bg-success/5 dark:border-success/40 dark:bg-success/5 rounded-lg border px-3 py-2">
            <p className="text-sm">
              <span className="text-success font-semibold">Save up to {savings.toFixed(2)}€</span> by choosing the
              cheapest option
            </p>
          </div>
        )}
      </div>

      {/* Store Cards Grid */}
      <div
        className={cn(
          "mb-4 grid gap-3",
          "grid grid-cols-1 gap-3 sm:grid-cols-2",
          products.length <= 3 && "md:grid-cols-3",
          products.length === 4 && "md:grid-cols-4",
          products.length === 5 && "md:grid-cols-5",
          products.length >= 6 && "md:grid-cols-6",
        )}
      >
        {products.map((product) => {
          const isCheapest = cheapestPrice !== null && product.price === cheapestPrice
          const priceDiff =
            cheapestPrice !== null && product.price !== null && product.price !== undefined
              ? product.price - cheapestPrice
              : null
          const insights = (product.id ? insightsMap.get(product.id) : undefined) ?? {
            isHistoricalLow: false,
            belowAveragePct: null,
            stableDays: null,
          }

          return (
            <CompareCard
              key={product.id}
              product={product}
              isCheapest={isCheapest}
              priceDiff={priceDiff}
              insights={insights}
            />
          )
        })}
      </div>

      {/* Range Selector */}
      <div className="bg-muted/20 mb-4 flex items-center gap-2 rounded-lg border p-2">
        <SharedRangeSelector selectedRange={selectedRange} onRangeChange={setSelectedRange} />
      </div>

      {/* Chart + Price Comparison Table — side by side on desktop */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <ComparisonChart productsWithPrices={productsWithPrices} selectedRange={selectedRange} />
        </div>
        <div className="xl:col-span-2">
          <StoreComparisonTable
            products={products}
            productsWithPrices={productsWithPrices}
            cheapestPrice={cheapestPrice}
          />
        </div>
      </div>

      {/* OFF Enrichment — lazy-loaded on expand */}
      <div className="mt-4">
        <OffEnrichmentSection barcode={barcode} />
      </div>
    </div>
  )
}
