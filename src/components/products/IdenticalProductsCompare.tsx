"use client"

import Link from "next/link"

import type { StoreProduct } from "@/types"
import { cn } from "@/lib/utils"
import { generateProductPath, discountValueToPercentage } from "@/lib/business/product"
import { useIdenticalStoreProducts } from "@/hooks/useProducts"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { SupermarketChainBadge } from "@/components/products/SupermarketChainBadge"

import { ArrowRightIcon, ScaleIcon, TrophyIcon, CheckIcon, ZapIcon, SearchAlertIcon } from "lucide-react"

interface Props {
  currentProduct: StoreProduct
}

function CompactStoreCard({
  product,
  isCheapest,
  isCurrent,
  priceDiff,
}: {
  product: StoreProduct
  isCheapest: boolean
  isCurrent: boolean
  priceDiff: number | null
}) {
  const hasDiscount = product.price_recommended && product.price && product.price_recommended !== product.price

  return (
    <Link
      href={generateProductPath(product)}
      className={cn(
        "group hover:bg-foreground/10 hover:border-foreground/50 relative flex min-w-[120px] flex-1 flex-col items-center gap-2 rounded-lg border p-3 transition-colors",
        isCheapest && "border-success bg-success/10 dark:border-success/20 dark:bg-success/20",
        isCurrent && !isCheapest && "",
      )}
    >
      {/* Badges */}
      <div className="absolute -top-2 left-1/2 flex -translate-x-1/2 gap-1">
        {isCheapest && (
          <Badge
            size="xs"
            variant="success"
            className="group-hover:bg-foreground group-hover:border-foreground whitespace-nowrap"
          >
            <TrophyIcon className="h-3 w-3" />
            Cheapest
          </Badge>
        )}
        {isCurrent && !isCheapest && (
          <Badge
            size="xs"
            variant="blue"
            className="group-hover:bg-foreground group-hover:border-foreground whitespace-nowrap"
          >
            <CheckIcon className="h-3 w-3" />
            Current
          </Badge>
        )}
      </div>

      {/* Store Logo */}
      <div className="mt-2">
        <span className="flex items-center justify-center rounded-full border bg-white px-1.5 py-0.5">
          <SupermarketChainBadge originId={product.origin_id} variant="logo" />
        </span>
      </div>

      {/* Price */}
      <div className="flex items-center gap-2">
        {product.price !== null && product.price !== undefined ? (
          <>
            <span
              className={cn(
                "text-lg font-bold",
                isCheapest && "text-success",
                hasDiscount && !isCheapest && "text-success",
              )}
            >
              {product.price.toFixed(2)}€
            </span>

            {hasDiscount && (
              <span className="text-muted-foreground text-base line-through">
                {product.price_recommended?.toFixed(2)}€
              </span>
            )}

            {hasDiscount && (
              <Badge variant="destructive" size="xs" className="mt-0.5">
                -{discountValueToPercentage(product.discount!)}
              </Badge>
            )}
          </>
        ) : (
          <span className="text-muted-foreground text-lg font-bold">--€</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Price difference */}
        {priceDiff !== null && priceDiff > 0 && (
          <Badge variant="outline" size="xs">
            +{priceDiff.toFixed(2)}€
          </Badge>
        )}

        {/* Price per unit */}
        {product.price_per_major_unit && product.major_unit && (
          <Badge variant="price-per-unit" size="xs">
            {product.price_per_major_unit}€
            {product.major_unit.startsWith("/") ? product.major_unit : `/${product.major_unit}`}
          </Badge>
        )}
      </div>
    </Link>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="flex gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 min-w-[120px] flex-1 rounded-lg" />
        ))}
      </div>
    </div>
  )
}

export function IdenticalProductsCompare({ currentProduct }: Props) {
  const {
    data: identicalProducts,
    isLoading,
    error,
  } = useIdenticalStoreProducts(currentProduct.id?.toString() || "", 10)

  // Combine current product with identical products for comparison
  const allProducts = identicalProducts ? [currentProduct, ...identicalProducts] : [currentProduct]

  // Find cheapest price
  const productsWithPrice = allProducts.filter((p) => p.price !== null && p.price !== undefined)
  const cheapestPrice = productsWithPrice.length > 0 ? Math.min(...productsWithPrice.map((p) => p.price!)) : null

  // Check if we have a barcode for the compare page link
  const hasBarcode = currentProduct.barcode && currentProduct.barcode.length > 0

  if (error) {
    return (
      <div className="border-destructive/50 bg-destructive/10 rounded-lg border p-4">
        <p className="text-destructive text-sm">Failed to load price comparison. Please try again later.</p>
      </div>
    )
  }

  if (isLoading) {
    return <LoadingSkeleton />
  }

  // No identical products found (only current product)
  if (!identicalProducts || identicalProducts.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <ScaleIcon className="h-5 w-5" />
            Compare Prices
          </h3>
        </div>

        <div className="bg-destructive/10 border-destructive/20 rounded-lg border px-4 py-4 text-center">
          <p className="flex items-center justify-start gap-2 text-sm">
            <SearchAlertIcon className="h-4 w-4" />
            No identical products found in other stores. No price comparison insights available.
          </p>
        </div>
      </div>
    )
  }

  const storeCount = new Set(allProducts.map((p) => p.origin_id)).size

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <ScaleIcon className="h-5 w-5" />
          Compare Prices
          <Badge variant="boring" size="xs">
            {storeCount} store{storeCount !== 1 ? "s" : ""}
          </Badge>
        </h3>

        {hasBarcode && (
          <Button asChild variant="outline" size="sm">
            <Link href={`/compare?barcode=${encodeURIComponent(currentProduct.barcode!)}`}>
              Compare in detail
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>

      {/* Compact comparison cards */}
      <div
        className={cn(
          "grid grid-cols-1 gap-3 sm:grid-cols-2",
          storeCount <= 3 && "md:grid-cols-3",
          storeCount === 4 && "md:grid-cols-4",
          storeCount === 5 && "md:grid-cols-5",
          storeCount >= 6 && "md:grid-cols-6",
        )}
      >
        {allProducts.map((product) => {
          const isCheapest = cheapestPrice !== null && product.price === cheapestPrice
          const isCurrent = product.id === currentProduct.id
          const priceDiff =
            cheapestPrice !== null && product.price !== null && product.price !== undefined
              ? product.price - cheapestPrice
              : null

          return (
            <CompactStoreCard
              key={product.id}
              product={product}
              isCheapest={isCheapest}
              isCurrent={isCurrent}
              priceDiff={priceDiff}
            />
          )
        })}
      </div>

      {/* Savings hint */}
      {cheapestPrice !== null && currentProduct.price !== null && currentProduct.price > cheapestPrice && (
        <p className="text-muted-foreground">
          <ZapIcon className="text-success mr-1 inline-flex h-4 w-4" />
          <span className="text-success font-medium">Save {(currentProduct.price - cheapestPrice).toFixed(2)}€</span> by
          switching to the cheapest option.
        </p>
      )}
    </div>
  )
}
