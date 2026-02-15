import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Brands } from "@/components/home/showcase/Brands"
import { ProductShowcaseCarousel } from "@/components/home/showcase/ProductShowcaseCarousel"
import { SHOWCASE_PRODUCT_IDS } from "@/lib/business/showcase"
import { getShowcaseProducts } from "@/lib/business/showcase/queries"

import { BadgeEuroIcon, ShoppingBasketIcon } from "lucide-react"

export async function Hero() {
  const supermarketProductsLink = "/products"
  const trackedProductsLink = "/products?priority=2,3,4,5"

  // Fetch showcase data server-side
  const showcaseData = await getShowcaseProducts(SHOWCASE_PRODUCT_IDS)

  return (
    <div className="max-w-9xl z-20 mx-auto flex min-h-[calc(100svh-54px)] w-full flex-col items-center justify-center gap-6 px-4 py-12 lg:flex-row lg:items-center lg:justify-center lg:gap-12 lg:px-20 lg:py-0">
      <div className="qjustify-center flex w-full max-w-2xl flex-col items-center gap-4 lg:max-w-none lg:flex-1 lg:items-start lg:justify-start">
        <h1 className="animate-fade-in z-10 -translate-y-4 bg-linear-to-br from-zinc-950 from-30% to-zinc-950/70 bg-clip-text py-2 text-center text-4xl leading-none font-medium tracking-tighter text-balance text-transparent opacity-0 [--animation-delay:200ms] sm:text-5xl md:text-left md:text-6xl md:font-medium lg:text-7xl dark:from-white dark:to-white/40">
          Your groceries cost more than last month.
          <br className="block" />
          Did you notice?
        </h1>
        <p className="animate-fade-in text-muted-foreground max-w-3xl -translate-y-4 text-center tracking-tight text-balance opacity-0 [--animation-delay:400ms] md:text-left md:text-lg">
          Price hikes happen in tiny increments. A few cents here, a few cents there. You barely notice each one, but
          they add up fast. Price Lens tracks daily price changes across Portuguese supermarkets so you can see what the
          shelf tag won&apos;t tell you.
        </p>

        <div className="animate-fade-in flex flex-wrap gap-3 opacity-0 [--animation-delay:600ms] md:mt-3 md:gap-4">
          <Button variant="primary" size="lg" className="w-full md:w-auto" asChild>
            <Link href={supermarketProductsLink}>
              Explore Supermarket
              <ShoppingBasketIcon />
            </Link>
          </Button>

          <Button variant="outline" size="lg" className="w-full md:w-auto" asChild>
            <Link href={trackedProductsLink}>
              Tracked Products
              <BadgeEuroIcon />
            </Link>
          </Button>
        </div>

        <Brands className="mt-8" />
      </div>

      <div className="w-full max-w-full flex-1 overflow-hidden lg:w-auto lg:max-w-md">
        <ProductShowcaseCarousel
          className="border-border w-full bg-linear-to-br shadow-none"
          initialData={showcaseData}
        />
      </div>
    </div>
  )
}
