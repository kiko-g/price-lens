import Link from "next/link"
import type { Metadata } from "next"
import { defaultMetadata } from "@/lib/config"

import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"

import { Brands } from "@/components/home/Brands"
import { GridHome } from "@/components/home/GridHome"
import { MockChartA } from "@/components/home/MockChart"
import { PricingSection } from "@/components/home/Pricing"
import { InflationBasket } from "@/components/home/InflationBasket"

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
  const params = await Promise.resolve(searchParams)

  return (
    <Layout>
      <GridHome />

      <main className="flex w-full flex-col items-center justify-center">
        <div className="z-20 flex w-full flex-1 flex-col items-center justify-center gap-3 px-4 py-8 lg:flex-row lg:items-start lg:justify-start lg:gap-8 lg:px-20 lg:py-20">
          <div className="flex w-full flex-1 flex-col gap-4 pb-8 pt-16 md:gap-4 lg:pb-0 lg:pt-0">
            <h1 className="z-10 translate-y-[-1rem] animate-fade-in text-balance bg-gradient-to-br from-black from-30% to-black/40 bg-clip-text py-2 text-center text-4xl font-medium leading-none tracking-tighter text-transparent opacity-0 [--animation-delay:200ms] dark:from-white dark:to-white/40 sm:text-5xl md:text-left md:text-6xl lg:text-7xl">
              Price Lens
              <br className="block" />
              See through prices
            </h1>
            <p className="max-w-3xl translate-y-[-1rem] animate-fade-in text-balance text-center tracking-tight text-gray-400 opacity-0 [--animation-delay:400ms] md:text-left md:text-lg">
              Monitor daily price changes on essential consumer goods that impact inflation metrics. Stay informed and
              aware of how supermarket prices change. See beyond the headlines and tags. Data focused on
              Portugal-available supermarket chains.
            </p>

            <div className="flex animate-fade-in flex-wrap gap-3 opacity-0 [--animation-delay:600ms] md:mt-3 md:gap-4">
              <Button variant="default" size="lg" className="w-full md:w-auto" asChild>
                <Link href="/products">
                  Start Tracking
                  <BadgeEuroIcon />
                </Link>
              </Button>

              <Button variant="outline" size="lg" className="w-full md:w-auto" asChild>
                <Link href="/supermarket">
                  Browse Supermarket Products
                  <ShoppingBasketIcon />
                </Link>
              </Button>
            </div>

            <Brands className="mt-8" />
          </div>

          <div className="my-8 w-full max-w-full flex-1 self-start overflow-hidden lg:my-0 lg:w-auto lg:max-w-md">
            <MockChartA className="w-full border-zinc-100 bg-gradient-to-br shadow-none dark:border-zinc-800 lg:border-border" />
          </div>
        </div>

        <PricingSection />
        <InflationBasket />
      </main>
    </Layout>
  )
}
