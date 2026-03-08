import Link from "next/link"
import { ArrowRight } from "lucide-react"

const AVERAGE_SPEND = 2500
const MAX_REALISTIC_SAVING_RATE = 0.2
const YEARLY_SAVINGS = Math.round(AVERAGE_SPEND * MAX_REALISTIC_SAVING_RATE)

export function SavingsSpotlight() {
  return (
    <section className="w-full px-4 py-16 md:py-24">
      <div className="border-primary/20 bg-primary/5 dark:border-primary/15 dark:bg-primary/5 mx-auto flex max-w-3xl flex-col items-center gap-6 rounded-2xl border p-8 text-center md:p-12">
        <h2 className="text-2xl font-bold tracking-tight text-balance sm:text-3xl md:text-4xl">
          The average shopper could save up to <span className="text-primary">€{YEARLY_SAVINGS}/year</span> just by
          buying at the right time
        </h2>

        <p className="text-muted-foreground max-w-lg text-sm leading-relaxed md:text-base">
          Supermarkets constantly rotate promotions across brands and stores. Price Lens tracks those discounts, so you
          stock up when prices are lowest and stop overpaying for everyday groceries.
        </p>

        <Link
          href="/products"
          className="bg-primary text-primary-foreground group inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all hover:brightness-110"
        >
          Start saving on groceries
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </section>
  )
}
