import { defaultMetadata } from "@/lib/config"
import type { Metadata } from "next"
import Link from "next/link"

import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"

import { Brands } from "@/components/home/Brands"
import { HeroGridPattern } from "@/components/home/HeroGridPattern"
import { InflationBasketConcept } from "@/components/home/InflationBasketConcept"
import { InflationTrends } from "@/components/home/InflationTrends"
import { MockChartA } from "@/components/home/MockChart"
import { PricingSection } from "@/components/home/Pricing"

import { BadgeEuroIcon, ShoppingBasketIcon } from "lucide-react"

export const metadata: Metadata = {
  ...defaultMetadata,
}

type SearchParams = {
  q?: string
  page?: string
}

type Props = {
  searchParams: Promise<SearchParams>
}

export default async function Home({ searchParams }: Props) {
  const params = await Promise.resolve(searchParams) // TODO: add search params

  return (
    <Layout>
      <HeroGridPattern
        variant="grid"
        className="mask-[linear-gradient(to_bottom_right,rgba(255,255,255,0.5),transparent_100%)] md:mask-[linear-gradient(to_bottom_right,rgba(255,255,255,0.8),transparent_60%)]"
      />

      <main className="flex w-full flex-col items-center justify-center">
        <div className="z-20 flex w-full flex-1 flex-col items-center justify-center gap-3 px-4 py-8 lg:flex-row lg:items-start lg:justify-start lg:gap-8 lg:px-20 lg:py-20">
          <div className="flex w-full flex-1 flex-col gap-4 pt-16 pb-8 md:gap-4 lg:pt-0 lg:pb-0">
            <h1 className="animate-fade-in z-10 -translate-y-4 bg-linear-to-br from-black from-30% to-black/40 bg-clip-text py-2 text-center text-4xl leading-none font-medium tracking-tighter text-balance text-transparent opacity-0 [--animation-delay:200ms] sm:text-5xl md:text-left md:text-6xl lg:text-7xl dark:from-white dark:to-white/40">
              Price Lens
              <br className="block" />
              See through prices
            </h1>
            <p className="animate-fade-in text-muted-foreground max-w-3xl -translate-y-4 text-center tracking-tight text-balance opacity-0 [--animation-delay:400ms] md:text-left md:text-lg">
              Monitor daily price changes on essential consumer goods that impact inflation metrics. Stay informed and
              aware of how supermarket prices change. See beyond the headlines and tags. Data focused on
              Portugal-available supermarket chains.
            </p>

            <div className="animate-fade-in flex flex-wrap gap-3 opacity-0 [--animation-delay:600ms] md:mt-3 md:gap-4">
              <Button variant="marketing" size="lg" className="w-full md:w-auto" asChild>
                <Link href="/products">
                  Start Tracking
                  <BadgeEuroIcon />
                </Link>
              </Button>

              <Button variant="marketing-white" size="lg" className="w-full md:w-auto" asChild>
                <Link href="/supermarket">
                  Browse Supermarket
                  <ShoppingBasketIcon />
                </Link>
              </Button>
            </div>

            <Brands className="mt-8" />
          </div>

          <div className="my-8 w-full max-w-full flex-1 self-start overflow-hidden lg:my-0 lg:w-auto lg:max-w-md">
            <MockChartA className="border-border w-full bg-linear-to-br shadow-none" />
          </div>
        </div>

        <PricingSection />
        <InflationBasketConcept />
        <InflationTrends />
      </main>
    </Layout>
  )
}
