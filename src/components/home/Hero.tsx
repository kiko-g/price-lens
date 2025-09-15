"use client"

import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Brands } from "@/components/home/showcase/Brands"
import { ProductShowcaseCarousel } from "@/components/home/showcase/ProductShowcaseCarousel"

import { BadgeEuroIcon, ShoppingBasketIcon } from "lucide-react"

export function Hero() {
  console.debug("render!")
  return (
    <div className="z-20 flex w-full flex-1 flex-col items-center justify-center gap-3 px-4 py-8 lg:flex-row lg:items-start lg:justify-start lg:gap-8 lg:px-20 lg:py-20">
      <div className="flex w-full flex-1 flex-col gap-4 pt-12 pb-4 md:gap-4 lg:pt-0 lg:pb-0">
        <h1 className="animate-fade-in z-10 -translate-y-4 bg-linear-to-br from-black from-30% to-black/40 bg-clip-text py-2 text-center text-4xl leading-none font-medium tracking-tighter text-balance text-transparent opacity-0 [--animation-delay:200ms] sm:text-5xl md:text-left md:text-6xl lg:text-7xl dark:from-white dark:to-white/40">
          Price Lens
          <br className="block" />
          See through prices
        </h1>
        <p className="animate-fade-in text-muted-foreground max-w-3xl -translate-y-4 text-center tracking-tight text-balance opacity-0 [--animation-delay:400ms] md:text-left md:text-lg">
          Monitor daily price changes on essential consumer goods that impact inflation metrics. Stay informed and aware
          of how supermarket prices change. See beyond the headlines and tags. Data focused on Portugal-available
          supermarket chains.
        </p>

        <div className="animate-fade-in flex flex-wrap gap-3 opacity-0 [--animation-delay:600ms] md:mt-3 md:gap-4">
          <Button variant="primary" size="lg" className="w-full md:w-auto" asChild>
            <Link href="/supermarket">
              Explore Supermarket
              <ShoppingBasketIcon />
            </Link>
          </Button>

          <Button variant="outline" size="lg" className="w-full md:w-auto" asChild>
            <Link href="/tracked">
              Tracked Products
              <BadgeEuroIcon />
            </Link>
          </Button>
        </div>

        <Brands className="mt-8" />
      </div>

      <div className="my-8 w-full max-w-full flex-1 self-start overflow-hidden lg:my-0 lg:w-auto lg:max-w-md">
        <ProductShowcaseCarousel className="border-border w-full bg-linear-to-br shadow-none" />
      </div>
    </div>
  )
}
