"use client"

import Link from "next/link"
import { ShoppingBasketIcon, TrendingDownIcon, TicketPercentIcon, AppleIcon } from "lucide-react"

const entryPoints = [
  {
    label: "Browse All",
    description: "Full catalog",
    href: "/products",
    icon: ShoppingBasketIcon,
    iconColor: "text-blue-600 dark:text-blue-400",
    iconBg: "bg-blue-500/10 dark:bg-blue-500/20",
    border: "border-blue-200/50 dark:border-blue-500/20",
  },
  {
    label: "Price Drops",
    description: "Biggest drops",
    href: "/products?sort=price-drop",
    icon: TrendingDownIcon,
    iconColor: "text-emerald-600 dark:text-emerald-400",
    iconBg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    border: "border-emerald-200/50 dark:border-emerald-500/20",
  },
  {
    label: "Best Discounts",
    description: "On sale now",
    href: "/products?discounted=true&sort=best-discount",
    icon: TicketPercentIcon,
    iconColor: "text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-500/10 dark:bg-amber-500/20",
    border: "border-amber-200/50 dark:border-amber-500/20",
  },
  {
    label: "Essential",
    description: "Top tracked",
    href: "/products?priority=5",
    icon: AppleIcon,
    iconColor: "text-rose-600 dark:text-rose-400",
    iconBg: "bg-rose-500/10 dark:bg-rose-500/20",
    border: "border-rose-200/50 dark:border-rose-500/20",
  },
] as const

export function EntryPointGrid({ variant = "grid" }: { variant?: "grid" | "row" }) {
  if (variant === "row") {
    return (
      <div className="flex w-full items-center gap-2">
        {entryPoints.map((entry) => (
          <Link
            key={entry.label}
            href={entry.href}
            className="text-foreground hover:bg-accent bg-accent/50 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors"
          >
            <entry.icon className="text-primary-900 dark:text-primary-200/60 size-3.5" />
            <span>{entry.label}</span>
          </Link>
        ))}
      </div>
    )
  }

  return (
    <div className="grid w-full grid-cols-2 gap-2">
      {entryPoints.map((entry) => (
        <Link
          key={entry.label}
          href={entry.href}
          className="active:bg-accent bg-accent/50 flex items-center gap-2.5 rounded-xl px-3 py-2 transition-colors"
        >
          <entry.icon className="text-primary-900 dark:text-primary-200/60 size-4 shrink-0" />
          <div className="ml-0.5 flex min-w-0 flex-col items-start">
            <span className="text-sm font-semibold tracking-tight">{entry.label}</span>
            <span className="text-muted-foreground text-[11px]">{entry.description}</span>
          </div>
        </Link>
      ))}
    </div>
  )
}
