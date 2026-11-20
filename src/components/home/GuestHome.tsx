import { getTranslations } from "next-intl/server"

import { HeroEmphasis } from "@/components/i18n/rich-tags"
import { ChainQuickFilters } from "@/components/home/ChainQuickFilters"
import { EntryPointGrid } from "@/components/home/EntryPointGrid"
import { FreshnessBadge } from "@/components/home/FreshnessBadge"
import { GuestAccountPrompt } from "@/components/home/GuestAccountPrompt"
import { GuestProductGrid } from "@/components/home/GuestProductGrid"
import { HomeSearchBar } from "@/components/home/HomeSearchBar"
import { MarketPulseCard } from "@/components/home/MarketPulseCard"
import type { HeroProduct } from "@/lib/business/hero"
import type { HomeStats } from "@/lib/queries/home-stats"

/**
 * Public homepage. Rendered for signed-out visitors and as the first paint for everyone,
 * so auth resolving never swaps this layout for a dashboard skeleton.
 */
export async function GuestHome({ stats, products }: { stats: HomeStats; products: HeroProduct[] }) {
  const t = await getTranslations("home.hero")
  const tChains = await getTranslations("home.chainFilters")

  return (
    <div className="z-20 mx-auto w-full max-w-7xl px-4 pt-6 pb-12 lg:px-8 lg:pt-10 lg:pb-16">
      <div className="max-w-2xl">
        <span className="eyebrow text-primary mb-3 block">{t("kicker")}</span>
        <h1 className="text-foreground text-[2.1rem] leading-[1.05] font-bold tracking-[-0.03em] sm:text-4xl lg:text-5xl lg:leading-[1.02]">
          {t.rich("title", { em: HeroEmphasis })}
        </h1>
        <p className="text-muted-foreground mt-3 max-w-xl text-sm leading-relaxed lg:text-[17px]">{t("lead")}</p>
      </div>

      <div className="mt-5 max-w-xl">
        <HomeSearchBar totalProducts={stats.totalProducts} />
      </div>

      <div className="mt-8">
        <MarketPulseCard stats={stats} />
      </div>

      <FreshnessBadge computedAt={stats.computedAt} className="mt-3" />

      <div className="mt-8">
        <EntryPointGrid />
      </div>

      {stats.perStore.length > 0 && (
        <section className="mt-8" aria-labelledby="guest-chains-heading">
          <h2 id="guest-chains-heading" className="mb-3 text-sm font-semibold tracking-tight">
            {tChains("heading")}
          </h2>
          <ChainQuickFilters perStore={stats.perStore} />
        </section>
      )}

      {products.length > 0 && (
        <div className="mt-10">
          <GuestProductGrid products={products} />
        </div>
      )}

      <div className="mt-10">
        <GuestAccountPrompt />
      </div>
    </div>
  )
}
