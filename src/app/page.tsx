import { Suspense } from "react"
import type { Metadata } from "next"
import { defaultMetadata } from "@/lib/config"

import { Layout } from "@/components/layout"
import { Hero } from "@/components/home/Hero"
import { HeroGridPattern } from "@/components/home/HeroGridPattern"
import { SavingsEvidence } from "@/components/home/SavingsEvidence"
import { AboutTeaserCta } from "@/components/home/AboutTeaserCta"

export const revalidate = 3600

export const metadata: Metadata = {
  ...defaultMetadata,
}

function Separator() {
  return (
    <div className="from-border/5 via-border/30 to-border/5 dark:from-border/5 dark:via-border/50 dark:to-border/5 my-2 h-[2px] w-full bg-linear-to-r lg:my-4" />
  )
}

export default async function Home() {
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
            <div className="z-20 mx-auto flex min-h-[50vh] w-full items-center justify-center px-4 py-12">
              <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
            </div>
          }
        >
          <Hero />
        </Suspense>
        <Separator />
        <SavingsEvidence />
        <Separator />
        <AboutTeaserCta />
      </main>
    </Layout>
  )
}
