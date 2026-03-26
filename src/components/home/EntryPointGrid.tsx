"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"

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
    mobileBg: "bg-foreground/5 dark:bg-foreground/5",
    mobileTint: "bg-linear-to-br from-blue-400/5 to-blue-500/10 dark:from-blue-400/15 dark:to-blue-500/15",
    shownOnDesktop: true,
    shownOnMobile: true,
  },
  {
    label: "Price Drops",
    description: "Biggest drops",
    href: "/products?sort=price-drop",
    icon: TrendingDownIcon,
    iconColor: "text-emerald-600 dark:text-emerald-400",
    iconBg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    border: "border-emerald-200/50 dark:border-emerald-500/20",
    mobileBg: "bg-foreground/5 dark:bg-foreground/5",
    mobileTint: "bg-linear-to-br from-indigo-400/5 to-indigo-500/10 dark:from-indigo-400/15 dark:to-indigo-500/15",
    shownOnDesktop: true,
    shownOnMobile: true,
  },
  {
    label: "Best Discounts",
    description: "On sale now",
    href: "/products?discounted=true&sort=best-discount",
    icon: TicketPercentIcon,
    iconColor: "text-violet-600 dark:text-violet-400",
    iconBg: "bg-violet-500/10 dark:bg-violet-500/20",
    border: "border-violet-200/50 dark:border-violet-500/20",
    mobileBg: "bg-foreground/5 dark:bg-foreground/5",
    mobileTint: "bg-linear-to-br from-violet-400/5 to-violet-500/10 dark:from-violet-400/15 dark:to-violet-500/15",
    shownOnDesktop: true,
    shownOnMobile: true,
  },
  {
    label: "Essential",
    description: "Top tracked",
    href: "/products?priority=4,5",
    icon: AppleIcon,
    iconColor: "text-rose-600 dark:text-rose-400",
    iconBg: "bg-rose-500/10 dark:bg-rose-500/20",
    border: "border-rose-200/50 dark:border-rose-500/20",
    mobileBg: "bg-foreground/5 dark:bg-foreground/5",
    mobileTint: "bg-linear-to-br from-rose-400/5 to-rose-500/10 dark:from-rose-400/15 dark:to-rose-500/15",
    shownOnDesktop: true,
    shownOnMobile: false,
  },
] as const

export function EntryPointGrid({ variant = "grid" }: { variant?: "grid" | "row" }) {
  const isMobile = useIsMobile()
  const shown = isMobile ? "shownOnMobile" : "shownOnDesktop"
  const entryPointsFiltered = entryPoints.filter((entry) => entry[shown as keyof typeof entry])

  if (variant === "row") {
    return (
      <div className="flex w-full items-center justify-center gap-2.5 lg:justify-start lg:gap-2.5">
        {entryPointsFiltered.map((entry) => (
          <Link
            key={entry.label}
            href={entry.href}
            className={cn(
              "text-foreground hover:bg-accent bg-accent/50 flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm font-medium tracking-tight transition-colors md:gap-1.5 md:px-3.5 md:py-1.5 md:tracking-normal",
              isMobile ? entry.mobileBg : "",
            )}
          >
            <entry.icon className="text-foreground size-3.5" />
            <span>{entry.label}</span>
          </Link>
        ))}
      </div>
    )
  }

  return (
    <div className="grid w-full grid-cols-2 gap-2">
      {entryPointsFiltered.map((entry) => (
        <Link
          key={entry.label}
          href={entry.href}
          className="active:bg-accent bg-accent/50 flex items-center gap-2.5 rounded-xl px-3 py-2 transition-colors"
        >
          <entry.icon className="text-foreground size-4 shrink-0" />
          <div className="ml-0.5 flex min-w-0 flex-col items-start">
            <span className="text-sm font-semibold tracking-tight">{entry.label}</span>
            <span className="text-muted-foreground text-[11px]">{entry.description}</span>
          </div>
        </Link>
      ))}
    </div>
  )
}
