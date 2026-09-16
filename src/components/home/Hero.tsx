import { Suspense } from "react"
import { getTranslations } from "next-intl/server"
import { cn } from "@/lib/utils"

import { getHomeStats } from "@/lib/queries/home-stats"
import { getHeroProducts } from "@/lib/business/hero"

import Link from "next/link"

import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { BarcodeScanButton } from "@/components/scan"
import { GlyphScan } from "@/components/icons/lince-glyphs"
import { ArrowRightIcon } from "lucide-react"
import { HomeSearchBar } from "@/components/home/HomeSearchBar"
import { MarketPulseCard } from "@/components/home/MarketPulseCard"
import { EntryPointGrid } from "@/components/home/EntryPointGrid"
import { ChainQuickFilters } from "@/components/home/ChainQuickFilters"
import { StoreOverviewCards } from "@/components/home/StoreOverviewCards"
import { FreshnessBadge } from "@/components/home/FreshnessBadge"
import { PopularProducts } from "@/components/home/PopularProducts"
import { HeroEmphasis } from "@/components/i18n/rich-tags"

async function HeroContent() {
  const [stats, heroProducts, t] = await Promise.all([getHomeStats(), getHeroProducts(), getTranslations("home.hero")])

  return (
    <div className="z-20 mx-auto w-full max-w-7xl px-4 lg:px-8">
      {/* ─── Mobile layout ─── */}
      <div className="lg:hidden">
        <div className="flex flex-col items-center pt-6 pb-6">
          <span className="eyebrow text-primary animate-fade-in mb-3 opacity-0 [--animation-delay:50ms]">
            {t("kicker")}
          </span>
          <h1
            className={cn(
              "animate-fade-in text-foreground",
              "w-full max-w-full text-center text-[2.1rem] leading-[1.05] font-bold tracking-[-0.03em] opacity-0 [--animation-delay:100ms] sm:text-4xl",
            )}
          >
            {t.rich("title", { em: HeroEmphasis })}
          </h1>

          <p className="text-muted-foreground animate-fade-in my-3 max-w-md text-center text-sm leading-relaxed opacity-0 [--animation-delay:150ms]">
            {t("lead")}
          </p>

          <div className="animate-fade-in mb-4 w-full opacity-0 [--animation-delay:250ms]">
            <MarketPulseCard stats={stats} />
          </div>

          <div className="animate-fade-in w-full max-w-md opacity-0 [--animation-delay:200ms] md:mb-0">
            <HomeSearchBar totalProducts={stats.totalProducts} />
          </div>
        </div>

        <div className="flex flex-col gap-5 pb-6">
          <div className="animate-fade-in opacity-0 [--animation-delay:300ms]">
            <EntryPointGrid variant="row" />
          </div>

          <div className="animate-fade-in opacity-0 [--animation-delay:350ms]">
            <ChainQuickFilters perStore={stats.perStore} />
          </div>

          <FreshnessBadge
            computedAt={stats.computedAt}
            className="animate-fade-in -mt-2 justify-center opacity-0 [--animation-delay:400ms] md:mt-0"
          />

          {heroProducts.length > 0 && (
            <div className="animate-fade-in -mt-2 opacity-0 [--animation-delay:450ms] md:mt-0">
              <PopularProducts products={heroProducts} />
            </div>
          )}
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden lg:block">
        {/* Row 1: Two-column left: title/subtitle/search/stats, right: store cards */}
        <div className="flex gap-10 pt-20 pb-6">
          <div className="animate-fade-in flex flex-1 flex-col gap-5 opacity-0 [--animation-delay:100ms]">
            <span className="eyebrow text-primary">{t("kicker")}</span>
            <h1 className="text-foreground -mt-2 max-w-3xl text-5xl leading-[1.02] font-bold tracking-[-0.035em] xl:text-[3.6rem]">
              {t.rich("title", { em: HeroEmphasis })}
            </h1>

            <p className="text-muted-foreground max-w-xl text-[17px] leading-relaxed text-balance">{t("lead")}</p>

            <div className="flex flex-wrap items-center gap-3">
              <Button asChild variant="default" size="lg" className="px-5 text-[15px]">
                <Link href="/products">
                  {t("ctaExplore")}
                  <ArrowRightIcon className="size-4" />
                </Link>
              </Button>
              <BarcodeScanButton>
                <Button variant="hud" size="lg" className="px-5 text-[15px]">
                  <GlyphScan className="size-4" />
                  {t("ctaScan")}
                </Button>
              </BarcodeScanButton>
            </div>

            <div className="mt-6 max-w-3xl">
              <MarketPulseCard stats={stats} variant="inline" />
            </div>
          </div>

          <div className="animate-fade-in w-[200px] shrink-0 opacity-0 [--animation-delay:200ms] xl:w-[260px]">
            <StoreOverviewCards perStore={stats.perStore} variant="stack" />
          </div>
        </div>

        {/* Row 2: Entry points clean links */}
        <div className="animate-fade-in pb-8 opacity-0 [--animation-delay:300ms]">
          <EntryPointGrid variant="row" />
        </div>

        {/* Row 4: Popular products full width */}
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
      {/* Mobile skeleton: matches HeroContent mobile: pt-6 pb-6, individual spacing */}
      <div className="lg:hidden">
        <div className="flex flex-col items-center pt-6 pb-6">
          <Skeleton className="h-[72px] w-3/4 max-w-xs rounded-lg" />
          <Skeleton className="my-2.5 h-4 w-56" />
          <Skeleton className="mb-4 h-16 w-full rounded-xl" />
          <Skeleton className="h-12 w-full max-w-md rounded-xl" />
        </div>
        <div className="flex flex-col gap-5 pb-6">
          {/* Entry points: row variant: horizontal pills */}
          <div className="flex w-full items-center justify-center gap-2.5">
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-8 w-28 rounded-full" />
            <Skeleton className="h-8 w-32 rounded-full" />
          </div>
          {/* Chain quick filters */}
          <div className="flex w-full gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 flex-1 rounded-xl" />
            ))}
          </div>
        </div>
      </div>

      {/* Desktop skeleton: matches HeroContent desktop layout */}
      <div className="hidden lg:block">
        <div className="flex gap-10 pt-20 pb-6">
          <div className="flex flex-1 flex-col gap-5">
            <Skeleton className="h-16 w-3/4 max-w-lg" />
            <Skeleton className="h-5 w-96" />
            <Skeleton className="h-12 w-full max-w-lg rounded-xl" />
            <Skeleton className="h-10 w-80 rounded-lg" />
          </div>
          <div className="flex w-[200px] shrink-0 flex-col gap-2.5 xl:w-[260px]">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 flex-1 rounded-2xl" />
            ))}
          </div>
        </div>

        {/* Entry points: row variant: horizontal pills */}
        <div className="flex items-center gap-2.5 pb-8">
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-8 w-28 rounded-full" />
          <Skeleton className="h-8 w-32 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>

        {/* Popular products */}
        <Skeleton className="mb-6 h-48 rounded-2xl" />

        {/* Freshness badge */}
        <div className="flex justify-center pb-12">
          <Skeleton className="h-4 w-48" />
        </div>
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
