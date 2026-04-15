"use client"

import Link from "next/link"

import type { PricePoint, StoreProduct } from "@/types"
import { cn } from "@/lib/utils"
import { getProductDealSummary, type DealSummaryTier } from "@/lib/business/product-deal-summary"

import { Badge, BadgeKind } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { SupermarketChainBadge } from "@/components/products/SupermarketChainBadge"
import {
  AlertCircleIcon,
  BadgeCheckIcon,
  BarChart2Icon,
  BinocularsIcon,
  CircleQuestionMarkIcon,
  ClockIcon,
  InfoIcon,
  LucideIcon,
} from "lucide-react"

export type CheaperElsewhereHint = {
  originId: number
  saveAmount: number
  href: string
}

type DealSummaryCardProps = {
  sp: StoreProduct
  pricePoints: PricePoint[] | null
  mostCommon: PricePoint | null
  /** From analytics.dateRange.daysBetween: improves “rare” vs “new price” labeling */
  historyDays?: number
  isLoading: boolean
  cheaperHint?: CheaperElsewhereHint | null
  className?: string
}

function CheaperElsewhereInline({ hint }: { hint: CheaperElsewhereHint }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <span className="text-muted-foreground text-sm font-medium">Cheaper at another store</span>
      <Link
        href={hint.href}
        className="focus-visible:ring-ring focus-visible:ring-offset-background inline-flex items-center justify-center rounded-md border border-neutral-200 bg-white px-2 py-1 shadow-sm transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none dark:border-white/25"
        aria-label={`View cheaper price at partner store (save ${hint.saveAmount.toFixed(2)}€)`}
      >
        <SupermarketChainBadge originId={hint.originId} variant="logoSmall" />
      </Link>
      <span className="text-primary text-xs font-semibold tabular-nums">−{hint.saveAmount.toFixed(2)}€</span>
    </div>
  )
}

export function DealSummaryCard({
  sp,
  pricePoints,
  mostCommon,
  historyDays = 0,
  isLoading,
  cheaperHint,
  className,
}: DealSummaryCardProps) {
  if (isLoading) {
    return <Skeleton variant="shimmer" className={cn("h-24 w-full rounded-xl", className)} />
  }

  const deal = getProductDealSummary(sp, pricePoints, mostCommon, { historyDays })

  if (!deal && !cheaperHint) return null

  const tier: DealSummaryTier = deal?.tier ?? "middle"

  const resolveDealMetadata = (tier: DealSummaryTier): { icon: LucideIcon; ring: string; badgeVariant: BadgeKind } => {
    if (tier === "habitual")
      return {
        icon: BadgeCheckIcon,
        ring: "bg-primary/15 text-primary",
        badgeVariant: "glass-primary",
      }
    if (tier === "nascent")
      return {
        icon: ClockIcon,
        ring: "bg-muted text-muted-foreground",
        badgeVariant: "outline",
      }
    if (tier === "infrequent")
      return {
        icon: AlertCircleIcon,
        ring: "bg-success/10 text-success",
        badgeVariant: "success",
      }
    if (tier === "middle")
      return {
        icon: BarChart2Icon,
        ring: "bg-foreground/15 text-foreground",
        badgeVariant: "dark",
      }
    if (tier === "single")
      return {
        icon: InfoIcon,
        ring: "bg-primary/15 text-primary",
        badgeVariant: "glass-primary",
      }
    if (tier === "unknown")
      return {
        icon: CircleQuestionMarkIcon,
        ring: "bg-muted text-muted-foreground",
        badgeVariant: "boring",
      }
    return {
      icon: BarChart2Icon,
      ring: "bg-primary/15 text-primary",
      badgeVariant: "glass-primary",
    }
  }

  const { icon: IconComponent, ring: IconComponentRingClass, badgeVariant } = resolveDealMetadata(tier)

  return (
    <div
      className={cn(
        "border-border bg-card/70 dark:bg-card/45 relative min-w-0 overflow-hidden rounded-xl border",
        className,
      )}
    >
      <div className="relative z-1 flex flex-col gap-2 p-3 pt-2.5 pr-11 sm:gap-2.5 sm:p-4 sm:pt-3 sm:pr-14">
        {deal ? (
          <>
            <div
              className={cn(
                "absolute top-2.5 right-2.5 z-10 sm:top-3 sm:right-3",
                "flex size-8 items-center justify-center rounded-full ring-0 sm:size-9",
                IconComponentRingClass,
              )}
            >
              <IconComponent className="size-4 sm:size-5" aria-hidden />
            </div>

            {deal.tierLabel ? (
              <Badge variant={badgeVariant} size="xs" className="w-fit font-semibold">
                {deal.tierLabel}
              </Badge>
            ) : null}
            <p className="text-foreground text-sm leading-snug font-medium wrap-break-word">{deal.summaryLine}</p>
          </>
        ) : (
          <p className="text-muted-foreground text-sm font-medium">Compare stores below for the best current price.</p>
        )}
        {cheaperHint ? <CheaperElsewhereInline hint={cheaperHint} /> : null}
      </div>
    </div>
  )
}

type TrackedHintProps = {
  className?: string
  cheaperHint?: CheaperElsewhereHint | null
}

export function DealSummaryCardTrackedHint({ className, cheaperHint }: TrackedHintProps) {
  return (
    <div
      className={cn(
        "text-muted-foreground border-border/80 bg-muted/20 flex min-w-0 flex-col gap-2 rounded-xl border px-3 py-2.5 text-xs",
        className,
      )}
    >
      <div className="flex gap-2">
        <BinocularsIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        <p>Add to favorites to build price history. You&apos;ll see how typical this price is.</p>
      </div>
      {cheaperHint ? <CheaperElsewhereInline hint={cheaperHint} /> : null}
    </div>
  )
}
