"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useLocale, useTranslations } from "next-intl"

import type { StoreProduct, Price } from "@/types"
import { isLocale, type Locale } from "@/i18n/config"
import { formatPrice } from "@/lib/i18n/format"
import { EM_DASH, PLUS_SIGN } from "@/lib/i18n/formatting-glyphs"
import { RANGES, DateRange } from "@/types/business"
import { cn } from "@/lib/utils"
import { generateProductPath, formatDiscountPercentWithMinus } from "@/lib/business/product"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BackButton } from "@/components/ui/combo/back-button"
import { Barcode } from "@/components/ui/combo/barcode"
import { NutriScoreBadge } from "@/components/ui/combo/nutri-score"
import { SupermarketChainBadge } from "@/components/products/SupermarketChainBadge"
import { ComparisonChart } from "@/components/products/ComparisonChart"

import { TrophyIcon, TagIcon, Loader2Icon, LinkIcon, TrendingDownIcon, ShieldCheckIcon } from "lucide-react"
import { OpenFoodFactsIcon } from "@/components/icons/OpenFoodFactsIcon"

export interface ProductWithPrices {
  product: StoreProduct
  prices: Price[]
}

const BARCODE_PRICE_PLACEHOLDER = "--.--€"

function majorUnitSuffix(unit: string): string {
  return unit.startsWith("/") ? unit : `/${unit}`
}

function formatPerUnitLine(pricePerUnit: number, unit: string, locale: Locale): string {
  return `${formatPrice(pricePerUnit, locale)}${majorUnitSuffix(unit)}`
}

function formatPackBullet(pack: string): string {
  return `\u00B7 ${pack}`
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
  const t = useTranslations("products.barcodeCompare")
  const localeRaw = useLocale()
  const locale: Locale = isLocale(localeRaw) ? localeRaw : "pt"
  const hasDiscount = product.price_recommended && product.price && product.price_recommended !== product.price
  const perUnitLabel =
    product.price_per_major_unit != null && product.major_unit
      ? formatPerUnitLine(product.price_per_major_unit, product.major_unit, locale)
      : null
  const priceDiffLabel = priceDiff !== null && priceDiff > 0 ? `${PLUS_SIGN}${formatPrice(priceDiff, locale)}` : null

  return (
    <Link
      href={generateProductPath(product)}
      className={cn(
        "bg-card group relative flex flex-col overflow-hidden rounded-xl border transition-colors",
        "hover:border-foreground/20 dark:hover:border-foreground/30",
        isCheapest && "border-success/30 bg-success/5 dark:border-success/40",
      )}
    >
      {isCheapest && (
        <Badge variant="success" size="xs" className="absolute top-0 right-0 z-10 rounded-none rounded-bl-md">
          <TrophyIcon className="h-3 w-3" />
          {t("best")}
        </Badge>
      )}
      {product.available === false && (
        <Badge variant="destructive" size="xs" className="absolute top-0 right-0 z-10 rounded-none rounded-bl-md">
          {t("unavailable")}
        </Badge>
      )}

      <div className="flex items-start gap-3 p-3">
        <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border bg-white sm:size-20">
          {product.image ? (
            <Image
              src={resolveImageUrl(product.image, 500)}
              alt={product.name || ""}
              fill
              className="object-contain p-1"
              sizes="80px"
            />
          ) : (
            <div className="bg-muted text-muted-foreground flex h-full w-full items-center justify-center text-[10px]">
              {t("naShort")}
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1.5">
          <SupermarketChainBadge originId={product.origin_id} variant="logoSmall" />

          {product.name && <p className="text-muted-foreground line-clamp-1 text-xs leading-tight">{product.name}</p>}

          <div className="flex items-baseline gap-2">
            {hasDiscount ? (
              <>
                <span className={cn("text-xl font-bold", isCheapest && "text-success")}>
                  {product.price != null ? formatPrice(product.price, locale) : EM_DASH}
                </span>
                <span className="text-muted-foreground text-sm line-through">
                  {product.price_recommended != null ? formatPrice(Number(product.price_recommended), locale) : EM_DASH}
                </span>
                {product.discount && (
                  <Badge variant="discount" size="xs">
                    <TagIcon className="h-2.5 w-2.5" />
                    {formatDiscountPercentWithMinus(product.discount)}
                  </Badge>
                )}
              </>
            ) : product.price ? (
              <span className={cn("text-xl font-bold", isCheapest && "text-success")}>
                {formatPrice(product.price, locale)}
              </span>
            ) : (
              <span className="text-muted-foreground text-xl font-bold">{BARCODE_PRICE_PLACEHOLDER}</span>
            )}
          </div>

          <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
            {perUnitLabel && <span>{perUnitLabel}</span>}
            {product.pack && <span>{formatPackBullet(product.pack)}</span>}
            {priceDiffLabel && (
              <Badge variant="retail" size="xs">
                {priceDiffLabel}
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1">
            {insights.isHistoricalLow && (
              <Badge variant="success" size="xs" className="gap-0.5">
                <TrendingDownIcon className="h-2.5 w-2.5" />
                {t("lowestEver")}
              </Badge>
            )}
            {insights.stableDays !== null && (
              <Badge variant="secondary" size="xs" className="gap-0.5">
                <ShieldCheckIcon className="h-2.5 w-2.5" />
                {t("stableDays", { count: insights.stableDays })}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

interface OffData {
  imageUrl?: string | null
  nutriscoreGrade?: string | null
  quantity?: string | null
  categories?: string | null
}

function ProductInfoSection({ barcode }: { barcode: string }) {
  const [offData, setOffData] = useState<OffData | null>(null)
  const [loading, setLoading] = useState(true)
  const t = useTranslations("products.barcodeCompare")

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(
          `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=product_name,brands,quantity,categories,image_front_small_url,nutriscore_grade`,
        )
        if (res.ok && !cancelled) {
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
        // silently ignore
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [barcode])

  if (loading) {
    return (
      <div className="bg-card flex items-center gap-2 rounded-lg border px-3 py-3">
        <Loader2Icon className="text-muted-foreground h-4 w-4 animate-spin" />
        <span className="text-muted-foreground text-xs">{t("loadingInfo")}</span>
      </div>
    )
  }

  if (!offData) return null

  const categories = offData.categories
    ?.split(",")
    .map((c) => c.trim())
    .filter(Boolean)
    .slice(0, 5)

  const validGrade = offData.nutriscoreGrade?.toUpperCase()
  const isValidNutriGrade = validGrade && ["A", "B", "C", "D", "E"].includes(validGrade)

  return (
    <div className="bg-card rounded-lg border">
      <div className="border-b px-3 py-2.5">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold">
          <OpenFoodFactsIcon className="h-3.5 w-3.5" />
          {t("productInformation")}
        </h3>
      </div>
      <div className="flex flex-wrap items-center gap-4 px-3 py-3">
        {offData.imageUrl && (
          <Image
            src={offData.imageUrl}
            alt=""
            width={80}
            height={80}
            className="size-20 shrink-0 rounded-lg border object-contain p-1"
            unoptimized
          />
        )}

        {isValidNutriGrade && (
          <NutriScoreBadge grade={validGrade as "A" | "B" | "C" | "D" | "E"} showNewCalculation={false} size={0.65} />
        )}

        {offData.quantity && (
          <Badge variant="secondary" className="gap-1">
            <TagIcon className="h-3 w-3" />
            {offData.quantity}
          </Badge>
        )}

        {categories && categories.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map((cat) => (
              <Badge key={cat} variant="secondary" className="text-xs font-normal">
                {cat}
              </Badge>
            ))}
          </div>
        )}
      </div>
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
  const t = useTranslations("products.barcodeCompare")
  const localeRaw = useLocale()
  const locale: Locale = isLocale(localeRaw) ? localeRaw : "pt"
  const rows = useMemo(() => {
    return products.map((product) => {
      const pwp = productsWithPrices.find((p) => p.product.id === product.id)
      const validPrices = (pwp?.prices ?? []).map((p) => p.price).filter((p): p is number => p !== null && p > 0)
      const historicalLow = validPrices.length > 0 ? Math.min(...validPrices) : null

      return {
        product,
        historicalLow,
        isCheapest: cheapestPrice !== null && product.price === cheapestPrice,
      }
    })
  }, [products, productsWithPrices, cheapestPrice])

  return (
    <div className="bg-card overflow-hidden rounded-lg border">
      <div className="border-b px-3 py-2.5">
        <h3 className="text-sm font-semibold">{t("priceComparison")}</h3>
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b">
              <th className="px-3 py-2 text-left text-xs font-medium">{t("table.store")}</th>
              <th className="px-3 py-2 text-right text-xs font-medium">{t("table.price")}</th>
              <th className="px-3 py-2 text-right text-xs font-medium">{t("table.recommended")}</th>
              <th className="px-3 py-2 text-right text-xs font-medium">{t("table.perUnit")}</th>
              <th className="px-3 py-2 text-right text-xs font-medium">{t("table.lowest")}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map(({ product, historicalLow, isCheapest }) => {
              const perUnitCell =
                product.price_per_major_unit != null && product.major_unit
                  ? formatPerUnitLine(product.price_per_major_unit, product.major_unit, locale)
                  : EM_DASH
              return (
                <tr key={product.id} className={cn(isCheapest && "bg-success/5")}>
                  <td className="px-3 py-2.5">
                    <SupermarketChainBadge originId={product.origin_id} variant="logoSmall" />
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    <span className={cn("font-semibold", isCheapest && "text-success")}>
                      {product.price != null ? formatPrice(product.price, locale) : EM_DASH}
                    </span>
                    {isCheapest && <TrophyIcon className="text-success ml-1 inline h-3 w-3" />}
                  </td>
                  <td
                    className={cn(
                      "px-3 py-2.5 text-right tabular-nums",
                      product.price_recommended !== product.price && "text-muted-foreground line-through",
                    )}
                  >
                    {product.price_recommended != null
                      ? formatPrice(Number(product.price_recommended), locale)
                      : EM_DASH}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{perUnitCell}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    {historicalLow !== null ? formatPrice(historicalLow, locale) : EM_DASH}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile list */}
      <div className="divide-y sm:hidden">
        {rows.map(({ product, historicalLow, isCheapest }) => {
          const mobilePerUnit =
            product.price_per_major_unit != null && product.major_unit
              ? formatPerUnitLine(product.price_per_major_unit, product.major_unit, locale)
              : null
          return (
            <div key={product.id} className={cn("flex items-center gap-3 px-3 py-3", isCheapest && "bg-success/5")}>
              <div className="w-14 shrink-0">
                <SupermarketChainBadge originId={product.origin_id} variant="logoSmall" />
              </div>
              <div className="flex flex-1 items-center justify-between gap-2">
                <div>
                  <span className={cn("text-base font-semibold tabular-nums", isCheapest && "text-success")}>
                    {product.price != null ? formatPrice(product.price, locale) : EM_DASH}
                  </span>
                  {isCheapest && <TrophyIcon className="text-success ml-1 inline h-3 w-3" />}
                  {mobilePerUnit && (
                    <span className="text-muted-foreground ml-2 text-xs tabular-nums">{mobilePerUnit}</span>
                  )}
                </div>
                {historicalLow !== null && (
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {t("lowShort", { value: formatPrice(historicalLow, locale) })}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────

export function BarcodeCompare({ products, productsWithPrices, barcode, barcodes: barcodesProp }: BarcodeCompareProps) {
  const [selectedRange, setSelectedRange] = useState<DateRange>("1M")
  const t = useTranslations("products.barcodeCompare")

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
                {t("storesAndListings", { stores: storeCount, listings: products.length })}
              </Badge>
              {isMultiBarcode && (
                <Badge variant="secondary" size="xs" className="gap-1">
                  <LinkIcon className="h-3 w-3" />
                  {t("barcodesCount", { count: uniqueBarcodes.length })}
                </Badge>
              )}
            </div>
            <h1 className="text-xl font-bold md:text-2xl">{firstProduct?.name || t("comparePricesTitle")}</h1>
          </div>

          {barcode && <Barcode value={barcode} height={40} width={1.5} className="hidden sm:flex" />}
        </div>

        {savings > 0 && (
          <div className="border-success/30 bg-success/5 dark:border-success/40 dark:bg-success/5 rounded-lg border px-3 py-2">
            <p className="text-sm">
              {t.rich("saveUpTo", {
                amount: savings.toFixed(2),
                highlight: (chunks) => <span className="text-success font-semibold">{chunks}</span>,
              })}
            </p>
          </div>
        )}
      </div>

      {/* Store Cards Grid */}
      <div
        className={cn(
          "mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2",
          products.length === 2 && "md:grid-cols-2",
          products.length >= 3 && "md:grid-cols-3",
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

      {/* Price History section */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold">{t("priceHistory")}</h2>
        <SharedRangeSelector selectedRange={selectedRange} onRangeChange={setSelectedRange} />
      </div>

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

      {barcode && (
        <div className="mt-4">
          <ProductInfoSection barcode={barcode} />
        </div>
      )}
    </div>
  )
}
