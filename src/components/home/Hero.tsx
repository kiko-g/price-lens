import { Suspense } from "react"
import { cn } from "@/lib/utils"

import { getHomeStats } from "@/lib/queries/home-stats"
import { getHeroProducts } from "@/lib/business/hero"

import { Skeleton } from "@/components/ui/skeleton"
import { HomeSearchBar } from "@/components/home/HomeSearchBar"
import { MarketPulseCard } from "@/components/home/MarketPulseCard"
import { EntryPointGrid } from "@/components/home/EntryPointGrid"
import { ChainQuickFilters } from "@/components/home/ChainQuickFilters"
import { StoreOverviewCards } from "@/components/home/StoreOverviewCards"
import { FreshnessBadge } from "@/components/home/FreshnessBadge"
import { PopularProducts } from "@/components/home/PopularProducts"

async function HeroContent() {
  const [stats, heroProducts] = await Promise.all([getHomeStats(), getHeroProducts()])

  return (
    <div className="z-20 mx-auto w-full max-w-7xl px-4 lg:px-8">
      {/* ─── Mobile layout ─── */}
      <div className="lg:hidden">
        <div className="flex flex-col items-center gap-3 pt-10 pb-6">
          <h1
            className={cn(
              "animate-fade-in",
              "bg-linear-to-br from-30% bg-clip-text text-transparent",
              "from-zinc-950 to-zinc-500 dark:from-zinc-50 dark:to-zinc-400",
              "w-full max-w-full text-center text-3xl leading-[1.1] font-bold tracking-tight opacity-0 [--animation-delay:100ms] sm:w-full sm:max-w-full sm:text-4xl",
            )}
          >
            Price tracking for Portuguese supermarkets
          </h1>

          <p className="text-muted-foreground animate-fade-in text-center text-sm opacity-0 [--animation-delay:150ms]">
            Turn supermarket swings into savings.
            <br />
            More{" "}
            <strong className="text-primary-900 dark:text-primary-300/70 font-semibold">money in your pocket</strong>.
          </p>

          <div className="animate-fade-in mb-3 w-full max-w-md opacity-0 [--animation-delay:200ms] md:mb-0">
            <HomeSearchBar totalProducts={stats.totalProducts} />
          </div>

          <div className="animate-fade-in w-full opacity-0 [--animation-delay:250ms]">
            <MarketPulseCard stats={stats} />
          </div>
        </div>

        <div className="flex flex-col gap-5 pb-6">
          <div className="animate-fade-in opacity-0 [--animation-delay:300ms]">
            <EntryPointGrid />
          </div>
          <div className="animate-fade-in opacity-0 [--animation-delay:350ms]">
            <ChainQuickFilters perStore={stats.perStore} />
          </div>
          <FreshnessBadge
            computedAt={stats.computedAt}
            className="animate-fade-in justify-center opacity-0 [--animation-delay:400ms]"
          />
          {heroProducts.length > 0 && (
            <div className="animate-fade-in opacity-0 [--animation-delay:450ms]">
              <PopularProducts products={heroProducts} />
            </div>
          )}
        </div>
      </div>

      {/* ─── Desktop layout (matches mockup) ─── */}
      <div className="hidden lg:block">
        {/* Row 1: Two-column — left: title/subtitle/search/stats, right: store cards */}
        <div className="flex gap-10 pt-20 pb-6">
          <div className="animate-fade-in flex flex-1 flex-col gap-5 opacity-0 [--animation-delay:100ms]">
            <h1
              className={cn(
                "bg-linear-to-br from-30% bg-clip-text text-transparent",
                "from-zinc-950 to-zinc-500 dark:from-zinc-50 dark:to-zinc-400",
                "max-w-3xl text-5xl leading-[1.1] font-bold tracking-tight xl:text-6xl",
              )}
            >
              Price tracking for Portuguese supermarkets
            </h1>

            <p className="text-muted-foreground max-w-lg text-base text-balance">
              Daily price monitoring across Continente, Auchan and Pingo Doce.
              <br />
              Turn supermarket swings into strong. More{" "}
              <strong className="text-primary-900 dark:text-primary-300/70 font-bold">money in your pocket</strong>.
            </p>

            <div className="w-full max-w-lg">
              <HomeSearchBar totalProducts={stats.totalProducts} />
            </div>

            <MarketPulseCard stats={stats} variant="inline" />
          </div>

          <div className="animate-fade-in w-[200px] shrink-0 opacity-0 [--animation-delay:200ms] xl:w-[260px]">
            <StoreOverviewCards perStore={stats.perStore} variant="stack" />
          </div>
        </div>

        {/* Row 2: Entry points — clean links */}
        <div className="animate-fade-in pb-8 opacity-0 [--animation-delay:300ms]">
          <EntryPointGrid variant="row" />
        </div>

        {/* Row 4: Popular products — full width */}
        {heroProducts.length > 0 && (
          <div className="animate-fade-in pb-6 opacity-0 [--animation-delay:400ms]">
            <PopularProducts products={heroProducts} />
          </div>
        )}

        {/* Row 5: Freshness badge */}
        <div className="animate-fade-in pb-12 opacity-0 [--animation-delay:450ms]">
          <FreshnessBadge computedAt={stats.computedAt} className="justify-center" />
        </div>
      </div>
    </div>
  )
}

function HeroSkeleton() {
  return (
    <div className="z-20 mx-auto w-full max-w-7xl px-4 lg:px-8">
      {/* Mobile skeleton */}
      <div className="lg:hidden">
        <div className="flex flex-col items-center gap-6 pt-10 pb-6">
          <Skeleton className="h-10 w-3/4 max-w-xs" />
          <Skeleton className="h-12 w-full max-w-md rounded-xl" />
          <div className="flex w-full gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 flex-1 rounded-xl" />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-5 pb-6">
          <div className="grid grid-cols-2 gap-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
      {/* Desktop skeleton */}
      <div className="hidden lg:block">
        <div className="flex gap-10 pt-20 pb-8">
          <div className="flex flex-1 flex-col gap-5">
            <Skeleton className="h-16 w-3/4 max-w-lg" />
            <Skeleton className="h-5 w-96" />
            <Skeleton className="h-12 w-full max-w-lg rounded-xl" />
          </div>
          <div className="flex w-[280px] shrink-0 flex-col gap-2.5 xl:w-[320px]">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 flex-1 rounded-2xl" />
            ))}
          </div>
        </div>
        <Skeleton className="mb-5 h-10 w-[500px] rounded-full" />
        <div className="flex gap-2.5 pb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 flex-1 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="mb-6 h-48 rounded-2xl" />
      </div>
    </div>
  )
}

export async function Hero() {
  return (
    <section className="w-full">
      <Suspense fallback={<HeroSkeleton />}>
        <HeroContent />
      </Suspense>
    </section>
  )
}
