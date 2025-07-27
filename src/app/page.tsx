import { defaultMetadata } from "@/lib/config"
import type { Metadata } from "next"

import { Layout } from "@/components/layout"

import { Hero } from "@/components/home/Hero"
import { HeroGridPattern } from "@/components/home/HeroGridPattern"
import { InflationBasketConcept } from "@/components/home/InflationBasketConcept"
import { InflationTrends } from "@/components/home/InflationTrends"
import { PricingSection } from "@/components/home/Pricing"

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
        <Hero />

        <PricingSection />
        <InflationTrends />
        <InflationBasketConcept />
      </main>
    </Layout>
  )
}
