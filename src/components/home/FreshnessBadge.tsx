import { getTranslations } from "next-intl/server"
import { CircleCheckIcon } from "lucide-react"
import { MIDDLE_DOT } from "@/lib/i18n/formatting-glyphs"
import { cn } from "@/lib/utils"

type FreshnessKind = "justNow" | "hoursAgo" | "today" | "recent"

export async function FreshnessBadge({ computedAt, className }: { computedAt: string | null; className?: string }) {
  const t = await getTranslations("home.freshness")
  const status = resolveFreshness(computedAt)
  const label =
    status.kind === "justNow"
      ? t("justNow")
      : status.kind === "hoursAgo"
        ? t("hoursAgo", { hours: status.hours })
        : status.kind === "today"
          ? t("today")
          : t("recent")

  return (
    <div className={cn("text-muted-foreground flex items-center gap-1.5 text-xs", className)}>
      <CircleCheckIcon className="size-3 text-emerald-500" />
      <span>{label}</span>
      <span className="mx-1">{MIDDLE_DOT}</span>
      <span>{t("trackingSince")}</span>
    </div>
  )
}

function resolveFreshness(isoDate: string | null): { kind: FreshnessKind; hours: number } {
  if (!isoDate) return { kind: "recent", hours: 0 }
  const now = Date.now()
  const computed = new Date(isoDate).getTime()
  const hoursAgo = Math.floor((now - computed) / (1000 * 60 * 60))

  if (hoursAgo < 1) return { kind: "justNow", hours: 0 }
  if (hoursAgo < 24) return { kind: "hoursAgo", hours: hoursAgo }
  return { kind: "today", hours: hoursAgo }
}
