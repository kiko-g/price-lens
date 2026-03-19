"use client"

import Link from "next/link"
import { TrendingDownIcon, TagIcon, WalletIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { HomeStats } from "@/lib/queries/home-stats"

function formatNumber(n: number): string {
  return n.toLocaleString("pt-PT")
}

function formatEuros(n: number): string {
  return `€${n.toLocaleString("pt-PT", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

type PulseStat = {
  icon: typeof TrendingDownIcon
  value: string
  label: string
  href: string
  iconColor: string
  bgTint: string
}

function buildPulseStats(stats: HomeStats): PulseStat[] {
  const items: PulseStat[] = [
    {
      icon: TrendingDownIcon,
      value: formatNumber(stats.priceDropsToday),
      label: "price drops today",
      href: "/products?sort=price-drop",
      iconColor: "text-primary-800 dark:text-primary-300",
      bgTint: "bg-primary/4 dark:bg-primary-400/6 md:bg-primary/6 md:dark:bg-primary-400/5",
    },
    {
      icon: TagIcon,
      value: formatNumber(stats.productsOnDiscount),
      label: "on discount now",
      href: "/products?discounted=true&sort=best-discount",
      iconColor: "text-secondary-800 dark:text-secondary-300",
      bgTint: "bg-secondary/4 dark:bg-secondary/6 md:bg-secondary/6 md:dark:bg-secondary/5",
    },
  ]

  if (stats.totalDiscountSavingsEuros > 0) {
    items.push({
      icon: WalletIcon,
      value: formatEuros(stats.totalDiscountSavingsEuros),
      label: "in savings on sale",
      href: "/products?discounted=true&sort=best-discount",
      iconColor: "dark:text-pink-200 text-pink-800",
      bgTint: "bg-pink-400/4 dark:bg-pink-400/6 md:bg-pink-400/6 md:dark:bg-pink-400/5",
    })
  }

  return items
}

export function MarketPulseCard({ stats, variant = "card" }: { stats: HomeStats; variant?: "card" | "inline" }) {
  const items = buildPulseStats(stats)

  if (variant === "inline") {
    return (
      <div className="flex flex-wrap items-center gap-2.5">
        {items.map((item) => (
          <Link
            key={item.label}
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
    <div className="flex flex-row justify-center gap-3 self-center md:justify-start">
      {items.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className={cn(
            "group active:bg-accent/40 flex flex-col justify-center gap-1 rounded-xl p-3 transition-colors",
            item.bgTint,
          )}
        >
          <span className="text-muted-foreground text-[11px]">{item.label}</span>
          <span className="text-center text-xl font-bold tracking-tight tabular-nums md:text-left">{item.value}</span>
        </Link>
      ))}
    </div>
  )
}
