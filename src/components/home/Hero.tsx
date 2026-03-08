import { Suspense } from "react"

import { Brands } from "@/components/home/showcase/Brands"
import { HomeSearchBar } from "@/components/home/HomeSearchBar"
import { HeadlineStats } from "@/components/home/HeadlineStats"
import { ProductShowcaseCarousel } from "@/components/home/showcase/ProductShowcaseCarousel"
import { SHOWCASE_PRODUCT_IDS } from "@/lib/business/showcase"
import { getShowcaseProducts } from "@/lib/business/showcase/queries"
import { getHomeStats } from "@/lib/queries/home-stats"
import { Skeleton } from "@/components/ui/skeleton"

async function ShowcaseSection() {
  const showcaseData = await getShowcaseProducts(SHOWCASE_PRODUCT_IDS)

  return (
    <ProductShowcaseCarousel className="border-border w-full bg-linear-to-br shadow-none" initialData={showcaseData} />
  )
}

function ShowcaseSkeleton() {
  return <Skeleton className="h-[340px] w-full rounded-lg" />
}

export async function Hero() {
  const stats = await getHomeStats()

  return (
    <div className="max-w-9xl z-20 mx-auto flex min-h-[calc(100svh-var(--header-height))] w-full flex-col items-center justify-center gap-6 px-4 py-12 lg:flex-row lg:items-center lg:justify-center lg:gap-12 lg:px-20 lg:py-0">
      <div className="flex w-full max-w-2xl flex-col items-center gap-5 lg:max-w-none lg:flex-1 lg:items-start">
        <h1 className="animate-fade-in z-10 -translate-y-4 bg-linear-to-br from-zinc-950 from-30% to-zinc-950/70 bg-clip-text py-2 text-center text-4xl leading-none font-medium tracking-tighter text-balance text-transparent opacity-0 [--animation-delay:200ms] sm:text-5xl md:text-left md:text-6xl md:font-medium lg:text-7xl dark:from-white dark:to-white/40">
          See beyond the price tag
        </h1>
        <p className="animate-fade-in text-muted-foreground max-w-xl -translate-y-4 text-center tracking-tight text-balance opacity-0 [--animation-delay:400ms] md:text-left md:text-lg">
          Price hikes happen in tiny increments. You barely notice each one, but they add up fast. Price Lens tracks
          daily price changes across Portuguese supermarkets so you can see what the shelf tag won&apos;t tell you.
        </p>

        <div className="animate-fade-in w-full max-w-lg opacity-0 [--animation-delay:600ms] lg:max-w-md">
          <HomeSearchBar />
        </div>

        <div className="animate-fade-in opacity-0 [--animation-delay:700ms]">
          <HeadlineStats stats={stats} />
        </div>

        <div className="animate-fade-in opacity-0 [--animation-delay:800ms]">
          <Brands className="mt-2" />
        </div>
      </div>

      <div className="w-full max-w-full flex-1 overflow-hidden lg:w-auto lg:max-w-md">
        <Suspense fallback={<ShowcaseSkeleton />}>
          <ShowcaseSection />
        </Suspense>
      </div>
    </div>
  )
}
