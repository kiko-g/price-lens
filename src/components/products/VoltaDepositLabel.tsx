"use client"

import { useLocale, useTranslations } from "next-intl"

import { cn } from "@/lib/utils"
import { formatPrice } from "@/lib/i18n/format"
import { PLUS_SIGN } from "@/lib/i18n/formatting-glyphs"
import { isLocale, type Locale } from "@/i18n/config"

type Props = {
  depositAmount: number
  className?: string
  size?: "xs" | "sm"
}

export function VoltaDepositLabel({ depositAmount, className, size = "sm" }: Props) {
  const t = useTranslations("products.voltaDeposit")
  const locale = useLocale()
  const resolvedLocale: Locale = isLocale(locale) ? locale : "pt"

  if (!depositAmount || depositAmount <= 0) return null

  const formatted = formatPrice(depositAmount, resolvedLocale)

  return (
    <span
      className={cn(
        "text-muted-foreground tabular-nums",
        size === "xs" ? "text-xs" : "text-sm",
        className,
      )}
      title={t("title")}
    >
      {PLUS_SIGN} {t("label", { amount: formatted })}
    </span>
  )
}
