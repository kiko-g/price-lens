"use client"

import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"

export function DevBadge({ className }: { className?: string }) {
  const t = useTranslations("common.ui")
  return (
    <span
      className={cn("rounded bg-amber-500/10 px-1 py-0.5 text-[10px] text-amber-600 dark:text-amber-400", className)}
    >
      {t("devBadge")}
    </span>
  )
}
