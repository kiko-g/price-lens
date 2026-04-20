"use client"

import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { TrendingDownIcon, TagIcon, WalletIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { HomeStats } from "@/lib/queries/home-stats"
import { isLocale, toLocaleTag } from "@/i18n/config"

type PulseStat = {
  key: string
  icon: typeof TrendingDownIcon
  value: string
  label: string
  shortLabel: string
  href: string
  iconColor: string
  bgTint: string
}

export function MarketPulseCard({ stats, variant = "card" }: { stats: HomeStats; variant?: "card" | "inline" }) {
  const localeRaw = useLocale()
  const locale = isLocale(localeRaw) ? localeRaw : "pt"
  const tag = toLocaleTag(locale)
  const formatNumber = (n: number) => n.toLocaleString(tag)
  const formatEuros = (n: number) => `€${n.toLocaleString(tag, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  const t = useTranslations("home.marketPulse")

  const items: PulseStat[] = [
    {
      key: "drops",
      icon: TrendingDownIcon,
      value: formatNumber(stats.priceDropsToday),
      label: t("drops.label"),
      shortLabel: t("drops.short"),
      href: "/products?sort=price-drop-smart",
      iconColor: "text-primary-800 dark:text-primary-300",
      bgTint: "bg-primary/4 dark:bg-primary-400/6 md:bg-primary/8 md:dark:bg-primary-400/10",
    },
    {
      key: "discount",
      icon: TagIcon,
      value: formatNumber(stats.productsOnDiscount),
      label: t("discount.label"),
      shortLabel: t("discount.short"),
      href: "/products?discounted=true&sort=best-discount",
      iconColor: "text-secondary-800 dark:text-secondary-300",
      bgTint: "bg-secondary/4 dark:bg-secondary/6 md:bg-secondary/8 md:dark:bg-secondary/10",
    },
  ]

  if (stats.totalDiscountSavingsEuros > 0) {
    items.push({
      key: "savings",
      icon: WalletIcon,
      value: formatEuros(stats.totalDiscountSavingsEuros),
      label: t("savings.label"),
      shortLabel: t("savings.short"),
      href: "/products?discounted=true&sort=best-discount",
      iconColor: "dark:text-pink-200 text-pink-800",
      bgTint: "bg-pink-400/4 dark:bg-pink-400/6 md:bg-pink-400/8 md:dark:bg-pink-400/10",
    })
  }

  if (variant === "inline") {
    return (
      <div className="flex flex-wrap items-center gap-2.5">
        {items.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className={cn(
              "group flex items-center gap-2.5 rounded-full px-4 py-2 transition-all hover:scale-[1.02]",
              item.bgTint,
            )}
          >
            <item.icon className={cn("size-4 shrink-0", item.iconColor)} />
            <span className="text-base font-bold tabular-nums">{item.value}</span>
            <span className="text-muted-foreground text-sm">{item.label}</span>
          </Link>
        ))}
      </div>
    )
  }

  return (
    <div className="flex max-w-full flex-row flex-wrap items-start justify-center gap-x-4 gap-y-2 self-center sm:gap-x-6 sm:gap-y-0 lg:flex-nowrap lg:justify-start">
      {items.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className="group flex min-w-21 flex-col items-center gap-0.5 active:opacity-70 sm:min-w-0 sm:gap-0"
        >
          <span className="text-base font-bold tracking-tight tabular-nums sm:text-lg">{item.value}</span>
          <span className="text-muted-foreground text-[11px] leading-tight max-[380px]:text-[10px] sm:leading-none">
            {item.shortLabel}
          </span>
        </Link>
      ))}
    </div>
  )
}
