import Image from "next/image"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { discountValueToPercentage } from "@/lib/business/product"

import type { StoreProduct } from "@/types"

import { Badge } from "@/components/ui/badge"
import { SupermarketChainBadge } from "@/components/products/SupermarketChainBadge"
import { PriceFreshnessInfo } from "@/components/products/PriceFreshnessInfo"
import { ProductActions } from "@/components/products/product-page/ProductActions"
import { resolveImageUrlForPage } from "@/components/products/product-page/ProductHeroDesktop"

import { AlertTriangleIcon } from "lucide-react"

interface ProductHeroMobileProps {
  sp: StoreProduct
}

export function ProductHeroMobile({ sp }: ProductHeroMobileProps) {
  const isPriceNotSet = !sp.price_recommended && !sp.price
  const hasDiscount = sp.price_recommended && sp.price && sp.price_recommended !== sp.price
  const isPriceRecommendedNotSet = !sp.price_recommended && sp.price
  const isPriceEqualToRecommended = sp.price_recommended && sp.price && sp.price_recommended === sp.price
  const isNormalPrice = isPriceRecommendedNotSet || isPriceEqualToRecommended

  return (
    <article className="flex w-full flex-col gap-2.5 md:hidden">
      {/* Full-width product image */}
      <div className="relative aspect-6/5 w-full overflow-hidden rounded-lg border bg-white">
        {sp.image ? (
          <Image
            fill
            src={resolveImageUrlForPage(sp.image, 800)}
            alt={sp.name}
            className={cn(
              "max-h-full max-w-full object-contain object-center",
              sp.available ? "opacity-100" : "cursor-not-allowed grayscale",
            )}
            sizes="100vw"
            priority={true}
          />
        ) : (
          <div className="bg-muted flex h-full w-full items-center justify-center">
            <p className="text-muted-foreground">No image available</p>
          </div>
        )}

        {!sp.available && (
          <div className="absolute top-3 left-3 z-10">
            <Badge variant="destructive" size="sm" roundedness="sm" className="w-fit">
              <AlertTriangleIcon className="h-4 w-4" />
              Not available
            </Badge>
          </div>
        )}
      </div>

      {/* Brand + Store badge row */}
      <div className="flex flex-wrap items-center gap-2">
        {sp.brand && (
          <Link href={`/products?q=${encodeURIComponent(sp.brand)}`}>
            <Badge variant="blue" size="sm" roundedness="sm">
              {sp.brand}
            </Badge>
          </Link>
        )}

        <Link
          href={sp.url}
          target="_blank"
          rel="noreferrer noopener"
          className="border-border inline-flex rounded-full border px-2 py-0.5 dark:border-transparent dark:bg-white dark:hover:bg-white/90"
        >
          <SupermarketChainBadge originId={sp?.origin_id} variant="logo" />
        </Link>
      </div>

      {/* Product Name and Pack size */}
      <div className="flex flex-col gap-0">
        <h1 className="line-clamp-3 text-xl leading-6 font-bold">{sp.name}</h1>
        {sp.pack && <p className="text-muted-foreground line-clamp-2 text-sm">{sp.pack}</p>}
      </div>

      {/* Pricing */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Active Price and PVPR */}
        {hasDiscount ? (
          <>
            <span className="text-xl font-bold text-green-700 dark:text-green-600">{sp.price}€</span>
            <span className="text-muted-foreground text-base line-through">{sp.price_recommended}€</span>
          </>
        ) : null}

        {isNormalPrice ? <span className="text-xl font-bold text-zinc-700 dark:text-zinc-200">{sp.price}€</span> : null}

        {isPriceNotSet ? <span className="text-lg font-bold text-zinc-700 dark:text-zinc-200">--.--€</span> : null}

        {/* Price per unit and discount */}
        {sp.price_per_major_unit && sp.major_unit ? (
          <Badge variant="price-per-unit" size="xs" roundedness="sm" className="w-fit">
            {sp.price_per_major_unit}€/{sp.major_unit.startsWith("/") ? sp.major_unit.slice(1) : sp.major_unit}
          </Badge>
        ) : null}

        {sp.discount ? (
          <Badge variant="destructive" size="xs" roundedness="sm" className="w-fit">
            -{discountValueToPercentage(sp.discount)}
          </Badge>
        ) : null}
      </div>

      {/* Freshness info */}
      <PriceFreshnessInfo updatedAt={sp.updated_at} priority={sp.priority} />

      {/* Actions */}
      <ProductActions sp={sp} />
    </article>
  )
}
