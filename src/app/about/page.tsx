import type { Metadata } from "next"

import { Layout } from "@/components/layout"
import { InflationTrends } from "@/components/home/InflationTrends"

export const metadata: Metadata = {
  title: "About",
  description:
    "Understand the context behind Price Lens. Explore inflation trends, CPI data, and the economic factors that drive the price changes we track.",
}

export default async function AboutPage() {
  return (
    <Layout>
      <main className="flex w-full flex-col items-center justify-center">
        <section className="w-full px-4 pt-16 pb-8 md:px-16 md:pt-24 md:pb-12">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
              The context behind price changes
            </h1>
            <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-balance">
              Price Lens was born from a simple observation: prices creep up in small, invisible increments that we
              absorb without question. Below you will find the macroeconomic context — inflation data and CPI trends —
              that explains why this matters.
            </p>
          </div>
        </section>
        <InflationTrends />
      </main>
    </Layout>
  )
}
