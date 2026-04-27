"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useLocale, useTranslations } from "next-intl"
import { useUser } from "@/hooks/useUser"
import { useRecentlyViewed, type RecentlyViewedItem } from "@/hooks/useRecentlyViewed"
import { useUserAlerts } from "@/hooks/useUserAlerts"
import { useUserFavoritesSummary, type FavoriteSummaryItem } from "@/hooks/useUserFavoritesSummary"
import { cn } from "@/lib/utils"
import { formatDiscountPercentWithMinus } from "@/lib/business/product"
import { isLocale, type Locale } from "@/i18n/config"
import { formatPrice } from "@/lib/i18n/format"
import { EM_DASH } from "@/lib/i18n/punctuation"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SupermarketChainBadge } from "@/components/products/SupermarketChainBadge"
import { HomeSearchBar } from "@/components/home/HomeSearchBar"
import { MiniProductCardSkeleton } from "@/components/home/MiniProductCardSkeleton"

import {
  BellIcon,
  HeartIcon,
  ClockIcon,
  ArrowRightIcon,
  TagIcon,
  PackageIcon,
  PinIcon,
  SparklesIcon,
} from "lucide-react"
import type { HeroProduct } from "@/lib/business/hero"

type FavoriteItem = FavoriteSummaryItem

export function PersonalizedDashboard({
  totalProducts,
  heroProducts,
}: {
  totalProducts: number
  heroProducts: HeroProduct[]
}) {
  const { user, profile } = useUser()
  const { items: recentlyViewed } = useRecentlyViewed()
  const { data: alertsData, isLoading: alertsLoading } = useUserAlerts()
  const { data: favoritesData, isLoading: favoritesLoading } = useUserFavoritesSummary(24)
  const t = useTranslations("home.personalizedDashboard")
  const localeRaw = useLocale()
  const locale: Locale = isLocale(localeRaw) ? localeRaw : "pt"

  const favorites = favoritesData?.items ?? []
  const favoritesTotal = favoritesData?.totalCount ?? null
  const alerts = (alertsData ?? []).slice(0, 4)
  const isLoading = alertsLoading || favoritesLoading

  const firstName =
    profile?.full_name?.split(" ")[0] || user?.user_metadata?.full_name?.split(" ")[0] || t("fallbackName")

  return (
    <div className="z-20 mx-auto w-full max-w-7xl px-4 py-6 lg:px-8 lg:py-10">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
            <span className="text-muted-foreground font-normal">{t("welcomeBack")}</span> {firstName}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">{t("subtitle")}</p>
        </div>
        <div className="w-full lg:max-w-md">
          <HomeSearchBar totalProducts={totalProducts} />
        </div>
      </div>

      {/* Quick action cards */}
      <div className="mb-6 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <QuickActionCard
          href="/deals"
          icon={TagIcon}
          label={t("quickActions.deals")}
          description={t("quickActions.dealsDescription")}
        />
        <QuickActionCard
          href="/favorites"
          icon={HeartIcon}
          label={t("quickActions.favorites")}
          description={
            favoritesTotal !== null
              ? t("quickActions.favoritesDescription", { count: favoritesTotal })
              : t("quickActions.favoritesViewAll")
          }
        />
        <QuickActionCard
          href="/products"
          icon={PackageIcon}
          label={t("quickActions.products")}
          description={t("quickActions.productsDescription")}
        />
        <QuickActionCard
          href="/profile?tab=alerts"
          icon={BellIcon}
          label={t("quickActions.alerts")}
          description={t("quickActions.alertsActive", { count: alerts.length })}
        />
      </div>

      <div className="flex flex-col gap-6">
        {/* Favorites summary */}
        <DashboardSection
          title={t("sections.favorites")}
          icon={HeartIcon}
          href="/favorites"
          isEmpty={favorites.length === 0}
          emptyMessage={t("sections.favoritesEmpty")}
          isLoading={isLoading}
        >
          <MiniProductCarousel products={favorites} desktopLimit={12} />
        </DashboardSection>

        {/* Recently viewed */}
        <DashboardSection
          title={t("sections.recentlyViewed")}
          icon={ClockIcon}
          isEmpty={recentlyViewed.length === 0}
          emptyMessage={t("sections.recentlyViewedEmpty")}
          isLoading={false}
        >
          <MiniProductCarousel products={recentlyViewed.slice(0, 24)} desktopLimit={6} />
        </DashboardSection>
      </div>

      {/* Active alerts */}
      {alerts.length > 0 && (
        <div className="mt-6">
          <DashboardSection
            title={t("sections.activeAlerts")}
            icon={BellIcon}
            href="/profile?tab=alerts"
            isEmpty={false}
            isLoading={isLoading}
          >
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {alerts.map((alert) => {
                const product = alert.store_products
                if (!product) return null
                return (
                  <Link
                    key={alert.id}
                    href={`/products/${product.id}`}
                    className="border-border hover:bg-accent flex items-center gap-2 rounded-lg border p-2.5 transition-colors"
                  >
                    <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md border bg-white">
                      {product.image ? (
                        <Image
                          src={product.image}
                          alt=""
                          fill
                          className="object-contain p-0.5"
                          sizes="32px"
                          unoptimized
                        />
                      ) : (
                        <div className="bg-muted/40 flex h-full w-full items-center justify-center">
                          <BellIcon className="text-muted-foreground size-3.5" />
                        </div>
                      )}
                    </div>
                    <span className="min-w-0 flex-1 truncate text-xs font-medium">{product.name}</span>
                    <span className="text-xs font-semibold tabular-nums">{formatPrice(product.price, locale)}</span>
                  </Link>
                )
              })}
            </div>
          </DashboardSection>
        </div>
      )}

      {/* CTA for new users with few favorites */}
      {!isLoading && favorites.length < 3 && (
        <Card className="mt-6 border-dashed">
          <CardContent className="flex items-center gap-4 p-4">
            <SparklesIcon className="text-primary size-8 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{t("ctaCard.title")}</p>
              <p className="text-muted-foreground text-xs">{t("ctaCard.body")}</p>
            </div>
            <Link
              href="/deals"
              className="bg-primary text-primary-foreground shrink-0 rounded-md px-3 py-1.5 text-xs font-medium"
            >
              {t("ctaCard.browseDeals")}
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Popular products discovery */}
      {heroProducts.length > 0 && (
        <DashboardSection
          title={t("sections.handpicked")}
          icon={PinIcon}
          href="/products"
          isEmpty={false}
          isLoading={false}
          className="mt-6"
        >
          <MiniProductCarousel products={heroProducts} desktopLimit={12} />
        </DashboardSection>
      )}
    </div>
  )
}

function QuickActionCard({
  href,
  icon: Icon,
  label,
  description,
}: {
  href: string
  icon: React.ElementType
  label: string
  description: string
}) {
  return (
    <Link
      href={href}
      className="bg-card hover:bg-accent border-border flex items-center gap-3 rounded-xl border p-3 transition-colors lg:p-4"
    >
      <div className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-lg">
        <Icon className="text-muted-foreground size-4" />
      </div>
      <div className="min-w-0">
        <p className="text-sm leading-tight font-semibold">{label}</p>
        <p className="text-muted-foreground truncate text-[11px]">{description}</p>
      </div>
    </Link>
  )
}

function DashboardSection({
  title,
  icon: Icon,
  href,
  isEmpty,
  emptyMessage,
  isLoading,
  className,
  children,
}: {
  title: string
  icon: React.ElementType
  href?: string
  isEmpty: boolean
  emptyMessage?: string
  isLoading: boolean
  className?: string
  children: React.ReactNode
}) {
  const t = useTranslations("home.personalizedDashboard.sections")
  return (
    <Card className={cn(className)}>
      <CardHeader className="flex flex-row items-center justify-between p-4 pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Icon className="text-muted-foreground size-4" />
          {title}
        </CardTitle>
        {href && (
          <Link href={href} className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs">
            {t("viewAll")}
            <ArrowRightIcon className="size-3" />
          </Link>
        )}
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {isLoading ? (
          <>
            <div className="grid grid-cols-3 gap-2 md:hidden">
              {Array.from({ length: 6 }).map((_, i) => (
                <MiniProductCardSkeleton key={i} />
              ))}
            </div>
            <div className="hidden grid-cols-4 gap-2 md:grid xl:grid-cols-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <MiniProductCardSkeleton key={i} />
              ))}
            </div>
          </>
        ) : isEmpty ? (
          <p className="text-muted-foreground py-6 text-center text-xs">{emptyMessage}</p>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  )
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, (i + 1) * size))
}

function MobileCarousel({ products }: { products: (FavoriteItem | RecentlyViewedItem | HeroProduct)[] }) {
  const [page, setPage] = useState(0)
  const pages = chunkArray(products, 6)
  const scrollRef = useRef<HTMLDivElement>(null)
  const productKey = products.map((p) => p.id).join(",")
  const t = useTranslations("home.personalizedDashboard.carousel")

  const updatePageFromScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el || pages.length <= 1) return
    const w = el.clientWidth
    if (w <= 0) return
    const idx = Math.round(el.scrollLeft / w)
    setPage(Math.min(Math.max(0, idx), pages.length - 1))
  }, [pages.length])

  useEffect(() => {
    const el = scrollRef.current
    if (!el || pages.length <= 1) return
    el.addEventListener("scroll", updatePageFromScroll, { passive: true })
    return () => el.removeEventListener("scroll", updatePageFromScroll)
  }, [pages.length, updatePageFromScroll])

  useEffect(() => {
    const onResize = () => {
      const el = scrollRef.current
      if (!el || pages.length <= 1) return
      const w = el.clientWidth
      if (w <= 0) return
      el.scrollLeft = page * w
      updatePageFromScroll()
    }
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [page, pages.length, updatePageFromScroll])

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollLeft = 0
    setPage(0)
  }, [productKey])

  const goToPage = (i: number) => {
    const el = scrollRef.current
    if (!el) return
    const w = el.clientWidth
    el.scrollTo({ left: i * w, behavior: "smooth" })
    setPage(i)
  }

  if (pages.length <= 1) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {products.map((p) => (
          <MiniProductCard key={p.id} product={p} />
        ))}
      </div>
    )
  }

  return (
    <div>
      <div
        ref={scrollRef}
        role="region"
        aria-roledescription="carousel"
        aria-label={t("ariaProducts")}
        className={cn(
          // items-start: avoid stretching short pages to the tallest page’s height (e.g. last page with 1 item).
          "flex w-full min-w-0 snap-x snap-mandatory items-start overflow-x-auto overflow-y-hidden scroll-smooth",
          "overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          "[-webkit-overflow-scrolling:touch]",
        )}
        style={{ touchAction: "pan-x pan-y" }}
      >
        {pages.map((pageProducts, i) => (
          <div key={i} className="grid w-full shrink-0 grow-0 basis-full snap-start grid-cols-3 gap-2">
            {pageProducts.map((p) => (
              <MiniProductCard key={p.id} product={p} />
            ))}
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-center gap-1.5">
        {pages.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goToPage(i)}
            aria-label={t("ariaPage", { page: i + 1, total: pages.length })}
            aria-current={i === page ? "true" : undefined}
            className={cn(
              "rounded-full transition-all duration-200",
              i === page
                ? "bg-foreground h-1.5 w-4"
                : "bg-muted-foreground/30 hover:bg-muted-foreground/50 h-1.5 w-1.5",
            )}
          />
        ))}
      </div>
    </div>
  )
}

function MiniProductCarousel({
  products,
  desktopLimit,
}: {
  products: (FavoriteItem | RecentlyViewedItem | HeroProduct)[]
  desktopLimit?: number
}) {
  const desktopProducts = desktopLimit ? products.slice(0, desktopLimit) : products

  return (
    <>
      {/* Mobile: swipe carousel, 3 cols × 2 rows per page */}
      <div className="md:hidden">
        <MobileCarousel products={products} />
      </div>

      {/* Desktop: flowing grid, no paging: 4 cols up to xl, then 6 */}
      <div className="hidden grid-cols-4 gap-2 md:grid xl:grid-cols-6">
        {desktopProducts.map((p) => (
          <MiniProductCard key={p.id} product={p} />
        ))}
      </div>
    </>
  )
}

function MiniProductCard({ product }: { product: FavoriteItem | RecentlyViewedItem | HeroProduct }) {
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
            className="rounded-lg object-contain p-1.5 pb-0"
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
          <div className="bg-primary text-primary-foreground absolute top-1.5 left-1.5 rounded px-1 py-0.5 text-[10px] leading-none font-bold">
            {formatDiscountPercentWithMinus(discount!, 0)}
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

function MiniProductCardPricePerUnit({
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
    <p className="text-2xs text-muted-foreground tabular-nums">
      {prefix}
      <span className="lowercase">{formattedMajorUnit}</span>
    </p>
  )
}
