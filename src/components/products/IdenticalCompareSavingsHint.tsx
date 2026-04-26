"use client"

import { useTranslations } from "next-intl"
import { InfoIcon, SmilePlusIcon, ZapIcon } from "lucide-react"

import { Callout } from "@/components/ui/callout"
import { cn } from "@/lib/utils"

const highlightClass = "text-primary font-semibold"

type Props = {
  currentPrice: number | null
  cheapestPrice: number | null
  highestPrice: number | null
  hasPriceSpread: boolean
  hasUniqueCheapest: boolean
  className?: string
}

export function IdenticalCompareSavingsHint({
  currentPrice,
  cheapestPrice,
  highestPrice,
  hasPriceSpread,
  hasUniqueCheapest,
  className,
}: Props) {
  const t = useTranslations("products.identical")

  if (
    cheapestPrice !== null &&
    currentPrice !== null &&
    hasPriceSpread &&
    currentPrice > cheapestPrice
  ) {
    return (
      <Callout
        icon={ZapIcon}
        className={cn(
          "border-primary/25 bg-primary/5 text-foreground dark:border-primary/40 dark:bg-primary/10 [&>svg]:text-primary",
          className,
        )}
      >
        <p className="text-sm leading-snug">
          {t.rich("savingsBySwitching", {
            amount: (currentPrice - cheapestPrice).toFixed(2),
            highlight: (chunks) => <span className={highlightClass}>{chunks}</span>,
          })}
        </p>
      </Callout>
    )
  }

  if (
    cheapestPrice !== null &&
    currentPrice !== null &&
    hasPriceSpread &&
    currentPrice === cheapestPrice &&
    hasUniqueCheapest
  ) {
    return (
      <Callout icon={SmilePlusIcon} variant="success" className={className}>
        <p className="text-foreground text-sm leading-snug">
          {t.rich("alreadyCheapest", {
            highlight: (chunks) => <span className={highlightClass}>{chunks}</span>,
          })}
        </p>
      </Callout>
    )
  }

  if (
    cheapestPrice !== null &&
    currentPrice !== null &&
    hasPriceSpread &&
    currentPrice === cheapestPrice &&
    !hasUniqueCheapest
  ) {
    return (
      <Callout icon={SmilePlusIcon} variant="info" className={className}>
        <p className="text-foreground text-sm leading-snug">
          {t("tiedCheapest", {
            cheapest: cheapestPrice.toFixed(2),
            highest: highestPrice?.toFixed(2) ?? "",
          })}
        </p>
      </Callout>
    )
  }

  return (
    <Callout icon={InfoIcon} variant="info" className={className}>
      <p className="text-foreground text-sm leading-snug">{t("allSamePrice")}</p>
    </Callout>
  )
}
