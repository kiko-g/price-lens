"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { imagePlaceholder } from "@/lib/business/data"
import { discountValueToPercentage } from "@/lib/business/product"
import { SupermarketChainBadge } from "@/components/products/SupermarketChainBadge"
import { Marquee } from "@/components/ui/marquee"
import type { HeroProduct } from "@/lib/business/hero"

function resolveImageUrl(src: string, size = 200): string {
  try {
    const url = new URL(src)
    const p = url.searchParams
    for (const k of ["sm", "w", "h", "sw", "sh"]) p.delete(k)
    p.set("sw", String(size))
    p.set("sh", String(size))
    p.set("sm", "fit")
    return url.toString()
  } catch {
    return src
  }
}

function formatPrice(n: number): string {
  return n.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })
}

function ProductCard({ product, compact = false }: { product: HeroProduct; compact?: boolean }) {
  const [loaded, setLoaded] = useState(false)
  const hasDiscount = product.discount != null && product.discount > 0
  const imgSize = compact ? 48 : 72

  return (
    <Link
      href={product.href}
      className={cn(
        "group relative flex shrink-0 items-start",
        compact
          ? "w-40 gap-2"
          : "hover:border-border w-56 gap-2.5 rounded-xl border border-transparent bg-white/60 p-2.5 transition-all duration-200 hover:bg-white hover:shadow-lg dark:bg-white/5 dark:hover:bg-white/10",
      )}
    >
      <div
        className="relative shrink-0 overflow-hidden rounded-lg bg-white"
        style={{ width: imgSize, height: imgSize }}
      >
        <Image
          src={resolveImageUrl(product.image, imgSize * 2)}
          alt={product.name}
          width={imgSize * 2}
          height={imgSize * 2}
          unoptimized
          placeholder="blur"
          blurDataURL={imagePlaceholder.productBlur}
          className={cn(
            "h-full w-full object-contain transition-opacity duration-200",
            compact ? "p-0.5" : "p-1",
            loaded ? "opacity-100" : "opacity-0",
          )}
          onLoad={() => setLoaded(true)}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span
          className={cn(
            "text-foreground/80 line-clamp-2 leading-snug font-medium",
            compact ? "text-[11px]" : "text-xs",
          )}
        >
          {product.name}
        </span>

        <div className="flex flex-wrap items-baseline gap-1">
          {product.price != null && (
            <span
              className={cn(
                "font-bold tabular-nums",
                hasDiscount ? "text-emerald-700 dark:text-emerald-400" : "",
                compact ? "text-xs" : "text-sm",
              )}
            >
              {formatPrice(product.price)}
            </span>
          )}
          {hasDiscount && product.priceRecommended != null && (
            <span className="text-muted-foreground/60 text-[10px] tabular-nums line-through">
              {formatPrice(product.priceRecommended)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {hasDiscount && (
            <span className="rounded bg-emerald-600 px-1 py-px text-[9px] leading-none font-bold text-white">
              -{discountValueToPercentage(product.discount!, 0)}
            </span>
          )}
          <SupermarketChainBadge
            originId={product.originId}
            variant="logoSmall"
            className="h-2.5 w-auto opacity-60 grayscale-100 dark:opacity-80 dark:grayscale-100"
          />
        </div>
      </div>
    </Link>
  )
}

export function PopularProducts({ products, className }: { products: HeroProduct[]; className?: string }) {
  if (products.length === 0) return null

  const mid = Math.ceil(products.length / 2)
  const row1 = products.slice(0, mid)
  const row2 = products.slice(mid)

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <p className="text-muted-foreground mb-3 text-center text-[11px] font-semibold tracking-widest uppercase md:text-left">
        Popular products
      </p>

      <div className="relative">
        {/* Mobile: compact marquee */}
        <div className="flex flex-col gap-2 lg:hidden">
          <Marquee className="p-0 [--duration:80s] [--gap:0.75rem]">
            {row1.map((product) => (
              <ProductCard key={product.id} product={product} compact />
            ))}
          </Marquee>
          <Marquee reverse className="p-0 [--duration:80s] [--gap:0.75rem]">
            {row2.map((product) => (
              <ProductCard key={product.id} product={product} compact />
            ))}
          </Marquee>
        </div>

        {/* Desktop: full marquee */}
        <div className="hidden flex-col gap-2.5 lg:flex">
          <Marquee pauseOnHover className="p-0 [--duration:50s] [--gap:0.75rem]">
            {row1.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </Marquee>
          <Marquee reverse pauseOnHover className="p-0 [--duration:50s] [--gap:0.75rem]">
            {row2.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </Marquee>
        </div>

        {/* Edge fades */}
        <div className="from-background pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r lg:w-16" />
        <div className="from-background pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l lg:w-16" />
      </div>
    </div>
  )
}
