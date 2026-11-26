import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { ArrowRightIcon } from "lucide-react"

import { MiniProductCard } from "@/components/products/MiniProductCard"
import type { HeroProduct } from "@/lib/business/hero"

const VISIBLE_PRODUCTS = 8

export async function GuestProductGrid({ products }: { products: HeroProduct[] }) {
  const t = await getTranslations("home.popularProducts")
  const shown = products.slice(0, VISIBLE_PRODUCTS)
  if (shown.length === 0) return null

  return (
    <section aria-labelledby="guest-products-heading">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 id="guest-products-heading" className="text-base font-semibold tracking-tight">
            {t("title")}
          </h2>
          <p className="text-muted-foreground mt-1 max-w-xl text-sm leading-relaxed">{t("subtitle")}</p>
        </div>
        <Link
          href="/products"
          className="text-foreground hover:text-primary inline-flex shrink-0 items-center gap-1 text-sm font-medium"
        >
          {t("viewAll")}
          <ArrowRightIcon className="size-3.5" aria-hidden />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {shown.map((product) => (
          <MiniProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}
