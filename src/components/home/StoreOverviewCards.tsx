"use client"

import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { ArrowRightIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { SupermarketChainBadge } from "@/components/products/SupermarketChainBadge"
import type { PerStoreStats } from "@/lib/queries/home-stats"
import { isLocale, toLocaleTag } from "@/i18n/config"

export function StoreOverviewCards({
  perStore,
  variant = "grid",
  className,
}: {
  perStore: PerStoreStats[]
  variant?: "grid" | "stack"
  className?: string
}) {
  const localeRaw = useLocale()
  const tag = toLocaleTag(isLocale(localeRaw) ? localeRaw : "pt")
  const formatCount = (n: number) => n.toLocaleString(tag)
  const t = useTranslations("home.storeOverview")
  const tFilters = useTranslations("home.chainFilters")
  if (perStore.length === 0) return null

  if (variant === "stack") {
    return (
      <div className={cn("flex h-full flex-col gap-4", className)}>
        {perStore.map((store) => (
          <Link
            key={store.originId}
            href={`/products?origin=${store.originId}`}
            className={cn(
              "group hover:bg-foreground/5 dark:hover:bg-foreground/10 flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl bg-transparent px-3 py-3 text-center transition-colors dark:bg-transparent",
            )}
          >
            <SupermarketChainBadge originId={store.originId} variant="logo" className="h-4 w-auto" />
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold tabular-nums">{formatCount(store.total)}</span>
              <span className="text-muted-foreground text-xs">{tFilters("products")}</span>
            </div>
            {store.onDiscount > 0 && (
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                {tFilters("onSale", { count: formatCount(store.onDiscount) })}
              </span>
            )}
          </Link>
        ))}
      </div>
    )
  }

  return (
    <div className={cn("flex h-full flex-col gap-3", className)}>
      <p className="text-muted-foreground text-[11px] font-semibold tracking-widest uppercase">{t("title")}</p>
      <div className="grid flex-1 grid-cols-3 gap-3">
        {perStore.map((store) => (
          <Link
            key={store.originId}
            href={`/products?origin=${store.originId}`}
            className="bg-card/80 group flex flex-col items-center justify-center gap-2.5 rounded-2xl border p-5 text-center backdrop-blur-sm transition-all hover:scale-[1.02] hover:shadow-md"
          >
            <SupermarketChainBadge originId={store.originId} variant="logo" className="h-5 w-auto" />
            <div className="flex flex-col">
              <span className="text-2xl font-bold tabular-nums">{formatCount(store.total)}</span>
              <span className="text-muted-foreground text-xs">{tFilters("products")}</span>
            </div>
            {store.onDiscount > 0 && (
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                {tFilters("onSale", { count: formatCount(store.onDiscount) })}
              </span>
            )}
            <span className="text-muted-foreground flex items-center gap-1 text-xs opacity-0 transition-opacity group-hover:opacity-100">
              {t("browse")} <ArrowRightIcon className="size-3" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
