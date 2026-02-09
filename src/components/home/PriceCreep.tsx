"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangleIcon, TrendingUpIcon } from "lucide-react"

const priceExamples = [
  {
    name: "Whole Milk 1L",
    from: 0.59,
    to: 0.89,
    months: 36,
    icon: "🥛",
  },
  {
    name: "Canned Tuna 120g",
    from: 0.79,
    to: 1.19,
    months: 30,
    icon: "🐟",
  },
  {
    name: "White Bread 500g",
    from: 0.69,
    to: 0.99,
    months: 24,
    icon: "🍞",
  },
  {
    name: "Eggs (6 pack)",
    from: 1.09,
    to: 1.59,
    months: 28,
    icon: "🥚",
  },
]

export function PriceCreep() {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <Badge variant="outline-destructive" size="md">
            <AlertTriangleIcon className="size-3.5" />
            The invisible hike
          </Badge>

          <h2 className="max-w-3xl text-3xl font-bold tracking-tighter text-balance sm:text-4xl md:text-5xl">
            Small cents, big impact
          </h2>
          <p className="text-muted-foreground max-w-2xl text-lg leading-relaxed text-balance">
            Each month it&apos;s just a few cents more. You don&apos;t switch brands, you don&apos;t complain. But over a
            year, your grocery basket costs significantly more — and you never saw it coming.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:mt-14">
          {priceExamples.map((product) => {
            const increase = product.to - product.from
            const monthlyInc = increase / product.months
            const percentIncrease = ((increase / product.from) * 100).toFixed(0)

            return (
              <Card key={product.name} className="group relative overflow-hidden transition-all hover:shadow-md">
                <CardContent className="flex flex-col gap-4 p-5">
                  <div className="flex items-start justify-between">
                    <span className="text-3xl" role="img" aria-label={product.name}>
                      {product.icon}
                    </span>
                    <Badge variant="outline-destructive" size="xs">
                      <TrendingUpIcon className="size-3" />
                      +{percentIncrease}%
                    </Badge>
                  </div>

                  <div className="flex flex-col gap-1">
                    <h3 className="text-sm font-semibold tracking-tight">{product.name}</h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-muted-foreground text-sm line-through">
                        {product.from.toFixed(2)} EUR
                      </span>
                      <span className="text-foreground text-lg font-bold">{product.to.toFixed(2)} EUR</span>
                    </div>
                  </div>

                  <div className="bg-muted rounded-lg px-3 py-2">
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      <span className="text-foreground font-medium">+{monthlyInc.toFixed(3)} EUR/month</span> over{" "}
                      {product.months} months
                    </p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="mt-10 flex justify-center md:mt-14">
          <div className="bg-muted/50 max-w-2xl rounded-xl border px-6 py-4 text-center">
            <p className="text-foreground text-sm font-medium leading-relaxed md:text-base">
              A typical basket of 20 essentials cost around <strong>25 EUR</strong> three years ago. Today the same
              basket costs over <strong>32 EUR</strong>.{" "}
              <span className="text-muted-foreground">That is a 28% increase you absorbed without realizing.</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
