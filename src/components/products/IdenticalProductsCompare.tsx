"use client"

import Link from "next/link"
import Image from "next/image"
import { useTranslations } from "next-intl"

import type { StoreProduct } from "@/types"
import { cn } from "@/lib/utils"
import { generateProductPath, formatDiscountPercentWithMinus } from "@/lib/business/product"
import { PRICE_MISSING_SHORT, PLUS_SIGN, formatEuroCompact, formatEuroPerMajorUnit } from "@/lib/i18n/formatting-glyphs"
import { useIdenticalStoreProducts } from "@/hooks/useProducts"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ErrorStateView, EmptyStateView } from "@/components/ui/combo/state-views"
import { EmptyDescription } from "@/components/ui/empty"
import { SupermarketChainBadge, getSupermarketChainName } from "@/components/products/SupermarketChainBadge"
import { IdenticalCompareSavingsHint } from "@/components/products/IdenticalCompareSavingsHint"

import { ArrowRightIcon, ScaleIcon, TrophyIcon, MapPinIcon } from "lucide-react"

interface Props {
  currentProduct: StoreProduct
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
  const t = useTranslations("products.identical")
  const hasDiscount = product.price_recommended && product.price && product.price_recommended !== product.price
  const showFloorHighlight = atLowestPriceTier && hasPriceSpread

  const chainLabel = getSupermarketChainName(product.origin_id) ?? t("storeFallback")
  const priceLabel =
    product.price !== null && product.price !== undefined
      ? t("priceLabel", { value: product.price.toFixed(2) })
      : t("priceUnknown")
  const priceDiffBadge = priceDiff !== null && priceDiff > 0 ? PLUS_SIGN + formatEuroCompact(priceDiff) : null

  return (
    <Link
      href={generateProductPath(product)}
      aria-label={t("ariaLabel", { chain: chainLabel, price: priceLabel })}
      className={cn(
        "group hover:border-foreground/20 dark:hover:border-foreground/30 relative min-h-15 w-full overflow-hidden rounded-lg border p-3 transition-all",
        showFloorHighlight && "isolate",
        showFloorHighlight &&
          "border-primary/40 bg-primary/5 shadow-primary/30 dark:border-primary/40 dark:bg-primary/10 dark:shadow-primary/40",
      )}
    >
      <div className="relative z-1 flex w-full flex-row items-start gap-3 sm:gap-4">
        <div className="flex shrink-0 items-start justify-start gap-2">
          {product.image && (
            <Image
              src={product.image}
              alt={product.name}
              width={80}
              height={80}
              className="aspect-square size-12 rounded-md border object-cover"
            />
          )}
          <div className="flex shrink-0 flex-col items-start gap-2 self-start">
            <SupermarketChainBadge
              originId={product.origin_id}
              variant="logo"
              className="h-6! w-auto! max-w-[108px]! rounded-sm bg-transparent object-contain object-left px-0 py-0 md:h-6! md:max-w-[108px]!"
            />

            {isCurrent && (
              <Badge size="xs" variant="glass-primary" className="w-fit">
                <MapPinIcon className="h-3 w-3" />
                {t("thisPage")}
              </Badge>
            )}
            {!isCurrent && atLowestPriceTier && hasUniqueCheapest && hasPriceSpread && (
              <Badge size="xs" variant="secondary" className="w-fit">
                <TrophyIcon className="h-3 w-3" />
                {t("cheapest")}
              </Badge>
            )}
            {!isCurrent && atLowestPriceTier && !hasUniqueCheapest && hasPriceSpread && (
              <Badge size="xs" variant="retail" className="w-fit">
                <TrophyIcon className="h-3 w-3" />
                {t("bestPrice")}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex w-full flex-1 shrink-0 flex-col items-end justify-end gap-2 text-right">
          {product.price !== null && product.price !== undefined ? (
            <div className="flex flex-wrap items-center justify-end gap-2">
              {duplicateChain && product.pack ? (
                <p className="text-muted-foreground mt-1 line-clamp-2 text-xs leading-snug">{product.pack}</p>
              ) : null}

              {hasDiscount && (
                <Badge variant="retail-discount" size="xs" className="text-2xs w-fit px-1 py-px leading-none">
                  {formatDiscountPercentWithMinus(product.discount!)}
                </Badge>
              )}

              <span className="text-muted-foreground text-sm tabular-nums line-through">
                {product.price_recommended != null ? formatEuroCompact(product.price_recommended) : null}
              </span>

              <span
                className={cn(
                  "text-base font-bold tabular-nums sm:text-lg",
                  showFloorHighlight && "text-primary",
                  !showFloorHighlight && "text-foreground",
                )}
              >
                {formatEuroCompact(product.price)}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground text-base font-bold">{PRICE_MISSING_SHORT}</span>
          )}

          <div className="flex flex-wrap items-center justify-end gap-1.5">
            {product.price_per_major_unit && product.major_unit && (
              <Badge variant="price-per-unit" size="xs" className="tabular-nums">
                {formatEuroPerMajorUnit(product.price_per_major_unit, product.major_unit)}
              </Badge>
            )}

            {priceDiffBadge != null && (
              <Badge variant="boring" size="xs" className="tabular-nums">
                {priceDiffBadge}
              </Badge>
            )}
          </div>
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
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>

      <div className="flex flex-col gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex min-h-15 flex-row items-center gap-3 rounded-lg border p-3">
            <Skeleton className="h-11 w-18 shrink-0 rounded-full" />
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
  const t = useTranslations("products.identical")
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
    return <ErrorStateView error={error} title={t("errorTitle")} />
  }

  if (isLoading) {
    return <LoadingSkeleton />
  }

  // No identical products found (only current product)
  if (!identicalProducts || identicalProducts.length === 0) {
    return (
      <div className="animate-fade-in-fast min-h-[180px] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <ScaleIcon className="h-5 w-5 shrink-0" />
            {t("comparePrices")}
          </h3>
          {compareHref ? (
            <Button asChild variant="outline" size="sm">
              <Link href={compareHref}>
                {t("openComparison")}
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </Button>
          ) : null}
        </div>

        <EmptyStateView
          icon={ScaleIcon}
          title={t("noOtherStores")}
          message={
            <div className="flex max-w-md flex-col items-center gap-1.5">
              <EmptyDescription className="text-center">
                {t("onlyHere", {
                  store: getSupermarketChainName(currentProduct.origin_id) ?? t("storeFallback"),
                })}
              </EmptyDescription>
              <SupermarketChainBadge
                originId={currentProduct.origin_id}
                variant="logo"
                className="inline-flex h-7! w-auto! max-w-[140px]! rounded-md bg-white px-2 py-1 md:h-7! md:max-w-[140px]!"
              />
            </div>
          }
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
            {t("comparePrices")}
          </span>
          <span className="inline-flex flex-wrap items-center gap-1.5">
            {chainCount === listingCount ? (
              <Badge variant="boring" size="xs">
                {t("storesCount", { count: chainCount })}
              </Badge>
            ) : (
              <>
                <Badge variant="boring" size="xs">
                  {t("chainsCount", { count: chainCount })}
                </Badge>
                <Badge variant="boring" size="xs">
                  {t("listingsCount", { count: listingCount })}
                </Badge>
              </>
            )}
          </span>
        </h3>

        {compareHref && (
          <Button asChild variant="outline" size="sm">
            <Link href={compareHref}>
              {t("seeMore")}
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>

      <IdenticalCompareSavingsHint
        className="mb-3"
        currentPrice={currentProduct.price ?? null}
        cheapestPrice={cheapestPrice}
        highestPrice={highestPrice}
        hasPriceSpread={hasPriceSpread}
        hasUniqueCheapest={hasUniqueCheapest}
      />

      <div className="flex flex-col gap-2 lg:flex-row lg:gap-3">
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
