import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Brands } from "@/components/home/showcase/Brands"
import { AnimatedPriceCounter } from "@/components/home/AnimatedPriceCounter"

import { ShoppingBasketIcon, ArrowRightIcon } from "lucide-react"

export async function Hero() {
  const supermarketProductsLink = "/products"

  return (
    <section className="z-20 flex w-full flex-col items-center justify-center px-4 pt-16 pb-8 md:px-16 md:pt-24 md:pb-12 lg:px-20 lg:pt-32 lg:pb-16">
      <div className="flex max-w-4xl flex-col items-center gap-6 text-center">
        <div className="animate-fade-in flex flex-col items-center gap-3 opacity-0 [--animation-delay:100ms]">
          <span className="text-muted-foreground inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium tracking-tight">
            Price tracking for Portuguese supermarkets
          </span>
        </div>

        <h1 className="animate-fade-in z-10 -translate-y-4 text-center text-4xl leading-[1.1] font-bold tracking-tighter text-balance opacity-0 [--animation-delay:200ms] sm:text-5xl md:text-6xl lg:text-7xl">
          Prices rise.
          <br />
          <span className="text-muted-foreground/70">You barely notice.</span>
        </h1>

        <p className="animate-fade-in text-muted-foreground max-w-2xl -translate-y-4 text-center text-lg leading-relaxed tracking-tight text-balance opacity-0 [--animation-delay:400ms] md:text-xl">
          A few cents here, a few cents there. Over months, your grocery bill quietly climbs without you ever noticing.
          Price Lens tracks it all so you can see what&apos;s really happening.
        </p>

        <AnimatedPriceCounter />

        <div className="animate-fade-in flex flex-wrap items-center justify-center gap-3 opacity-0 [--animation-delay:800ms] md:gap-4">
          <Button variant="marketing" size="lg" className="w-full md:w-auto" asChild>
            <Link href={supermarketProductsLink}>
              Explore Products
              <ShoppingBasketIcon />
            </Link>
          </Button>

          <Button variant="ghost" size="lg" className="w-full md:w-auto" asChild>
            <Link href="#how-it-works">
              See how it works
              <ArrowRightIcon />
            </Link>
          </Button>
        </div>

        <Brands className="mt-4 md:mt-8" />
      </div>
    </section>
  )
}
