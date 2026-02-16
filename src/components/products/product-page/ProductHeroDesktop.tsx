import type { ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { discountValueToPercentage } from "@/lib/business/product"

import type { StoreProduct } from "@/types"

import { Badge } from "@/components/ui/badge"
import { Barcode } from "@/components/ui/combo/barcode"

import { PriorityBadge } from "@/components/products/PriorityBadge"
import { SupermarketChainBadge } from "@/components/products/SupermarketChainBadge"
import { PriceFreshnessInfo } from "@/components/products/PriceFreshnessInfo"
import { ProductActions } from "@/components/products/product-page/ProductActions"

import { AlertTriangleIcon, ExternalLinkIcon } from "lucide-react"

export function resolveImageUrlForPage(image: string, size = 800) {
  const url = new URL(image)
  const p = url.searchParams
  const fieldsToDelete = ["sm", "w", "h", "sw", "sh"]
  fieldsToDelete.forEach((k) => p.delete(k))
  p.set("sw", String(size))
  p.set("sh", String(size))
  p.set("sm", "fit")
  p.set("fit", "crop")
  return url.toString()
}

interface ProductHeroDesktopProps {
  sp: StoreProduct
  children?: ReactNode
}

export function ProductHeroDesktop({ sp, children }: ProductHeroDesktopProps) {
  const isPriceNotSet = !sp.price_recommended && !sp.price
  const hasDiscount = sp.price_recommended && sp.price && sp.price_recommended !== sp.price
  const isPriceRecommendedNotSet = !sp.price_recommended && sp.price
  const isPriceEqualToRecommended = sp.price_recommended && sp.price && sp.price_recommended === sp.price
  const isNormalPrice = isPriceRecommendedNotSet || isPriceEqualToRecommended

  return (
    <article className="hidden w-full grid-cols-20 gap-8 md:grid">
      {/* Left column: Image + Barcode */}
      <aside className="col-span-6 flex flex-col items-center">
        <div className="relative aspect-7/8 w-full overflow-hidden rounded-lg border bg-white">
          {sp.image ? (
            <Image
              fill
              src={resolveImageUrlForPage(sp.image, 800)}
              alt={sp.name}
              className={cn(
                "max-h-full max-w-full object-contain object-center",
                sp.available ? "opacity-100" : "cursor-not-allowed grayscale",
              )}
              sizes="50vw"
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

          <div className="absolute right-3 bottom-3 z-10">
            <Link
              href={sp.url}
              target="_blank"
              rel="noreferrer noopener"
              className="border-border inline-flex items-center justify-center gap-1 rounded-full border px-2 py-0.5 transition-all duration-300 hover:bg-zinc-100 dark:border-zinc-300 dark:bg-white dark:hover:bg-zinc-200"
            >
              <SupermarketChainBadge originId={sp?.origin_id} variant="logo" />
              <ExternalLinkIcon className="h-4 w-4 text-black" />
            </Link>
          </div>
        </div>

        <div className="mt-4 inline-flex w-full flex-wrap items-start justify-center gap-4">
          <Barcode value={sp.barcode} height={35} width={2} showMissingValue />
        </div>
      </aside>

      {/* Right column: Details */}
      <section className="col-span-14 flex flex-col gap-2">
        {/* Brand, Priority, Supermarket Chain Badges */}
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {sp.brand && (
            <Link href={`/products?q=${encodeURIComponent(sp.brand)}`} target="_blank">
              <Badge variant="blue">{sp.brand}</Badge>
            </Link>
          )}

          <PriorityBadge priority={sp.priority} roundedness="2xl" />

          <Link
            href={sp.url}
            target="_blank"
            rel="noreferrer noopener"
            className="border-border inline-flex rounded-full border px-2 py-0.5 md:hidden dark:border-transparent dark:bg-white dark:hover:bg-white/90"
          >
            <SupermarketChainBadge originId={sp?.origin_id} variant="logo" />
          </Link>
        </div>

        {/* Product Name and Pack size */}
        <div className="flex flex-col gap-0">
          <h1 className="line-clamp-2 max-w-160 text-xl leading-5 font-bold xl:text-2xl xl:leading-6">{sp.name}</h1>
          {sp.pack && <p className="text-muted-foreground line-clamp-3 text-base">{sp.pack}</p>}
        </div>

        {/* Pricing */}
        <div className="flex flex-col items-start justify-start gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {hasDiscount ? (
              <>
                <span className="text-xl font-bold text-green-700 dark:text-green-600">{sp.price}€</span>
                <span className="text-muted-foreground text-base line-through">{sp.price_recommended}€</span>
              </>
            ) : null}

            {isNormalPrice ? (
              <span className="text-xl font-bold text-zinc-700 dark:text-zinc-200">{sp.price}€</span>
            ) : null}

            {isPriceNotSet ? <span className="text-lg font-bold text-zinc-700 dark:text-zinc-200">--.--€</span> : null}
          </div>

          <div className="flex items-center gap-2">
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

            <PriceFreshnessInfo updatedAt={sp.updated_at} priority={sp.priority} />
          </div>
        </div>

        {/* Actions */}
        <div className="mb-1.5">
          <ProductActions sp={sp} />
        </div>

        {/* Chart and additional content rendered inside the right column */}
        {children}
      </section>
    </article>
  )
}
