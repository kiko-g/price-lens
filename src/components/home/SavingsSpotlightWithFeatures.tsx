import Link from "next/link"
import { cn } from "@/lib/utils"
import { ArrowRight, MapPinIcon, PiggyBankIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"

const AVERAGE_SPEND = 2500
const MAX_REALISTIC_SAVING_RATE = 0.2
const YEARLY_SAVINGS = Math.round(AVERAGE_SPEND * MAX_REALISTIC_SAVING_RATE)

export function SavingsSpotlightWithFeatures() {
  const features = [
    {
      icon: MapPinIcon,
      title: "I'm at the store",
      description: "Pick your store. See what's worth buying today from your favorites and lists.",
    },
    {
      icon: PiggyBankIcon,
      title: "Track your savings",
      description: "See how much you've saved over time by shopping smarter with Price Lens.",
    },
  ]

  return (
    <section className="w-full px-4 py-16 md:py-24">
      <h1
        className={cn(
          "from-primary-900 to-primary-600",
          "dark:from-primary-100 dark:to-primary-50",
          "animate-fade-in z-10 mx-auto max-w-5xl -translate-y-4 bg-linear-to-br from-30% bg-clip-text py-2 text-center text-3xl leading-none font-medium tracking-tighter text-balance text-transparent opacity-0 [--animation-delay:200ms] sm:text-3xl md:text-center md:text-4xl md:font-medium lg:text-5xl",
        )}
      >
        &quot;Time in the market, beats timing the market&quot;
        <br />
        except in the <span className="italic">supermarket</span>
      </h1>

      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-3 md:items-start">
        {/* Savings Spotlight */}
        <div className="border-primary/30 from-primary/5 to-primary/10 dark:border-primary/20 dark:from-primary/20 dark:to-primary/10 relative flex h-full flex-col items-center justify-center gap-6 rounded-2xl border bg-linear-to-br p-8 text-center md:col-span-2 md:p-10 dark:bg-linear-to-br">
          <h2 className="text-xl font-bold tracking-tight text-balance sm:text-2xl md:text-3xl">
            The average shopper could save up to <span className="text-primary">€{YEARLY_SAVINGS}/year</span> just by
            buying at the right time
          </h2>

          <p className="text-muted-foreground max-w-lg text-sm leading-relaxed">
            Supermarkets constantly rotate promotions across brands and stores. Price Lens tracks those discounts, so
            you stock up when prices are lowest and stop overpaying for everyday groceries.
          </p>

          <Link
            href="/products"
            className="bg-primary text-primary-foreground group inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all hover:brightness-110"
          >
            Start saving on groceries
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Features */}
        <div className="flex flex-col gap-4 md:col-span-1">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div key={feature.title} className="bg-card flex flex-col gap-3 rounded-xl border p-5 opacity-80">
                <div className="flex items-center justify-between">
                  <div className="bg-muted flex size-9 items-center justify-center rounded-lg">
                    <Icon className="text-muted-foreground size-4.5" />
                  </div>
                  <Badge variant="outline" className="text-muted-foreground text-[10px] font-medium">
                    Coming soon
                  </Badge>
                </div>
                <h3 className="text-sm font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
