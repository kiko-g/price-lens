"use client"

import Link from "next/link"

import type { StoreProduct } from "@/types"
import { cn } from "@/lib/utils"
import { generateProductPath, discountValueToPercentage } from "@/lib/business/product"
import { useIdenticalStoreProducts } from "@/hooks/useProducts"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { SupermarketChainBadge } from "@/components/products/SupermarketChainBadge"

import { ArrowRightIcon, ScaleIcon, TrophyIcon, MapPinIcon, ZapIcon, SmilePlusIcon, SearchXIcon } from "lucide-react"

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
        "group hover:border-foreground/20 dark:hover:border-foreground/30 relative flex min-w-[120px] flex-1 flex-col items-center gap-2 overflow-hidden rounded-lg border p-3 transition-all hover:shadow-md",
        isCheapest &&
          "border-success/40 bg-success/5 shadow-success/30 dark:border-success/50 dark:bg-success/10 dark:shadow-success/40 shadow-[0_0_14px_-2px] dark:shadow-[0_0_20px_-2px]",
      )}
    >
      {/* Badge */}
      {isCheapest && (
        <Badge
          size="xs"
          variant="success"
          className="absolute top-0 right-0 rounded-none rounded-bl-md whitespace-nowrap"
        >
          <TrophyIcon className="h-3 w-3" />
          Cheapest
        </Badge>
      )}
      {isCurrent && !isCheapest && (
        <Badge size="xs" variant="blue" className="absolute top-0 right-0 rounded-none rounded-bl-md whitespace-nowrap">
          <MapPinIcon className="h-3 w-3" />
          This page
        </Badge>
      )}

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
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="mb-2 flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>

      {/* Savings hint */}
      <div className="mb-3">
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Compact comparison cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-3">
            <div className="mb-2 flex items-center gap-2">
              <Skeleton className="h-6 w-6 rounded" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="mb-2 h-4 w-full" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-4 w-12 rounded-full" />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Skeleton className="h-4 w-12 rounded-full" />
              <Skeleton className="h-4 w-16 rounded-full" />
            </div>
          </div>
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

  // Find cheapest price (only mark as "cheapest" if a single product holds the lowest price)
  const productsWithPrice = allProducts.filter((p) => p.price !== null && p.price !== undefined)
  const cheapestPrice = productsWithPrice.length > 0 ? Math.min(...productsWithPrice.map((p) => p.price!)) : null
  const hasUniqueCheapest = productsWithPrice.filter((p) => p.price === cheapestPrice).length === 1

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

        <Empty className="border-border bg-muted/30 border py-10">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchXIcon className="size-5" />
            </EmptyMedia>
            <EmptyTitle>No price comparisons available</EmptyTitle>
            <EmptyDescription>
              We couldn{"'"}t find this product listed at other stores right now. Check back later as availability
              updates regularly.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    )
  }

  const storeCount = new Set(allProducts.map((p) => p.origin_id)).size

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold">
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

      {/* Savings hint */}
      {cheapestPrice !== null && currentProduct.price !== null && currentProduct.price > cheapestPrice ? (
        <p className="text-muted-foreground mb-3">
          <ZapIcon className="text-success mr-1 inline-flex h-4 w-4" />
          <span className="text-success font-medium">Save {(currentProduct.price - cheapestPrice).toFixed(2)}€</span> by
          switching to the cheapest option.
        </p>
      ) : hasUniqueCheapest ? (
        <p className="text-muted-foreground mb-3">
          <SmilePlusIcon className="text-success mr-1 inline-flex h-4 w-4" />
          <span className="text-success font-medium">You are already viewing</span> the cheapest option.
        </p>
      ) : (
        <p className="text-muted-foreground mb-3">
          <ScaleIcon className="text-muted-foreground mr-1 inline-flex h-4 w-4" />
          All stores have the same price. You&apos;re not missing out on deals.
        </p>
      )}

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
          const isCheapest = hasUniqueCheapest && cheapestPrice !== null && product.price === cheapestPrice
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
    </div>
  )
}
