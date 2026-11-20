import { Suspense } from "react"
import type { Metadata } from "next"
import { defaultMetadata } from "@/lib/brand/metadata"
import { getHomeStats } from "@/lib/queries/home-stats"
import { getHeroProducts } from "@/lib/business/hero"
import { createClient } from "@/lib/supabase/server"
import { resolveUser } from "@/lib/supabase/tools"

import { Layout } from "@/components/layout"
import { HeroGridPattern } from "@/components/home/HeroGridPattern"
import { GuestHome } from "@/components/home/GuestHome"
import { GuestHomeSkeleton } from "@/components/home/GuestHomeSkeleton"
import { PersonalizedDashboard } from "@/components/home/PersonalizedDashboard"
import { PersonalizedDashboardSkeleton } from "@/components/home/PersonalizedDashboardSkeleton"

export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  return defaultMetadata()
}

async function HomeBody({ signedIn }: { signedIn: boolean }) {
  const [stats, heroProducts] = await Promise.all([getHomeStats(), getHeroProducts()])

  if (signedIn) {
    return <PersonalizedDashboard totalProducts={stats.totalProducts} heroProducts={heroProducts} />
  }

  return <GuestHome stats={stats} products={heroProducts} />
}

export default async function Home() {
  // No auth cookie returns immediately, so signed-out visitors never wait on getUser().
  const signedIn = !!(await resolveUser(createClient()))

  return (
    <Layout>
      <HeroGridPattern
        withGradient
        variant="grid"
        className="mask-[linear-gradient(to_bottom_right,rgba(255,255,255,0.5),transparent_100%)] md:mask-[linear-gradient(to_bottom_right,rgba(255,255,255,1.0),transparent_100%)]"
      />

      <main className="flex w-full flex-col items-center justify-center">
        <Suspense fallback={signedIn ? <PersonalizedDashboardSkeleton /> : <GuestHomeSkeleton />}>
          <HomeBody signedIn={signedIn} />
        </Suspense>
      </main>
    </Layout>
  )
}
