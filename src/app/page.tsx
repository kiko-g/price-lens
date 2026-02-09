import { defaultMetadata } from "@/lib/config"
import type { Metadata } from "next"

import { Layout } from "@/components/layout"

import { Hero } from "@/components/home/Hero"
import { HeroGridPattern } from "@/components/home/HeroGridPattern"
import { PriceCreep } from "@/components/home/PriceCreep"
import { HowItWorks } from "@/components/home/HowItWorks"
import { ProductShowcaseSection } from "@/components/home/ProductShowcaseSection"
import { InflationBasketConcept } from "@/components/home/InflationBasketConcept"
import { PricingSection } from "@/components/home/Pricing"
import { SearchDialogQuickNav } from "@/components/layout/SearchDialogQuickNav"

export const metadata: Metadata = {
  ...defaultMetadata,
}

export default async function Home() {
  return (
    <Layout>
      <HeroGridPattern
        variant="grid"
        className="mask-[linear-gradient(to_bottom_right,rgba(255,255,255,0.5),transparent_100%)] md:mask-[linear-gradient(to_bottom_right,rgba(255,255,255,0.8),transparent_60%)]"
      />

      <main className="flex w-full flex-col items-center justify-center">
        <Hero />
        <PriceCreep />
        <HowItWorks />
        <ProductShowcaseSection />
        <InflationBasketConcept />
        <PricingSection />
        <SearchDialogQuickNav />
      </main>
    </Layout>
  )
}
