"use client"

import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { SupermarketChainBadge } from "@/components/products/SupermarketChainBadge"
import type { PerStoreStats } from "@/lib/queries/home-stats"
import { isLocale, toLocaleTag } from "@/i18n/config"

export function ChainQuickFilters({ perStore, className }: { perStore: PerStoreStats[]; className?: string }) {
  const localeRaw = useLocale()
  const tag = toLocaleTag(isLocale(localeRaw) ? localeRaw : "pt")
  const formatCount = (n: number) => n.toLocaleString(tag)
  const t = useTranslations("home.chainFilters")
  if (perStore.length === 0) return null

  return (
    <div className={cn("grid w-full grid-cols-3 gap-1.5 sm:gap-2", className)}>
      {perStore.map((store) => (
        <Link
          key={store.originId}
          href={`/products?origin=${store.originId}`}
          className="bg-card/80 hover:bg-accent flex min-h-18 flex-col items-center justify-center gap-0.5 rounded-2xl px-1.5 py-2 text-center backdrop-blur-sm transition-colors sm:min-h-0 sm:px-2 sm:py-2.5"
        >
          <SupermarketChainBadge originId={store.originId} variant="logo" className="h-4 w-auto" />
          <div className="flex flex-col items-center">
            <span className="text-xs leading-snug font-bold tabular-nums sm:text-sm">{formatCount(store.total)}</span>
            <span className="text-muted-foreground text-[9px] sm:text-[10px]">{t("products")}</span>
          </div>
          {store.onDiscount > 0 && (
            <span className="text-[9px] leading-tight font-semibold text-emerald-600 sm:text-[10px] dark:text-emerald-400">
              {t("onSale", { count: formatCount(store.onDiscount) })}
            </span>
          )}
        </Link>
      ))}
    </div>
  )
}
