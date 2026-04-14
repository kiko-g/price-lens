"use client"

import Link from "next/link"

import type { PricePoint, StoreProduct } from "@/types"
import { cn } from "@/lib/utils"
import { getProductDealSummary, type DealSummaryTier } from "@/lib/business/product-deal-summary"

import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { SupermarketChainBadge } from "@/components/products/SupermarketChainBadge"
import { DealSummaryLightRays } from "@/components/products/product-page/DealSummaryLightRays"
import {
  AlertCircleIcon,
  BadgeCheckIcon,
  BarChart2Icon,
  BinocularsIcon,
  CircleQuestionMarkIcon,
  InfoIcon,
} from "lucide-react"

export type CheaperElsewhereHint = {
  originId: number
  saveAmount: number
  href: string
}

function dealSummaryBadgeVariant(tier: DealSummaryTier): "outline-success" | "outline-warning" | "outline" | "boring" {
  if (tier === "habitual") return "outline-success"
  if (tier === "infrequent") return "outline-warning"
  if (tier === "middle") return "outline"
  return "boring"
}

type DealSummaryCardProps = {
  sp: StoreProduct
  pricePoints: PricePoint[] | null
  mostCommon: PricePoint | null
  isLoading: boolean
  cheaperHint?: CheaperElsewhereHint | null
  className?: string
}

function CheaperElsewhereInline({
  hint,
  showTopDivider = true,
}: {
  hint: CheaperElsewhereHint
  showTopDivider?: boolean
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-2 gap-y-1",
        showTopDivider && "border-border/60 mt-3 border-t pt-3",
        !showTopDivider && "mt-1",
      )}
    >
      <span className="text-muted-foreground text-sm font-medium">Cheaper at another store</span>
      <Link
        href={hint.href}
        className="inline-flex items-center justify-center rounded-md border border-neutral-200 bg-white px-2 py-1 shadow-sm transition-opacity hover:opacity-90 focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none dark:border-white/25"
        aria-label={`View cheaper price at partner store (save ${hint.saveAmount.toFixed(2)}€)`}
      >
        <SupermarketChainBadge originId={hint.originId} variant="logoSmall" />
      </Link>
      <span className="text-success text-xs font-semibold tabular-nums">
        −{hint.saveAmount.toFixed(2)}€
      </span>
    </div>
  )
}

export function DealSummaryCard({
  sp,
  pricePoints,
  mostCommon,
  isLoading,
  cheaperHint,
  className,
}: DealSummaryCardProps) {
  if (isLoading) {
    return <Skeleton variant="shimmer" className={cn("h-28 w-full rounded-xl", className)} />
  }

  const deal = getProductDealSummary(sp, pricePoints, mostCommon)

  if (!deal && !cheaperHint) return null

  const tier: DealSummaryTier = deal?.tier ?? "middle"

  const Icon =
    deal?.tier === "habitual"
      ? BadgeCheckIcon
      : deal?.tier === "infrequent"
        ? AlertCircleIcon
        : deal?.tier === "middle"
          ? BarChart2Icon
          : deal?.tier === "single"
            ? InfoIcon
            : deal?.tier === "unknown"
              ? CircleQuestionMarkIcon
              : BarChart2Icon

  const iconRing = cn(
    "flex size-9 items-center justify-center rounded-full shadow-sm ring-1 ring-black/5 dark:ring-white/10",
    tier === "habitual" && "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400",
    tier === "infrequent" && "bg-amber-500/20 text-amber-600 dark:text-amber-400",
    tier === "middle" && "bg-primary/15 text-primary",
    (tier === "single" || tier === "unknown") && "bg-muted text-muted-foreground",
  )

  return (
    <div
      className={cn(
        "border-border bg-card/70 dark:bg-card/45 relative isolate min-w-0 overflow-hidden rounded-xl border",
        className,
      )}
    >
      <DealSummaryLightRays tier={tier} />
      <div className="relative z-[1] p-4 pt-3.5 pr-14">
        {deal ? (
          <>
            <div className={cn("absolute top-3 right-3 z-10", iconRing)}>
              <Icon className="size-4" aria-hidden />
            </div>
            {deal.tierLabel ? (
              <Badge variant={dealSummaryBadgeVariant(deal.tier)} size="xs" className="mb-2 w-fit font-semibold">
                {deal.tierLabel}
              </Badge>
            ) : null}
            <p className="text-foreground text-sm leading-snug font-medium break-words">{deal.summaryLine}</p>
          </>
        ) : (
          <p className="text-muted-foreground text-sm font-medium">Compare stores below for the best current price.</p>
        )}
        {cheaperHint ? <CheaperElsewhereInline hint={cheaperHint} showTopDivider /> : null}
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
        <p>Add to favorites to build price history — then you&apos;ll see how typical this price is.</p>
      </div>
      {cheaperHint ? <CheaperElsewhereInline hint={cheaperHint} showTopDivider={false} /> : null}
    </div>
  )
}
