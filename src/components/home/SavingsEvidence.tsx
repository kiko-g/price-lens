import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { getHomeStats } from "@/lib/queries/home-stats"

function formatNumber(n: number): string {
  return n.toLocaleString("pt-PT")
}

function formatEuros(n: number): string {
  return `€${n.toLocaleString("pt-PT", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export async function SavingsEvidence() {
  const stats = await getHomeStats()

  const hasEuroStat = stats.totalDiscountSavingsEuros > 0 || stats.totalSavingsEuros24h > 0
  const euroValue = stats.totalDiscountSavingsEuros > 0 ? stats.totalDiscountSavingsEuros : stats.totalSavingsEuros24h
  const storeCount = stats.perStore.length

  return (
    <section className="w-full px-4 py-12 md:py-20">
      <div className="from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 mx-auto flex max-w-3xl flex-col items-center gap-6 rounded-3xl bg-linear-to-br p-8 text-center md:p-12">
        {hasEuroStat ? (
          <h2
            className={cn(
              "bg-linear-to-br from-30% bg-clip-text text-transparent",
              "from-zinc-950 to-zinc-600 dark:from-zinc-50 dark:to-zinc-400",
              "text-2xl font-bold tracking-tight text-balance sm:text-3xl md:text-4xl",
            )}
          >
            {formatEuros(euroValue)} in savings across {formatNumber(stats.productsOnDiscount)} products on sale
          </h2>
        ) : (
          <h2
            className={cn(
              "bg-linear-to-br from-30% bg-clip-text text-transparent",
              "from-zinc-950 to-zinc-600 dark:from-zinc-50 dark:to-zinc-400",
              "text-2xl font-bold tracking-tight text-balance sm:text-3xl md:text-4xl",
            )}
          >
            {formatNumber(stats.priceDropsToday)} price drops detected today
          </h2>
        )}

        <p className="text-muted-foreground max-w-lg text-sm leading-relaxed text-balance">
          Prices shift every week across {storeCount > 0 ? `${storeCount} major chains` : "supermarkets"}. What costs
          €6.99 today was €4.49 last month. Price Lens tracks it all so you buy at the right time.
        </p>

        <Link
          href="/products?sort=price-drop"
          className="bg-primary text-primary-foreground group inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold shadow-lg transition-all hover:shadow-xl hover:brightness-110"
        >
          Browse today&apos;s price drops
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </section>
  )
}
