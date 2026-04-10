"use client"

import Link from "next/link"

import type { StoreProduct } from "@/types"
import { cn } from "@/lib/utils"
import { generateProductPath, discountValueToPercentage } from "@/lib/business/product"
import { useIdenticalStoreProducts } from "@/hooks/useProducts"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ErrorStateView, EmptyStateView } from "@/components/ui/combo/state-views"
import { SupermarketChainBadge, getSupermarketChainName } from "@/components/products/SupermarketChainBadge"

import { ArrowRightIcon, ScaleIcon, TrophyIcon, MapPinIcon, ZapIcon, SmilePlusIcon } from "lucide-react"

interface Props {
  currentProduct: StoreProduct
}

/** Normalize scraped unit strings (e.g. lt/Lt/l) for consistent display. */
function formatMajorUnitSuffix(majorUnit: string): string {
  const raw = majorUnit.trim().replace(/^\//, "")
  const lower = raw.toLowerCase()
  if (lower === "lt" || lower === "l") return "l"
  return raw
}

function CompactStoreCard({
  product,
  atLowestPriceTier,
  hasUniqueCheapest,
  hasPriceSpread,
  isCurrent,
  priceDiff,
  duplicateChain,
}: {
  product: StoreProduct
  atLowestPriceTier: boolean
  hasUniqueCheapest: boolean
  hasPriceSpread: boolean
  isCurrent: boolean
  priceDiff: number | null
  duplicateChain: boolean
}) {
  const hasDiscount = product.price_recommended && product.price && product.price_recommended !== product.price
  const showFloorHighlight = atLowestPriceTier && hasPriceSpread

  const chainLabel = getSupermarketChainName(product.origin_id) ?? "Store"
  const priceLabel =
    product.price !== null && product.price !== undefined ? `${product.price.toFixed(2)} euros` : "price unknown"

  return (
    <Link
      href={generateProductPath(product)}
      aria-label={`${chainLabel}, ${priceLabel}. Open product page.`}
      className={cn(
        "group hover:border-foreground/20 dark:hover:border-foreground/30 flex min-h-[3.75rem] flex-row items-center gap-3 overflow-hidden rounded-lg border p-3 transition-all hover:shadow-md sm:gap-4",
        showFloorHighlight &&
          "border-success/40 bg-success/5 shadow-success/30 dark:border-success/50 dark:bg-success/10 dark:shadow-success/40 shadow-[0_0_14px_-2px] dark:shadow-[0_0_20px_-2px]",
      )}
    >
      <div className="flex shrink-0 self-center">
        <span className="flex h-[2.75rem] min-w-[4.5rem] items-center justify-center rounded-full border bg-white px-2 py-1.5 [--background:var(--color-white)] [--foreground:var(--base-800)]">
          <SupermarketChainBadge
            originId={product.origin_id}
            variant="logo"
            className="!h-5 w-auto !max-w-[84px] md:!h-6 md:!max-w-[92px]"
          />
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {isCurrent && (
            <Badge size="xs" variant="blue" className="shrink-0">
              <MapPinIcon className="h-3 w-3" />
              This page
            </Badge>
          )}
          {!isCurrent && atLowestPriceTier && hasUniqueCheapest && hasPriceSpread && (
            <Badge size="xs" variant="success" className="shrink-0">
              <TrophyIcon className="h-3 w-3" />
              Cheapest
            </Badge>
          )}
          {!isCurrent && atLowestPriceTier && !hasUniqueCheapest && hasPriceSpread && (
            <Badge size="xs" variant="success" className="shrink-0">
              <TrophyIcon className="h-3 w-3" />
              Best price
            </Badge>
          )}
        </div>
        {duplicateChain && product.pack ? (
          <p className="text-muted-foreground mt-1 line-clamp-2 text-xs leading-snug">{product.pack}</p>
        ) : null}
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1 text-right">
        {product.price !== null && product.price !== undefined ? (
          <div className="flex flex-wrap items-center justify-end gap-x-1.5 gap-y-0.5">
            <span
              className={cn(
                "text-base font-bold tabular-nums sm:text-lg",
                showFloorHighlight && "text-success",
                !showFloorHighlight && "text-foreground",
              )}
            >
              {product.price.toFixed(2)}€
            </span>
            {hasDiscount && (
              <>
                <span className="text-muted-foreground text-sm tabular-nums line-through">
                  {product.price_recommended?.toFixed(2)}€
                </span>
                <Badge variant="destructive" size="xs" className="shrink-0">
                  -{discountValueToPercentage(product.discount!)}
                </Badge>
              </>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground text-base font-bold">--€</span>
        )}

        <div className="flex flex-wrap items-center justify-end gap-1.5">
          {priceDiff !== null && priceDiff > 0 && (
            <Badge variant="outline" size="xs" className="tabular-nums">
              +{priceDiff.toFixed(2)}€
            </Badge>
          )}
          {product.price_per_major_unit && product.major_unit && (
            <Badge variant="price-per-unit" size="xs" className="tabular-nums">
              {product.price_per_major_unit}€/{formatMajorUnitSuffix(product.major_unit)}
            </Badge>
          )}
        </div>
      </div>
    </Link>
  )
}

function LoadingSkeleton() {
  return (
    <div className="flex min-h-[180px] flex-col">
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

      <div className="flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex min-h-[3.75rem] flex-row items-center gap-3 rounded-lg border p-3">
            <Skeleton className="h-[2.75rem] w-[4.5rem] shrink-0 rounded-full" />
            <Skeleton className="h-4 flex-1 rounded" />
            <div className="flex shrink-0 flex-col items-end gap-1">
              <Skeleton className="h-6 w-16 rounded" />
              <Skeleton className="h-4 w-20 rounded-full" />
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

  const productsWithPrice = allProducts.filter((p) => p.price !== null && p.price !== undefined)
  const cheapestPrice = productsWithPrice.length > 0 ? Math.min(...productsWithPrice.map((p) => p.price!)) : null
  const highestPrice = productsWithPrice.length > 0 ? Math.max(...productsWithPrice.map((p) => p.price!)) : null
  const hasPriceSpread =
    cheapestPrice !== null && highestPrice !== null && Math.round(highestPrice * 100) > Math.round(cheapestPrice * 100)
  const countAtFloor = cheapestPrice !== null ? productsWithPrice.filter((p) => p.price === cheapestPrice).length : 0
  const hasUniqueCheapest = countAtFloor === 1
  const sortedProducts = [...allProducts].sort((a, b) => {
    const pa = a.price ?? Infinity
    const pb = b.price ?? Infinity
    if (pa !== pb) return pa - pb
    if (a.origin_id !== b.origin_id) return a.origin_id - b.origin_id
    return a.id - b.id
  })

  const listingsByOrigin = allProducts.reduce<Record<number, number>>((acc, p) => {
    acc[p.origin_id] = (acc[p.origin_id] ?? 0) + 1
    return acc
  }, {})

  // Build compare page link: prefer canonical, fall back to barcode
  const hasBarcode = currentProduct.barcode && currentProduct.barcode.length > 0
  const compareHref = currentProduct.canonical_product_id
    ? `/products/compare?canonical=${currentProduct.canonical_product_id}`
    : hasBarcode
      ? `/products/barcode/${encodeURIComponent(currentProduct.barcode!)}`
      : null

  if (error) {
    return <ErrorStateView error={error} title="Failed to load price comparison" />
  }

  if (isLoading) {
    return <LoadingSkeleton />
  }

  // No identical products found (only current product)
  if (!identicalProducts || identicalProducts.length === 0) {
    return (
      <div className="animate-fade-in-fast min-h-[180px] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <ScaleIcon className="h-5 w-5" />
            Compare Prices
          </h3>
        </div>

        <EmptyStateView
          icon={ScaleIcon}
          title="No price comparisons available"
          message="We couldn't find this product listed at other stores right now. Check back later as availability updates regularly."
        />
      </div>
    )
  }

  const chainCount = new Set(allProducts.map((p) => p.origin_id)).size
  const listingCount = allProducts.length

  return (
    <div className="animate-fade-in-fast flex flex-col">
      {/* Header */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex flex-wrap items-center gap-x-2 gap-y-1 text-lg font-semibold">
          <span className="inline-flex items-center gap-2">
            <ScaleIcon className="h-5 w-5 shrink-0" />
            Compare Prices
          </span>
          <span className="inline-flex flex-wrap items-center gap-1.5">
            {chainCount === listingCount ? (
              <Badge variant="boring" size="xs">
                {chainCount} store{chainCount !== 1 ? "s" : ""}
              </Badge>
            ) : (
              <>
                <Badge variant="boring" size="xs">
                  {chainCount} chain{chainCount !== 1 ? "s" : ""}
                </Badge>
                <Badge variant="boring" size="xs">
                  {listingCount} listing{listingCount !== 1 ? "s" : ""}
                </Badge>
              </>
            )}
          </span>
        </h3>

        {compareHref && (
          <Button asChild variant="outline" size="sm">
            <Link href={compareHref}>
              Compare in detail
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>

      {/* Savings hint */}
      {cheapestPrice !== null &&
      currentProduct.price !== null &&
      hasPriceSpread &&
      currentProduct.price > cheapestPrice ? (
        <p className="text-muted-foreground mb-3">
          <ZapIcon className="text-success mr-1 inline-flex h-4 w-4" />
          <span className="text-success font-medium">Save {(currentProduct.price - cheapestPrice).toFixed(2)}€</span> by
          switching to the cheapest option.
        </p>
      ) : cheapestPrice !== null &&
        currentProduct.price !== null &&
        hasPriceSpread &&
        currentProduct.price === cheapestPrice &&
        hasUniqueCheapest ? (
        <p className="text-muted-foreground mb-3">
          <SmilePlusIcon className="text-success mr-1 inline-flex h-4 w-4" />
          <span className="text-success font-medium">You are already viewing</span> the cheapest option.
        </p>
      ) : cheapestPrice !== null &&
        currentProduct.price !== null &&
        hasPriceSpread &&
        currentProduct.price === cheapestPrice &&
        !hasUniqueCheapest ? (
        <p className="text-muted-foreground mb-3">
          <SmilePlusIcon className="text-success mr-1 inline-flex h-4 w-4" />
          You&apos;re viewing a listing at the lowest price ({cheapestPrice.toFixed(2)}€). Other offers go up to{" "}
          {highestPrice?.toFixed(2)}€.
        </p>
      ) : (
        <p className="text-muted-foreground mb-3">
          All stores have the same price. You&apos;re not missing out on deals.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {sortedProducts.map((product) => {
          const atLowestPriceTier = cheapestPrice !== null && product.price === cheapestPrice
          const isCurrent = product.id === currentProduct.id
          const priceDiff =
            cheapestPrice !== null && product.price !== null && product.price !== undefined
              ? product.price - cheapestPrice
              : null

          return (
            <CompactStoreCard
              key={product.id}
              product={product}
              atLowestPriceTier={atLowestPriceTier}
              hasUniqueCheapest={hasUniqueCheapest}
              hasPriceSpread={hasPriceSpread}
              isCurrent={isCurrent}
              priceDiff={priceDiff}
              duplicateChain={(listingsByOrigin[product.origin_id] ?? 0) > 1}
            />
          )
        })}
      </div>
    </div>
  )
}
