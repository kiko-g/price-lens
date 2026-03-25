import { Suspense } from "react"
import { Metadata } from "next"
import { redirect } from "next/navigation"
import Link from "next/link"

import type { StoreProduct, Price } from "@/types"
import type { OffProduct } from "@/lib/canonical/open-food-facts"
import { siteConfig, pageMetadata } from "@/lib/config"
import { createClient } from "@/lib/supabase/server"
import { storeProductQueries } from "@/lib/queries/products"
import { priceQueries } from "@/lib/queries/prices"
import { generateProductPath } from "@/lib/business/product"
import { lookupBarcode } from "@/lib/canonical/open-food-facts"
import { findRelatedByOffProduct } from "@/lib/queries/product-matching"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Barcode } from "@/components/ui/combo/barcode"
import { HeroGridPattern } from "@/components/home/HeroGridPattern"
import { BarcodeCompare } from "@/components/products/BarcodeCompare"
import { OffProductPage } from "@/components/products/OffProductPage"
import { StoreProductCard } from "@/components/products/StoreProductCard"

import { SearchIcon, ExternalLinkIcon, WifiOffIcon, RefreshCwIcon, StoreIcon } from "lucide-react"
import { OpenFoodFactsIcon } from "@/components/icons/OpenFoodFactsIcon"
import { OffLookupSkeleton } from "@/components/products/OffLookupSkeleton"

interface PageProps {
  params: Promise<{ barcode: string }>
}

interface ProductWithPrices {
  product: StoreProduct
  prices: Price[]
}

async function getProductsByBarcode(barcode: string) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: products } = await storeProductQueries.getAllByBarcodeOrCanonical(barcode, user?.id || null)

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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { barcode } = await params
  const products = await getProductsByBarcode(barcode)

  if (products.length === 0) {
    return pageMetadata(`Product Lookup - ${barcode}`, `Looking up ${barcode} on ${siteConfig.name}.`)
  }

  if (products.length === 1) {
    return {
      title: "Redirecting...",
      description: "Redirecting to product page.",
    }
  }

  const firstProduct = products[0]
  const storeCount = new Set(products.map((p) => p.origin_id)).size
  const title = `Compare Prices - ${firstProduct.name || barcode}`
  const description = `Compare prices for ${firstProduct.name || "this product"} across ${storeCount} stores on ${siteConfig.name}.`

  return pageMetadata(title, description)
}

export default async function ProductByBarcodePage({ params }: PageProps) {
  const { barcode } = await params
  const products = await getProductsByBarcode(barcode)

  // Single product redirect to its detail page
  if (products.length === 1) {
    redirect(generateProductPath(products[0]))
  }

  // Multiple products render comparison inline
  if (products.length > 1) {
    const barcodes = [...new Set(products.map((p) => p.barcode).filter(Boolean))] as string[]
    const displayBarcode = barcodes[0] ?? barcode
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

  // Not in our DB try Open Food Facts with streaming
  return (
    <Suspense fallback={<OffLookupSkeleton barcode={barcode} />}>
      <OffLookupResult barcode={barcode} />
    </Suspense>
  )
}

// ─── Streamed OFF lookup ────────────────────────────────────────────

async function OffLookupResult({ barcode }: { barcode: string }) {
  const offResult = await lookupBarcode(barcode, { maxRetries: 1 })

  if (offResult.status === "found") {
    return (
      <OffProductPage product={offResult.product} barcode={barcode}>
        <Suspense fallback={<RelatedProductsSkeleton />}>
          <RelatedProductsSection product={offResult.product} />
        </Suspense>
      </OffProductPage>
    )
  }

  if (offResult.status === "error") {
    console.warn(`[barcode] OFF lookup failed for ${barcode}: ${offResult.reason}`)

    return (
      <div className="flex w-full grow flex-col items-center justify-center">
        <HeroGridPattern
          withGradient
          variant="grid"
          className="mask-[linear-gradient(to_bottom_right,rgba(255,255,255,0.5),transparent_100%)] md:mask-[linear-gradient(to_bottom_right,rgba(255,255,255,0.8),transparent_60%)]"
        />

        <div className="flex w-full flex-col items-center justify-center gap-5 px-4">
          <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
            <WifiOffIcon className="text-muted-foreground h-6 w-6" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Lookup unavailable</h1>
            <p className="text-muted-foreground max-w-sm text-center text-sm">
              Barcode <span className="font-mono font-medium">{barcode}</span> is not in our tracked stores, and the
              external database is temporarily unreachable.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button asChild>
              <a href={`/products/barcode/${encodeURIComponent(barcode)}`}>
                <RefreshCwIcon className="h-4 w-4" />
                Try again
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href={`https://world.openfoodfacts.org/product/${barcode}`} target="_blank" rel="noopener noreferrer">
                <OpenFoodFactsIcon className="h-4 w-4" />
                Open Food Facts
                <ExternalLinkIcon className="h-3 w-3" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex w-full grow flex-col items-center justify-center">
      <HeroGridPattern
        withGradient
        variant="grid"
        className="mask-[linear-gradient(to_bottom_right,rgba(255,255,255,0.5),transparent_100%)] md:mask-[linear-gradient(to_bottom_right,rgba(255,255,255,0.8),transparent_60%)]"
      />

      <div className="flex w-full flex-col items-center justify-center gap-5 px-4">
        <Barcode value={barcode} height={50} width={2} />
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Product not found</h1>
          <p className="text-muted-foreground max-w-sm text-center text-sm">
            Barcode <span className="font-mono font-medium">{barcode}</span> does not match any product in our tracked
            stores.
          </p>

          <p className="text-muted-foreground mt-1 max-w-sm text-center text-sm">
            We also searched on{" "}
            <span className="inline-flex items-center gap-1 font-bold">
              <OpenFoodFactsIcon className="inline h-4 w-4" /> Open Food Facts
            </span>
            . It may be a non-food item, a regional product, or a newly released barcode.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button asChild>
            <Link href="/products" prefetch={false}>
              <SearchIcon className="h-4 w-4" />
              Search our products
            </Link>
          </Button>
          <Button asChild variant="outline">
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(barcode + " barcode product")}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLinkIcon className="h-4 w-4" />
              Search on Google
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Streamed related products (nested Suspense) ────────────────────

async function RelatedProductsSection({ product }: { product: OffProduct }) {
  const primaryBrand = product.brands?.split(",")[0]?.trim() || null
  const { data: trackedRelated } = await findRelatedByOffProduct({
    brand: primaryBrand,
    productName: product.productName,
    categories: product.categories,
    categoriesTags: product.categoriesTags,
  })

  if (!trackedRelated || trackedRelated.length === 0) return null

  return (
    <section>
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
        <StoreIcon className="h-5 w-5" />
        Similar products in our stores
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {trackedRelated.map((sp) => (
          <StoreProductCard key={sp.id} sp={sp} />
        ))}
      </div>
    </section>
  )
}

function RelatedProductsSkeleton() {
  return (
    <section>
      <div className="mb-4 flex items-center gap-2">
        <Skeleton className="h-5 w-5 rounded" />
        <Skeleton className="h-6 w-64" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="aspect-8/7 w-full rounded-md" />
            <Skeleton className="h-4 w-16 rounded-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-5 w-12" />
          </div>
        ))}
      </div>
    </section>
  )
}
