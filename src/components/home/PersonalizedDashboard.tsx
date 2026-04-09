"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useUser } from "@/hooks/useUser"
import { useRecentlyViewed, type RecentlyViewedItem } from "@/hooks/useRecentlyViewed"
import { STORE_NAMES } from "@/types/business"
import { cn } from "@/lib/utils"
import { discountValueToPercentage } from "@/lib/business/product"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { SupermarketChainBadge } from "@/components/products/SupermarketChainBadge"
import { HomeSearchBar } from "@/components/home/HomeSearchBar"

import {
  BellIcon,
  HeartIcon,
  TrendingDownIcon,
  ClockIcon,
  ArrowRightIcon,
  TagIcon,
  PackageIcon,
  SparklesIcon,
} from "lucide-react"

interface FavoriteItem {
  id: number
  name: string
  brand: string | null
  image: string | null
  price: number
  origin_id: number
  discount: number | null
  price_recommended: number | null
  price_per_major_unit: number | null
  major_unit: string | null
  pack: string | null
}

interface AlertItem {
  id: number
  store_product_id: number
  store_products: FavoriteItem
}

export function PersonalizedDashboard({ totalProducts }: { totalProducts: number }) {
  const { user, profile } = useUser()
  const { items: recentlyViewed } = useRecentlyViewed()
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [favoritesTotal, setFavoritesTotal] = useState<number | null>(null)
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const firstName = profile?.full_name?.split(" ")[0] || user?.user_metadata?.full_name?.split(" ")[0] || "there"

  useEffect(() => {
    if (!user) return

    Promise.all([fetch("/api/favorites?limit=18").then((r) => r.json()), fetch("/api/alerts").then((r) => r.json())])
      .then(([favData, alertData]) => {
        setFavorites(favData.data?.map((f: { store_products: FavoriteItem }) => f.store_products).filter(Boolean) || [])
        setFavoritesTotal(favData.pagination?.totalCount ?? favData.data?.length ?? null)
        setAlerts(alertData.alerts?.slice(0, 4) || [])
        setIsLoading(false)
      })
      .catch(() => setIsLoading(false))
  }, [user])

  return (
    <div className="z-20 mx-auto w-full max-w-7xl px-4 py-6 lg:px-8 lg:py-10">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
            <span className="text-muted-foreground font-normal">Welcome back,</span> {firstName}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Track prices, catch deals, and save money on groceries.</p>
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
          label="Deals"
          description="Price drops & discounts"
          hue="emerald"
        />
        <QuickActionCard
          href="/favorites"
          icon={HeartIcon}
          label="Favorites"
          description={favoritesTotal !== null ? `${favoritesTotal} products` : "View all"}
          hue="rose"
        />
        <QuickActionCard href="/products" icon={PackageIcon} label="Products" description="Browse all" hue="blue" />
        <QuickActionCard
          href="/profile?tab=alerts"
          icon={BellIcon}
          label="Alerts"
          description={`${alerts.length} active`}
          hue="amber"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Favorites summary */}
        <DashboardSection
          title="Your Favorites"
          icon={HeartIcon}
          href="/favorites"
          isEmpty={favorites.length === 0}
          emptyMessage="No favorites yet. Browse products and tap the heart icon to start tracking."
          isLoading={isLoading}
        >
          <MiniProductCarousel products={favorites} />
        </DashboardSection>

        {/* Recently viewed */}
        <DashboardSection
          title="Recently Viewed"
          icon={ClockIcon}
          isEmpty={recentlyViewed.length === 0}
          emptyMessage="Products you view will appear here."
          isLoading={false}
        >
          <MiniProductCarousel products={recentlyViewed.slice(0, 18)} />
        </DashboardSection>
      </div>

      {/* Active alerts */}
      {alerts.length > 0 && (
        <div className="mt-6">
          <DashboardSection
            title="Active Alerts"
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
                    <BellIcon className="size-3.5 shrink-0 text-amber-500" />
                    <span className="min-w-0 flex-1 truncate text-xs font-medium">{product.name}</span>
                    <span className="text-xs font-semibold tabular-nums">{product.price.toFixed(2)}€</span>
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
              <p className="text-sm font-medium">Get more from Price Lens</p>
              <p className="text-muted-foreground text-xs">
                Favorite products, set price alerts, and browse deals to start saving on groceries.
              </p>
            </div>
            <Link
              href="/deals"
              className="bg-primary text-primary-foreground shrink-0 rounded-md px-3 py-1.5 text-xs font-medium"
            >
              Browse deals
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

const hueClasses = {
  emerald: { bg: "bg-emerald-500/10" },
  rose: { bg: "bg-rose-500/10" },
  blue: { bg: "bg-blue-500/10" },
  amber: { bg: "bg-amber-500/10" },
} as const

function QuickActionCard({
  href,
  icon: Icon,
  label,
  description,
  hue,
}: {
  href: string
  icon: React.ElementType
  label: string
  description: string
  hue: keyof typeof hueClasses
}) {
  const { bg } = hueClasses[hue]
  return (
    <Link
      href={href}
      className="bg-card hover:bg-accent border-border flex items-center gap-3 rounded-xl border p-3 transition-colors lg:p-4"
    >
      <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", bg)}>
        <Icon className="text-foreground size-4" />
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
  children,
}: {
  title: string
  icon: React.ElementType
  href?: string
  isEmpty: boolean
  emptyMessage?: string
  isLoading: boolean
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between p-4 pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Icon className="text-muted-foreground size-4" />
          {title}
        </CardTitle>
        {href && (
          <Link href={href} className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs">
            View all
            <ArrowRightIcon className="size-3" />
          </Link>
        )}
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {isLoading ? (
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
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

function MiniProductCarousel({ products }: { products: (FavoriteItem | RecentlyViewedItem)[] }) {
  const [page, setPage] = useState(0)
  const pages = chunkArray(products, 6)
  const dragStartX = useRef<number | null>(null)

  const handlePointerDown = (e: React.PointerEvent) => {
    dragStartX.current = e.clientX
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragStartX.current === null) return
    const dx = dragStartX.current - e.clientX
    if (Math.abs(dx) > 40) {
      if (dx > 0) setPage((p) => Math.min(p + 1, pages.length - 1))
      else setPage((p) => Math.max(p - 1, 0))
    }
    dragStartX.current = null
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
    <div className="select-none">
      <div
        className="overflow-hidden"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => {
          dragStartX.current = null
        }}
      >
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${page * 100}%)` }}
        >
          {pages.map((pageProducts, i) => (
            <div key={i} className="grid min-w-full grid-cols-3 gap-2">
              {pageProducts.map((p) => (
                <MiniProductCard key={p.id} product={p} />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Pagination dots */}
      <div className="mt-3 flex items-center justify-center gap-1.5">
        {pages.map((_, i) => (
          <button
            key={i}
            onClick={() => setPage(i)}
            aria-label={`Page ${i + 1}`}
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

function MiniProductCard({ product }: { product: FavoriteItem | RecentlyViewedItem }) {
  const discount = "discount" in product ? product.discount : null
  const priceRecommended = "price_recommended" in product ? product.price_recommended : null
  const pricePerUnit = "price_per_major_unit" in product ? product.price_per_major_unit : null
  const majorUnit = "major_unit" in product ? product.major_unit : null

  const hasDiscount = Boolean(discount && discount > 0)
  const hasStrikethrough = Boolean(priceRecommended && priceRecommended > product.price)

  return (
    <Link
      href={`/products/${product.id}`}
      className="bg-card hover:bg-accent border-border flex flex-col overflow-hidden rounded-xl border transition-colors"
    >
      {/* Image */}
      <div className="relative aspect-square w-full bg-white">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="rounded-lg object-contain p-2"
            sizes="160px"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <PackageIcon className="text-muted-foreground/40 size-8" />
          </div>
        )}

        {/* Discount badge — overlaid on image */}
        {hasDiscount && (
          <div className="bg-primary text-primary-foreground absolute top-1.5 left-1.5 rounded px-1 py-0.5 text-[10px] leading-none font-bold">
            -{discountValueToPercentage(discount!, 0)}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-0.5 p-2">
        <p className="text-foreground line-clamp-2 text-[11px] leading-tight font-medium">{product.name}</p>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-x-1 gap-y-0.5">
          <div className="flex flex-wrap items-baseline gap-x-1">
            <span
              className={cn(
                "text-xs font-semibold tabular-nums",
                hasDiscount ? "text-emerald-600 dark:text-emerald-400" : "text-foreground",
              )}
            >
              {product.price.toFixed(2)}€
            </span>
            {hasStrikethrough && (
              <span className="text-muted-foreground tabular-nums line-through" style={{ fontSize: "10px" }}>
                {priceRecommended!.toFixed(2)}€
              </span>
            )}
          </div>
          <SupermarketChainBadge originId={product.origin_id} variant="logoSmall" />
        </div>
        {pricePerUnit && majorUnit && (
          <p className="text-muted-foreground tabular-nums" style={{ fontSize: "10px" }}>
            {pricePerUnit.toFixed(2)}€/{majorUnit}
          </p>
        )}
      </div>
    </Link>
  )
}
