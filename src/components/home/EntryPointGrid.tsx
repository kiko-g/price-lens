"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"

import { ShoppingBasketIcon, TrendingDownIcon, TicketPercentIcon, AppleIcon } from "lucide-react"

const entryPoints = [
  {
    key: "browseAll",
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
    key: "priceDrops",
    href: "/products?sort=price-drop-smart",
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
    key: "bestDiscounts",
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
    key: "essential",
    href: "/products?priority=4,5",
    icon: AppleIcon,
    iconColor: "text-rose-600 dark:text-rose-400",
    iconBg: "bg-rose-500/10 dark:bg-rose-500/20",
    border: "border-rose-200/50 dark:border-rose-500/20",
    mobileBg: "bg-foreground/5 dark:bg-foreground/5",
    mobileTint: "bg-linear-to-br from-rose-400/5 to-rose-500/10 dark:from-rose-400/15 dark:to-rose-500/15",
    shownOnDesktop: true,
    shownOnMobile: false,
    shownOnNarrowMobile: true,
  },
] as const

function rowVariantEntries(isMobile: boolean) {
  if (!isMobile) return entryPoints.filter((entry) => entry.shownOnDesktop)
  return entryPoints.filter((entry) => entry.shownOnMobile || entry.shownOnNarrowMobile === true)
}

export function EntryPointGrid({ variant = "grid" }: { variant?: "grid" | "row" }) {
  const isMobile = useIsMobile()
  const t = useTranslations("home.entryPoints")
  const shown = isMobile ? "shownOnMobile" : "shownOnDesktop"
  const entryPointsFiltered = entryPoints.filter((entry) => entry[shown as keyof typeof entry])
  const rowEntries = rowVariantEntries(isMobile)

  if (variant === "row") {
    if (isMobile) {
      return (
        <div className="grid w-full grid-cols-2 gap-1.5">
          {rowEntries.map((entry) => (
            <Link
              key={entry.key}
              href={entry.href}
              className={cn(
                "bg-muted/35 border-border/60 text-muted-foreground hover:bg-muted/55 hover:text-foreground flex min-h-13 flex-col items-center justify-center gap-0.5 rounded-xl border px-1 py-1.5 text-center transition-colors active:opacity-90",
              )}
            >
              <entry.icon className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
              <span className="text-foreground text-[10px] leading-tight font-medium">
                {t(`${entry.key}.label` as const)}
              </span>
            </Link>
          ))}
        </div>
      )
    }

    return (
      <div className={cn("flex w-full items-center gap-2.5", "justify-center lg:justify-start")}>
        {rowEntries.map((entry) => (
          <Link
            key={entry.key}
            href={entry.href}
            className={cn(
              "text-foreground hover:bg-accent bg-accent/50 flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm font-medium tracking-tight transition-colors md:gap-1.5 md:px-3.5 md:py-1.5 md:tracking-normal",
            )}
          >
            <entry.icon className="text-foreground size-3.5 shrink-0" />
            <span className="whitespace-nowrap">{t(`${entry.key}.label` as const)}</span>
          </Link>
        ))}
      </div>
    )
  }

  return (
    <div className="grid w-full grid-cols-2 gap-2">
      {entryPointsFiltered.map((entry) => (
        <Link
          key={entry.key}
          href={entry.href}
          className="active:bg-accent bg-accent/50 flex items-center gap-2.5 rounded-xl px-3 py-2 transition-colors"
        >
          <entry.icon className="text-foreground size-4 shrink-0" />
          <div className="ml-0.5 flex min-w-0 flex-col items-start">
            <span className="text-sm font-semibold tracking-tight">{t(`${entry.key}.label` as const)}</span>
            <span className="text-muted-foreground text-[11px]">{t(`${entry.key}.description` as const)}</span>
          </div>
        </Link>
      ))}
    </div>
  )
}
