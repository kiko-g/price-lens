import dynamic from "next/dynamic"

import { defaultMetadata } from "@/lib/config"
import type { Metadata } from "next"

import { Layout } from "@/components/layout"

import { Hero } from "@/components/home/Hero"
import { HeroGridPattern } from "@/components/home/HeroGridPattern"
import { PriceCreep } from "@/components/home/PriceCreep"
import { ValueProposition } from "@/components/home/ValueProposition"
import { InflationBasketConcept } from "@/components/home/InflationBasketConcept"
import { PricingSection } from "@/components/home/Pricing"
import { SearchDialogQuickNav } from "@/components/layout/SearchDialogQuickNav"
import { SavePotential } from "@/components/home/SavePotential"

// Code-split the inflation chart (Recharts is heavy, below the fold)
const InflationContext = dynamic(() => import("@/components/home/InflationContext").then((mod) => mod.InflationContext))

export const metadata: Metadata = {
  ...defaultMetadata,
}

export default async function Home() {
  return (
    <Layout>
      <HeroGridPattern
        withGradient
        variant="grid"
        className="mask-[linear-gradient(to_bottom_right,rgba(255,255,255,0.5),transparent_100%)] md:mask-[linear-gradient(to_bottom_right,rgba(255,255,255,0.8),transparent_60%)]"
      />

      <main className="max-w-9xl mx-auto flex w-full flex-col items-center justify-center">
        <Hero />
        <div className="via-border my-4 h-px w-full bg-linear-to-r from-transparent to-transparent lg:my-8" />
        <SavePotential />
        <PriceCreep />
        <ValueProposition />
        <InflationContext />
        <InflationBasketConcept />
        <PricingSection />
        <SearchDialogQuickNav />
      </main>
    </Layout>
  )
}
