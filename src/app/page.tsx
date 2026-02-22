import dynamic from "next/dynamic"
import { Suspense } from "react"

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
  const CustomSeparator = () => (
    <div className="from-border/5 via-border/30 to-border/5 dark:from-border/5 dark:via-border/50 dark:to-border/5 my-4 h-[2px] w-full bg-linear-to-r lg:my-8" />
  )

  return (
    <Layout>
      <HeroGridPattern
        withGradient
        variant="grid"
        className="mask-[linear-gradient(to_bottom_right,rgba(255,255,255,0.5),transparent_100%)] md:mask-[linear-gradient(to_bottom_right,rgba(255,255,255,1.0),transparent_100%)]"
      />

      <main className="flex w-full flex-col items-center justify-center">
        <Suspense
          fallback={
            <div className="max-w-9xl z-20 mx-auto flex min-h-[calc(100svh-var(--header-height))] w-full flex-col items-center justify-center gap-6 px-4 py-12 lg:flex-row lg:items-center lg:justify-center lg:gap-12 lg:px-20 lg:py-0" />
          }
        >
          <Hero />
        </Suspense>
        <SavePotential />
        <CustomSeparator />
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
