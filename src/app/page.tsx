import type { Metadata } from "next"

import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { GridHome } from "@/components/home/GridHome"

export const metadata: Metadata = {
  title: "Price Lens",
  description: "Price Lens lets you see through prices. Get a real sense of what's going on. You are awake now.",
}

type SearchParams = {
  q?: string
  page?: string
}

type Props = {
  searchParams: Promise<SearchParams>
}

export default async function Home({ searchParams }: Props) {
  const params = await Promise.resolve(searchParams)

  return (
    <Layout>
      <GridHome />
      <div className="z-20 flex w-full flex-1 flex-col items-start justify-start gap-4 px-20 py-20">
        <h1 className="animate-fade-in z-10 translate-y-[-1rem] text-balance bg-gradient-to-br from-black from-30% to-black/40 bg-clip-text py-2 text-4xl font-medium leading-none tracking-tighter text-transparent opacity-0 [--animation-delay:200ms] dark:from-white dark:to-white/40 sm:text-5xl md:text-6xl lg:text-7xl">
          Price Lens
          <br className="hidden md:block" />
          See through prices
        </h1>
        <p className="animate-fade-in translate-y-[-1rem] text-balance tracking-tight text-gray-400 opacity-0 [--animation-delay:400ms] md:text-lg">
          Monitor daily price changes on essential consumer goods that impact inflation metrics. Stay informed and aware
          of how supermarket prices change. See beyond the headlines and tags.
        </p>

        <div className="mt-3 flex gap-2">
          <Button size="lg">Get Started</Button>
        </div>
      </div>
    </Layout>
  )
}
