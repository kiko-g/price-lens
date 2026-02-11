import type { Metadata } from "next"

import { Layout } from "@/components/layout"
import { InflationTrends } from "@/components/home/InflationTrends"

export const metadata: Metadata = {
  title: "About | Price Lens",
  description:
    "Learn about Price Lens and explore 25+ years of historical inflation data for Portugal, the USA, and the Eurozone.",
}

export default function AboutPage() {
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
      </main>
    </Layout>
  )
}
