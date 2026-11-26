"use client"

import Link from "next/link"
import Image from "next/image"
import { useLocale, useTranslations } from "next-intl"
import { ArrowRightIcon } from "lucide-react"

import { SupermarketChainBadge } from "@/components/products/SupermarketChainBadge"
import { Badge } from "@/components/ui/badge"
import { isLocale, type Locale } from "@/i18n/config"
import type { HomepageDrop } from "@/lib/business/homepage-drop"
import { formatDiscountPercentWithMinus } from "@/lib/business/product"
import { formatPrice } from "@/lib/i18n/format"

export function HomeDropGrid({ products }: { products: HomepageDrop[] }) {
  const t = useTranslations("home.popularProducts")
  const localeRaw = useLocale()
  const locale: Locale = isLocale(localeRaw) ? localeRaw : "pt"
  if (products.length === 0) return null

  return (
    <section aria-labelledby="home-drops-heading">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 id="home-drops-heading" className="text-base font-semibold tracking-tight">
            {t("title")}
          </h2>
          <p className="text-muted-foreground mt-1 max-w-xl text-sm leading-relaxed">{t("subtitle")}</p>
        </div>
        <Link
          href="/products?sort=price-drop"
          className="text-foreground hover:text-primary inline-flex shrink-0 items-center gap-1 text-sm font-medium"
        >
          {t("viewAll")}
          <ArrowRightIcon className="size-3.5" aria-hidden />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <HomeDropCard key={product.id} product={product} locale={locale} />
        ))}
      </div>
    </section>
  )
}

function HomeDropCard({ product, locale }: { product: HomepageDrop; locale: Locale }) {
  return (
    <Link
      href={product.href}
      className="bg-card hover:bg-accent border-border flex flex-col overflow-hidden rounded-xl border transition-colors"
    >
      <div className="relative aspect-8/7 w-full bg-white">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="rounded-lg object-contain"
          sizes="160px"
          unoptimized
        />
        <div className="absolute top-1.5 left-1.5 z-10">
          <Badge
            variant="discount"
            size="2xs"
            roundedness="sm"
            className="text-[10px] leading-none font-bold tracking-tight"
          >
            {formatDiscountPercentWithMinus(Math.abs(product.changeRatio), 0)}
          </Badge>
        </div>
      </div>
      <div className="flex flex-col gap-0.5 p-2">
        <p className="text-foreground line-clamp-2 text-xs leading-tight font-medium">{product.name}</p>
        <div className="mt-0.5 flex flex-col items-start gap-y-0.5">
          <SupermarketChainBadge originId={product.originId} variant="logoSmall" />
          <div className="flex flex-wrap items-baseline gap-x-1">
            <span className="text-success text-xs font-semibold tabular-nums">
              {formatPrice(product.price, locale)}
            </span>
            {product.priceBefore != null && (
              <span className="text-muted-foreground text-xs tabular-nums line-through">
                {formatPrice(product.priceBefore, locale)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
