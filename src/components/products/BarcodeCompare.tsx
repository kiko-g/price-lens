"use client"

import { useState } from "react"
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
import { SupermarketChainBadge } from "@/components/products/SupermarketChainBadge"
import { ComparisonChart } from "@/components/products/ComparisonChart"

import { ArrowUpRightIcon, TrophyIcon, TagIcon, Loader2Icon } from "lucide-react"

export interface ProductWithPrices {
  product: StoreProduct
  prices: Price[]
}

interface BarcodeCompareProps {
  products: StoreProduct[]
  productsWithPrices: ProductWithPrices[]
  barcode: string
}

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
}: {
  product: StoreProduct
  isCheapest: boolean
  priceDiff: number | null
}) {
  const hasDiscount = product.price_recommended && product.price && product.price_recommended !== product.price

  return (
    <div
      className={cn(
        "bg-card relative flex flex-col overflow-hidden rounded-xl border",
        isCheapest && "border-success/30 bg-success/5 dark:border-success/40",
      )}
    >
      {/* Compact Header: Thumbnail + Store + Price */}
      <div className="flex items-start gap-2 p-2.5">
        {/* Tiny thumbnail */}
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

        {/* Store + Price */}
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
        </div>
      </div>

      {/* Compact Actions */}
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

export function BarcodeCompare({ products, productsWithPrices, barcode }: BarcodeCompareProps) {
  const [selectedRange, setSelectedRange] = useState<DateRange>("1M")

  const productsWithPrice = products.filter((p) => p.price !== null && p.price !== undefined)
  const cheapestPrice = productsWithPrice.length > 0 ? Math.min(...productsWithPrice.map((p) => p.price!)) : null
  const maxPrice = productsWithPrice.length > 0 ? Math.max(...productsWithPrice.map((p) => p.price!)) : null
  const savings = cheapestPrice !== null && maxPrice !== null ? maxPrice - cheapestPrice : 0

  const firstProduct = products[0]
  const storeCount = new Set(products.map((p) => p.origin_id)).size

  return (
    <div className="mx-auto w-full max-w-7xl">
      {/* Compact Header */}
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
            </div>
            <h1 className="text-xl font-bold md:text-2xl">{firstProduct?.name || "Compare Prices"}</h1>
          </div>

          <Barcode value={barcode} height={40} width={1.5} className="hidden sm:flex" />
        </div>

        {/* Savings callout - prominent */}
        {savings > 0 && (
          <div className="border-success/30 bg-success/5 dark:border-success/40 dark:bg-success/5 rounded-lg border px-3 py-2">
            <p className="text-sm">
              <span className="text-success font-semibold">Save up to {savings.toFixed(2)}€</span> by choosing the
              cheapest option
            </p>
          </div>
        )}
      </div>

      {/* Store Cards Grid - compact, no charts */}
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

          return <CompareCard key={product.id} product={product} isCheapest={isCheapest} priceDiff={priceDiff} />
        })}
      </div>

      {/* Range Selector */}
      <div className="bg-muted/20 mb-4 flex items-center gap-2 rounded-lg border p-2">
        <SharedRangeSelector selectedRange={selectedRange} onRangeChange={setSelectedRange} />
      </div>

      {/* Joint Comparison Chart */}
      <ComparisonChart productsWithPrices={productsWithPrices} selectedRange={selectedRange} />
    </div>
  )
}
