import { Badge } from "@/components/ui/badge"
import { ProductShowcaseCarousel } from "@/components/home/showcase/ProductShowcaseCarousel"
import { SHOWCASE_PRODUCT_IDS } from "@/lib/business/showcase"
import { getShowcaseProducts } from "@/lib/business/showcase/queries"
import { BarChart3Icon } from "lucide-react"

export async function ProductShowcaseSection() {
  const showcaseData = await getShowcaseProducts(SHOWCASE_PRODUCT_IDS)

  return (
    <section className="bg-muted/30 w-full border-y py-16 md:py-24">
      <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <Badge variant="glass-success" size="md">
            <BarChart3Icon className="size-3.5" />
            Live tracking
          </Badge>

          <h2 className="max-w-3xl text-3xl font-bold tracking-tighter text-balance sm:text-4xl md:text-5xl">
            See real price tracking in action
          </h2>
          <p className="text-muted-foreground max-w-2xl text-lg leading-relaxed text-balance">
            These are real products being tracked right now across Portuguese supermarkets. Swipe through to see how
            prices move day to day.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-lg md:mt-14">
          <ProductShowcaseCarousel
            className="border-border w-full bg-linear-to-br shadow-none"
            initialData={showcaseData}
          />
        </div>
      </div>
    </section>
  )
}
