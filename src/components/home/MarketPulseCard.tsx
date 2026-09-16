"use client"

import { useLocale, useTranslations } from "next-intl"

import { cn } from "@/lib/utils"
import type { HomeStats } from "@/lib/queries/home-stats"
import { isLocale, toLocaleTag } from "@/i18n/config"
import { Stat, sparkFromValue } from "@/components/ui/stat"

type PulseStat = {
  key: string
  value: string
  label: string
  shortLabel: string
  href: string
  raw: number
}

/**
 * Market pulse — the three live numbers shown as Lince HUD stat cards.
 * `inline` = desktop hero row; `card` = compact mobile grid.
 */
export function MarketPulseCard({ stats, variant = "card" }: { stats: HomeStats; variant?: "card" | "inline" }) {
  const localeRaw = useLocale()
  const locale = isLocale(localeRaw) ? localeRaw : "pt"
  const tag = toLocaleTag(locale)
  const formatNumber = (n: number) => n.toLocaleString(tag)
  const formatEuros = (n: number) =>
    `${n.toLocaleString(tag, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €`
  const t = useTranslations("home.marketPulse")

  const items: PulseStat[] = [
    {
      key: "drops",
      raw: stats.priceDropsToday,
      value: formatNumber(stats.priceDropsToday),
      label: t("drops.label"),
      shortLabel: t("drops.short"),
      href: "/products?sort=price-drop-smart",
    },
    {
      key: "discount",
      raw: stats.productsOnDiscount,
      value: formatNumber(stats.productsOnDiscount),
      label: t("discount.label"),
      shortLabel: t("discount.short"),
      href: "/products?discounted=true&sort=best-discount",
    },
  ]

  if (stats.totalDiscountSavingsEuros > 0) {
    items.push({
      key: "savings",
      raw: stats.totalDiscountSavingsEuros,
      value: formatEuros(stats.totalDiscountSavingsEuros),
      label: t("savings.label"),
      shortLabel: t("savings.short"),
      href: "/products?discounted=true&sort=best-discount",
    })
  }

  return (
    <div
      className={cn("grid gap-3", variant === "inline" ? "grid-cols-3" : "grid-cols-2 [&>*:nth-child(3)]:col-span-2")}
    >
      {items.map((item) => (
        <Stat
          key={item.key}
          href={item.href}
          label={variant === "inline" ? item.label : item.shortLabel}
          value={item.value}
          spark={sparkFromValue(item.raw)}
          className={variant === "card" ? "min-h-[84px] px-3.5 py-3 [&_span.tabular-nums]:text-2xl" : undefined}
        />
      ))}
    </div>
  )
}
