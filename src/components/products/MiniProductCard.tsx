"use client"

import Link from "next/link"
import Image from "next/image"
import { useLocale } from "next-intl"

import { cn } from "@/lib/utils"
import type { HeroProduct } from "@/lib/business/hero"
import { formatDiscountPercentWithMinus } from "@/lib/business/product"
import { isLocale, type Locale } from "@/i18n/config"
import { formatPrice } from "@/lib/i18n/format"
import { EM_DASH } from "@/lib/i18n/punctuation"

import { FavoriteSummaryItem } from "@/hooks/useUserFavoritesSummary"
import { type RecentlyViewedItem } from "@/hooks/useRecentlyViewed"

import { Badge } from "@/components/ui/badge"
import { SupermarketChainBadge } from "@/components/products/SupermarketChainBadge"

import { PackageIcon } from "lucide-react"

export type FavoriteItem = FavoriteSummaryItem

export function MiniProductCard({ product }: { product: FavoriteItem | RecentlyViewedItem | HeroProduct }) {
  const discount = "discount" in product ? product.discount : null
  const priceRecommended =
    "price_recommended" in product
      ? product.price_recommended
      : "priceRecommended" in product
        ? product.priceRecommended
        : null

  const pricePerUnit = "price_per_major_unit" in product ? product.price_per_major_unit : null
  const majorUnit = "major_unit" in product ? product.major_unit : null
  const originId = "origin_id" in product ? product.origin_id : product.originId
  const href = "href" in product ? product.href : `/products/${product.id}`
  const localeRaw = useLocale()
  const locale: Locale = isLocale(localeRaw) ? localeRaw : "pt"

  const hasDiscount = Boolean(discount && discount > 0)
  const hasStrikethrough = Boolean(priceRecommended && product.price != null && priceRecommended > product.price)

  return (
    <Link
      href={href}
      className="bg-card hover:bg-accent border-border flex flex-col overflow-hidden rounded-xl border transition-colors"
    >
      {/* Image */}
      <div className="relative aspect-8/7 w-full bg-white">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="rounded-lg object-contain pb-0"
            sizes="160px"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <PackageIcon className="text-muted-foreground/40 size-8" />
          </div>
        )}

        {/* Discount badge: overlaid on image */}
        {hasDiscount && (
          <div className="absolute top-1.5 left-1.5 z-10 flex flex-col">
            <Badge
              variant="discount"
              size="2xs"
              roundedness="sm"
              className="text-[10px] leading-none font-bold tracking-tight"
            >
              {formatDiscountPercentWithMinus(discount!, 0)}
            </Badge>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-0.5 p-2">
        <p className="text-foreground line-clamp-2 text-xs leading-tight font-medium">{product.name}</p>
        <div className="mt-0.5 flex flex-col items-start gap-y-0.5">
          <SupermarketChainBadge originId={originId} variant="logoSmall" />

          <div className="flex flex-wrap items-baseline gap-x-1">
            <span
              className={cn(
                "text-xs font-semibold tabular-nums",
                hasDiscount ? "text-emerald-600 dark:text-emerald-400" : "text-foreground",
              )}
            >
              {product.price != null ? formatPrice(product.price, locale) : EM_DASH}
            </span>
            {hasStrikethrough && (
              <span className="text-muted-foreground text-xs tabular-nums line-through">
                {formatPrice(priceRecommended!, locale)}
              </span>
            )}
          </div>
        </div>

        {pricePerUnit && majorUnit && (
          <MiniProductCardPricePerUnit pricePerUnit={pricePerUnit} majorUnit={majorUnit} locale={locale} />
        )}
      </div>
    </Link>
  )
}

export function MiniProductCardPricePerUnit({
  pricePerUnit,
  majorUnit,
  locale,
}: {
  pricePerUnit: number
  majorUnit: string
  locale: Locale
}) {
  const formattedMajorUnit = majorUnit.startsWith("/") ? majorUnit.slice(1) : majorUnit
  const prefix = `${formatPrice(pricePerUnit, locale)}/`

  return (
    <Badge variant="price-per-unit" size="2xs" roundedness="sm" className="w-fit leading-none font-medium tabular-nums">
      {prefix}
      <span className="lowercase">{formattedMajorUnit}</span>
    </Badge>
  )
}
