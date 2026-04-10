import { Suspense } from "react"
import type { Metadata } from "next"
import { defaultMetadata } from "@/lib/config"
import { getHomeStats } from "@/lib/queries/home-stats"

import { Layout } from "@/components/layout"
import { Hero } from "@/components/home/Hero"
import { HeroGridPattern } from "@/components/home/HeroGridPattern"
import { DiagonalSplitCta } from "@/components/home/DiagonalSplitCta"
import { AboutTeaserCta } from "@/components/home/AboutTeaserCta"
import { HomeContent } from "@/components/home/HomeContent"
import { PersonalizedDashboardSkeleton } from "@/components/home/PersonalizedDashboardSkeleton"

export const revalidate = 3600

export const metadata: Metadata = {
  ...defaultMetadata,
}

function Separator() {
  return (
    <div className="from-border/5 via-border/30 to-border/5 dark:from-border/5 dark:via-border/50 dark:to-border/5 my-2 h-[2px] w-full bg-linear-to-r lg:my-4" />
  )
}

async function HomeContentWrapper() {
  const stats = await getHomeStats()

  const marketingContent = (
    <>
      <Hero />

      <Separator />
      <DiagonalSplitCta />
      <Separator />
      <AboutTeaserCta />
    </>
  )

  return <HomeContent totalProducts={stats.totalProducts} marketingContent={marketingContent} />
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
        <Suspense fallback={<PersonalizedDashboardSkeleton />}>
          <HomeContentWrapper />
        </Suspense>
      </main>
    </Layout>
  )
}
