import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { getHomeStats } from "@/lib/queries/home-stats"
import { DiagonalSplitCtaRight } from "@/components/home/DiagonalSplitCtaRight"

function formatNumber(n: number): string {
  return n.toLocaleString("pt-PT")
}

function formatEuros(n: number): string {
  return `€${n.toLocaleString("pt-PT", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

/**
 * Two panels whose inner edges are clipped by a shallow diagonal, leaving the
 * page background visible as a rift between them. On mobile they stack as
 * regular rounded cards; on md+ the clip-paths kick in.
 */
export async function DiagonalSplitCta() {
  const stats = await getHomeStats()

  const hasEuroStat = stats.totalDiscountSavingsEuros > 0 || stats.totalSavingsEuros24h > 0
  const euroValue = stats.totalDiscountSavingsEuros > 0 ? stats.totalDiscountSavingsEuros : stats.totalSavingsEuros24h
  const storeCount = stats.perStore.length

  return (
    <section className="w-full px-4 py-12 md:py-20">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 md:flex-row md:items-stretch md:gap-2.5">
        {/* Left: Savings Evidence */}
        <div
          className={cn(
            "flex-1 overflow-hidden rounded-3xl shadow-sm",
            "from-secondary/5 to-primary/10 dark:from-secondary/10 dark:to-primary/15 bg-linear-to-br",
            "md:[clip-path:polygon(0_0,100%_0,82%_100%,0_100%)]",
          )}
        >
          <div className="flex h-full flex-col items-start justify-center gap-5 px-8 py-10 md:px-10 md:py-14 md:pr-24">
            <h2
              className={cn(
                "text-2xl font-extrabold tracking-tight text-balance sm:text-3xl",
                "bg-linear-to-br from-30% bg-clip-text text-transparent",
                "from-zinc-950 to-zinc-600 dark:from-zinc-50 dark:to-zinc-400",
              )}
            >
              {hasEuroStat
                ? `${formatEuros(euroValue)} in savings across ${formatNumber(stats.productsOnDiscount)} products on sale`
                : `${formatNumber(stats.priceDropsToday)} price drops detected today`}
            </h2>

            <p className="text-muted-foreground max-w-[400px] text-sm leading-relaxed text-pretty">
              Prices shift every week across {storeCount > 0 ? `${storeCount} major chains` : "supermarkets"}. What
              costs €6.99 today was €4.49 last month. Price Lens tracks it all so you buy at the right time.
            </p>

            <Button asChild variant="primary" size="lg" roundedness="xl" className="group gap-2">
              <Link href="/products?sort=price-drop">
                Browse today&apos;s price drops
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
