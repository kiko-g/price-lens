"use client"

import { useLocale, useTranslations } from "next-intl"

import type { HomeStats } from "@/lib/queries/home-stats"
import { isLocale, toLocaleTag } from "@/i18n/config"
import { Stat } from "@/components/ui/stat"
import { cn } from "@/lib/utils"

type PulseStat = {
  key: string
  value: string
  label: string
  href: string
}

/**
 * Three live shelf numbers. The third is discount savings when we have them,
 * otherwise the size of the catalog, so the row never collapses from 3 to 2.
 * No decorative spark: a fake trend reads as data.
 */
export function MarketPulseCard({ stats }: { stats: HomeStats }) {
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
      value: formatNumber(stats.priceDropsToday),
      label: t("drops.label"),
      href: "/products?sort=price-drop-smart",
    },
    {
      key: "discount",
      value: formatNumber(stats.productsOnDiscount),
      label: t("discount.label"),
      href: "/products?discounted=true&sort=best-discount",
    },
    stats.totalDiscountSavingsEuros > 0
      ? {
          key: "savings",
          value: formatEuros(stats.totalDiscountSavingsEuros),
          label: t("savings.label"),
          href: "/products?discounted=true&sort=best-discount",
        }
      : {
          key: "tracked",
          value: formatNumber(stats.totalProducts),
          label: t("tracked.label"),
          href: "/products",
        },
  ]

  return (
    <section aria-labelledby="market-pulse-heading">
      <div className="mb-3">
        <h2 id="market-pulse-heading" className="text-sm font-semibold tracking-tight">
          {t("heading")}
        </h2>
        <p className="text-muted-foreground mt-0.5 text-xs">{t("hint")}</p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
        {items.map((item, index) => (
          <Stat
            key={item.key}
            href={item.href}
            label={item.label}
            value={item.value}
            className={cn(index === 2 && "col-span-2 sm:col-span-1")}
          />
        ))}
      </div>
    </section>
  )
}
