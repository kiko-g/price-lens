import { Suspense } from "react"
import Link from "next/link"

import { defaultMetadata } from "@/lib/config"
import type { Metadata } from "next"

import { Layout } from "@/components/layout"
import { LightRays } from "@/components/ui/magic/light-rays"

import { Hero } from "@/components/home/Hero"
import { HeroGridPattern } from "@/components/home/HeroGridPattern"
import { SavingsSpotlight } from "@/components/home/SavingsSpotlight"
import { FeaturePreviewCards } from "@/components/home/FeaturePreviewCards"

import { ArrowRight, TrendingUpIcon, EyeIcon, PiggyBankIcon } from "lucide-react"

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
            <div className="max-w-9xl z-20 mx-auto flex min-h-[calc(100svh-var(--header-height))] w-full items-center justify-center px-4 py-12 lg:px-20">
              <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
            </div>
          }
        >
          <Hero />
        </Suspense>

        <SavingsSpotlight />

        <Separator />

        <FeaturePreviewCards />

        <Separator />

        <section className="w-full px-4 py-10 md:py-16">
          <div className="mx-auto flex max-w-3xl flex-col gap-8">
            <div className="flex flex-col gap-2 text-center">
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">You&apos;re paying more than you need to</h2>
              <p className="text-muted-foreground mx-auto max-w-lg text-sm text-balance">
                Prices shift every week. Without tracking and monitoring, it&apos;s hard to notice but your wallet feels
                the pain.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                {
                  icon: EyeIcon,
                  title: "Invisible price creep",
                  text: "A few cents here, a few cents there. Over a year, small hikes on everyday products add up to hundreds of euros you never noticed losing.",
                },
                {
                  icon: TrendingUpIcon,
                  title: "Full price history",
                  text: "See exactly how a product's price has moved over weeks and months. No more guessing whether today's price is actually a deal.",
                },
                {
                  icon: PiggyBankIcon,
                  title: "Buy at the right time",
                  text: "Most products cycle through discounts. Price Lens shows you when prices drop so you can stock up when it matters.",
                },
              ].map((item) => (
                <div key={item.title} className="bg-card flex flex-col gap-2 rounded-xl border p-4">
                  <div className="bg-primary/10 flex size-9 items-center justify-center rounded-lg">
                    <item.icon className="text-primary size-4.5" />
                  </div>
                  <h3 className="text-sm font-semibold">{item.title}</h3>
                  <p className="text-muted-foreground text-xs leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>

            <Link
              href="/about"
              className="bg-card hover:bg-accent group relative flex items-center justify-between overflow-hidden rounded-xl border p-5 transition-colors"
            >
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold">Understand the bigger picture</span>
                <span className="text-muted-foreground text-xs text-balance">
                  Portuguese grocery inflation hit 20%+ over the last 5 years. See the data, understand the impact, and
                  learn how Price Lens helps you fight back.
                </span>
              </div>
              <ArrowRight className="text-muted-foreground size-5 shrink-0 transition-transform group-hover:translate-x-1" />

              <div className="dark:from-primary/10 from-primary/4 to-secondary/6 dark:to-secondary/20 absolute inset-0 bg-linear-to-r">
                <LightRays />
              </div>
            </Link>
          </div>
        </section>
      </main>
    </Layout>
  )
}
