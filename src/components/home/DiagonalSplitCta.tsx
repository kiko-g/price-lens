import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { getLocale, getTranslations } from "next-intl/server"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { getHomeStats } from "@/lib/queries/home-stats"
import { DiagonalSplitCtaRight } from "@/components/home/DiagonalSplitCtaRight"
import { isLocale, toLocaleTag } from "@/i18n/config"

/**
 * Two panels whose inner edges are clipped by a shallow diagonal, leaving the
 * page background visible as a rift between them. On mobile they stack as
 * regular rounded cards; on md+ the clip-paths kick in.
 */
export async function DiagonalSplitCta() {
  const [stats, localeRaw, t] = await Promise.all([getHomeStats(), getLocale(), getTranslations("home.diagonalCta")])
  const locale = isLocale(localeRaw) ? localeRaw : "pt"
  const tag = toLocaleTag(locale)
  const formatNumber = (n: number) => n.toLocaleString(tag)
  const formatEuros = (n: number) => `€${n.toLocaleString(tag, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

  const hasEuroStat = stats.totalDiscountSavingsEuros > 0 || stats.totalSavingsEuros24h > 0
  const euroValue = stats.totalDiscountSavingsEuros > 0 ? stats.totalDiscountSavingsEuros : stats.totalSavingsEuros24h
  const storeCount = stats.perStore.length

  return (
    <section className="w-full px-4 py-12 md:py-20">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 md:flex-row md:items-stretch md:gap-2.5">
        {/* Left: Savings Evidence */}
        <div
          className={cn(
            "border-border bg-card/70 flex-1 overflow-hidden border shadow-sm",
            "from-primary/8 dark:from-primary/14 bg-linear-to-br to-transparent",
            "md:[clip-path:polygon(0_0,100%_0,82%_100%,0_100%)]",
          )}
        >
          <div className="flex h-full flex-col items-start justify-center gap-5 px-8 py-10 md:px-10 md:py-14 md:pr-24">
            <h2 className={cn("text-2xl font-extrabold tracking-tight text-balance sm:text-3xl", "text-foreground")}>
              {hasEuroStat
                ? t("headingEuros", { euros: formatEuros(euroValue), count: formatNumber(stats.productsOnDiscount) })
                : t("headingDrops", { count: formatNumber(stats.priceDropsToday) })}
            </h2>

            <p className="text-muted-foreground max-w-[400px] text-sm leading-relaxed text-pretty">
              {storeCount > 0 ? t("bodyWithStores", { count: storeCount }) : t("body")}
            </p>

            <Button asChild variant="hud" size="lg" className="group gap-2">
              <Link href="/products?sort=price-drop-smart">
                {t("cta")}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Right: Personal Tracking */}
        <DiagonalSplitCtaRight />
      </div>
    </section>
  )
}
