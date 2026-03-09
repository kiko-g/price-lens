import dynamic from "next/dynamic"
import type { Metadata } from "next"
import { pageMetadata } from "@/lib/config"

import { Layout } from "@/components/layout"
import { InflationTrends } from "@/components/home/InflationTrends"
import { PriceCreep } from "@/components/home/PriceCreep"
import { ValueProposition } from "@/components/home/ValueProposition"
import { InflationBasketConcept } from "@/components/home/InflationBasketConcept"
import { SavePotential } from "@/components/home/SavePotential"
import { PricingSection } from "@/components/home/Pricing"

const InflationContext = dynamic(() => import("@/components/home/InflationContext").then((mod) => mod.InflationContext))

export const metadata: Metadata = pageMetadata(
  "About",
  "Learn about Price Lens and explore 25+ years of historical inflation data for Portugal, the USA, and the Eurozone.",
)

export default function AboutPage() {
  const Separator = () => (
    <div className="from-border/5 via-border/30 to-border/5 dark:from-border/5 dark:via-border/50 dark:to-border/5 my-4 h-[2px] w-full bg-linear-to-r lg:my-8" />
  )

  return (
    <Layout>
      <main className="flex w-full flex-col items-center justify-center">
        <section className="w-full px-4 pt-12 pb-4 md:pt-16 lg:pt-24">
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 text-center">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">About Price Lens</h1>
            <p className="text-muted-foreground max-w-3xl text-sm md:text-lg/relaxed">
              Price Lens tracks daily price changes across Portuguese supermarkets to make invisible price creep
              visible. Below you can explore over 25 years of inflation data and understand the bigger picture behind
              the numbers on the shelf.
            </p>
          </div>
        </section>

        <InflationTrends />

        <Separator />
        <SavePotential />
        <Separator />
        <PriceCreep />
        <ValueProposition />
        <InflationContext />
        <InflationBasketConcept />
        <Separator />
        <PricingSection />
      </main>
    </Layout>
  )
}
