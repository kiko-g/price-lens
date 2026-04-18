import { Metadata } from "next"
import { redirect } from "next/navigation"
import Link from "next/link"
import { getTranslations } from "next-intl/server"

import type { StoreProduct, Price } from "@/types"
import { pageMetadata, pageMetadataFromKey } from "@/lib/config"
import { createClient } from "@/lib/supabase/server"
import { storeProductQueries } from "@/lib/queries/products"
import { priceQueries } from "@/lib/queries/prices"

import { Button } from "@/components/ui/button"
import { BackButton } from "@/components/ui/combo/back-button"
import { HeroGridPattern } from "@/components/home/HeroGridPattern"
import { BarcodeCompare } from "@/components/products/BarcodeCompare"

import { SearchIcon } from "lucide-react"

interface PageProps {
  searchParams: Promise<{ canonical?: string }>
}

interface ProductWithPrices {
  product: StoreProduct
  prices: Price[]
}

async function getProductsByCanonical(canonicalId: number) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: products } = await storeProductQueries.getAllByCanonicalId(canonicalId, user?.id || null)

  return products ?? []
}

async function getProductsWithPrices(products: StoreProduct[]): Promise<ProductWithPrices[]> {
  const pricePromises = products.map(async (product) => {
    if (!product.id) return { product, prices: [] }
    const prices = await priceQueries.getPricePointsPerIndividualProduct(product.id)
    return { product, prices: prices ?? [] }
  })

  return Promise.all(pricePromises)
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { canonical } = await searchParams
  const canonicalId = canonical ? parseInt(canonical) : null

  if (!canonicalId) {
    return pageMetadataFromKey("compare")
  }

  const t = await getTranslations("metadata.compare")
  const products = await getProductsByCanonical(canonicalId)

  if (products.length === 0) {
    return pageMetadata(t("lookupTitle", { id: canonicalId }), t("lookupDescription", { id: canonicalId }))
  }

  const firstProduct = products[0]
  const storeCount = new Set(products.map((p) => p.origin_id)).size
  const name = firstProduct.name || t("genericProduct")
  const title = t("title", { name })
  const description = t("description", { name, count: storeCount })

  return pageMetadata(title, description)
}

export default async function CanonicalComparePage({ searchParams }: PageProps) {
  const { canonical } = await searchParams
  const canonicalId = canonical ? parseInt(canonical) : null

  if (!canonicalId) {
    redirect("/products")
  }

  const products = await getProductsByCanonical(canonicalId)

  if (products.length > 0) {
    const barcodes = [...new Set(products.map((p) => p.barcode).filter(Boolean))] as string[]
    const displayBarcode = barcodes[0] ?? ""
    const productsWithPrices = await getProductsWithPrices(products)

    return (
      <div className="flex w-full flex-col items-center justify-start p-4">
        <BarcodeCompare
          products={products}
          productsWithPrices={productsWithPrices}
          barcode={displayBarcode}
          barcodes={barcodes}
        />
      </div>
    )
  }

  const t = await getTranslations("compare.empty")
  const tNav = await getTranslations("nav")
  return (
    <div className="flex w-full grow flex-col items-center justify-center">
      <HeroGridPattern
        withGradient
        variant="grid"
        className="mask-[linear-gradient(to_bottom_right,rgba(255,255,255,0.5),transparent_100%)] md:mask-[linear-gradient(to_bottom_right,rgba(255,255,255,0.8),transparent_60%)]"
      />
      <div className="flex w-full flex-col items-center justify-center gap-4 px-4">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("title")}</h1>
        <p className="text-muted-foreground max-w-sm text-center">{t("body")}</p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <BackButton />
          <Button asChild variant="outline">
            <Link href="/products" prefetch={false}>
              <SearchIcon className="h-4 w-4" />
              {tNav("browse")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
