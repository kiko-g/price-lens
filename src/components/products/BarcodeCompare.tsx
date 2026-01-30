"use client"

import Link from "next/link"
import Image from "next/image"

import type { StoreProduct } from "@/types"
import { cn } from "@/lib/utils"
import { generateProductPath, discountValueToPercentage } from "@/lib/business/product"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BackButton } from "@/components/ui/combo/back-button"
import { Barcode } from "@/components/ui/combo/barcode"
import { Separator } from "@/components/ui/separator"
import { SupermarketChainBadge } from "@/components/products/SupermarketChainBadge"

import { ArrowUpRightIcon, TrophyIcon, TagIcon } from "lucide-react"

interface BarcodeCompareProps {
  products: StoreProduct[]
  barcode: string
}

function resolveImageUrl(image: string, size = 400) {
  const url = new URL(image)
  const p = url.searchParams
  const fieldsToDelete = ["sm", "w", "h", "sw", "sh"]
  fieldsToDelete.forEach((k) => p.delete(k))
  p.set("sw", String(size))
  p.set("sh", String(size))
  p.set("sm", "fit")
  return url.toString()
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
  const isNormalPrice =
    (!product.price_recommended && product.price) ||
    (product.price_recommended && product.price && product.price_recommended === product.price)
  const isPriceNotSet = !product.price_recommended && !product.price

  return (
    <div
      className={cn(
        "relative flex flex-col overflow-hidden rounded-xl border bg-card",
        isCheapest && "ring-2 ring-green-500 dark:ring-green-400",
      )}
    >
      {isCheapest && (
        <div className="absolute top-0 right-0 z-10">
          <Badge variant="success" size="sm" className="rounded-none rounded-bl-lg">
            <TrophyIcon className="h-3 w-3" />
            Cheapest
          </Badge>
        </div>
      )}

      {/* Store Header */}
      <div className="flex items-center justify-between border-b bg-muted/30 px-3 py-2">
        <SupermarketChainBadge originId={product.origin_id} variant="logo" />
        {product.available === false && (
          <Badge variant="destructive" size="xs">
            Unavailable
          </Badge>
        )}
      </div>

      {/* Product Image */}
      <Link href={generateProductPath(product)} className="relative aspect-square w-full overflow-hidden bg-white">
        {product.image ? (
          <Image
            src={resolveImageUrl(product.image)}
            alt={product.name || "Product"}
            fill
            className="object-contain p-2"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <span className="text-muted-foreground text-sm">No image</span>
          </div>
        )}

        {/* Discount badge */}
        {product.discount ? (
          <div className="absolute top-2 left-2">
            <Badge variant="destructive" size="xs">
              <TagIcon className="h-3 w-3" />-{discountValueToPercentage(product.discount)}
            </Badge>
          </div>
        ) : null}
      </Link>

      {/* Price Section */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        {/* Price */}
        <div className="flex flex-col">
          {hasDiscount ? (
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-green-600 dark:text-green-500">
                {product.price?.toFixed(2)}€
              </span>
              <span className="text-muted-foreground text-sm line-through">{product.price_recommended}€</span>
            </div>
          ) : isNormalPrice ? (
            <span className="text-xl font-bold">{product.price?.toFixed(2)}€</span>
          ) : isPriceNotSet ? (
            <span className="text-muted-foreground text-xl font-bold">--.--€</span>
          ) : null}

          {/* Price per unit */}
          {product.price_per_major_unit && product.major_unit && (
            <span className="text-muted-foreground text-xs">
              {product.price_per_major_unit}€{product.major_unit.startsWith("/") ? product.major_unit : `/${product.major_unit}`}
            </span>
          )}
        </div>

        {/* Pack info */}
        {product.pack && <span className="text-muted-foreground text-xs">{product.pack}</span>}

        {/* Price difference from cheapest */}
        {priceDiff !== null && priceDiff > 0 && (
          <Badge variant="outline" size="xs" className="w-fit">
            +{priceDiff.toFixed(2)}€
          </Badge>
        )}

        {/* Actions */}
        <div className="mt-auto flex gap-2 pt-2">
          <Button asChild variant="default" size="sm" className="flex-1">
            <Link href={generateProductPath(product)}>View details</Link>
          </Button>
          <Button asChild variant="outline" size="icon-sm">
            <Link href={product.url || "#"} target="_blank" rel="noopener noreferrer" title="Open in store">
              <ArrowUpRightIcon className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

export function BarcodeCompare({ products, barcode }: BarcodeCompareProps) {
  const productsWithPrice = products.filter((p) => p.price !== null && p.price !== undefined)
  const cheapestPrice = productsWithPrice.length > 0 ? Math.min(...productsWithPrice.map((p) => p.price!)) : null
  const maxPrice = productsWithPrice.length > 0 ? Math.max(...productsWithPrice.map((p) => p.price!)) : null
  const savings = cheapestPrice !== null && maxPrice !== null ? maxPrice - cheapestPrice : 0

  const firstProduct = products[0]
  const storeCount = new Set(products.map((p) => p.origin_id)).size

  return (
    <div className="mx-auto w-full max-w-7xl">
      {/* Header - similar to product page layout */}
      <div className="mb-6 flex flex-col gap-4">
        <div className="hidden w-min md:flex">
          <BackButton />
        </div>

        <div className="grid gap-6 md:grid-cols-[1fr,auto]">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {firstProduct?.brand && (
                <Badge variant="blue" size="sm">
                  {firstProduct.brand}
                </Badge>
              )}
              <Badge variant="boring" size="xs">
                {storeCount} store{storeCount !== 1 ? "s" : ""} · {products.length} listing{products.length !== 1 ? "s" : ""}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold md:text-3xl">{firstProduct?.name || "Compare Prices"}</h1>
          </div>

          <div className="flex items-start">
            <Barcode value={barcode} height={50} width={2} className="hidden md:flex" />
            <Barcode value={barcode} height={30} width={1.5} className="flex md:hidden" />
          </div>
        </div>
      </div>

      {/* Comparison Grid - responsive columns */}
      <div
        className={cn(
          "grid gap-4",
          products.length === 1 && "grid-cols-1 sm:grid-cols-2 md:max-w-md",
          products.length === 2 && "grid-cols-2 md:grid-cols-2 lg:grid-cols-4",
          products.length === 3 && "grid-cols-2 md:grid-cols-3 lg:grid-cols-3",
          products.length === 4 && "grid-cols-2 md:grid-cols-4",
          products.length >= 5 && "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
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

      {/* Summary */}
      {savings > 0 && (
        <>
          <Separator className="my-6" />
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/30">
            <p className="text-sm">
              <span className="font-semibold text-green-700 dark:text-green-400">
                Save up to {savings.toFixed(2)}€
              </span>{" "}
              by choosing the cheapest option.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
