import { Suspense } from "react"
import { Metadata } from "next"
import { redirect } from "next/navigation"
import Link from "next/link"

import type { StoreProduct, Price } from "@/types"
import { siteConfig } from "@/lib/config"
import { createClient } from "@/lib/supabase/server"
import { storeProductQueries } from "@/lib/queries/products"
import { priceQueries } from "@/lib/queries/prices"
import { generateProductPath } from "@/lib/business/product"
import { lookupBarcode } from "@/lib/canonical/open-food-facts"
import { findRelatedByOffProduct } from "@/lib/queries/product-matching"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { BackButton } from "@/components/ui/combo/back-button"
import { Barcode } from "@/components/ui/combo/barcode"
import { HeroGridPattern } from "@/components/home/HeroGridPattern"
import { BarcodeCompare } from "@/components/products/BarcodeCompare"
import { OffProductPage } from "@/components/products/OffProductPage"

import { HomeIcon, SearchIcon, ExternalLinkIcon, WifiOffIcon, RefreshCwIcon, Loader2Icon } from "lucide-react"
import { OpenFoodFactsIcon } from "@/components/icons/OpenFoodFactsIcon"

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
    return {
      title: `Product Lookup - ${barcode}`,
      description: `Looking up ${barcode} on ${siteConfig.name}.`,
    }
  }

  if (products.length === 1) {
    return {
      title: "Redirecting...",
      description: "Redirecting to product page.",
    }
  }

  const firstProduct = products[0]
  const storeCount = new Set(products.map((p) => p.origin_id)).size

  return {
    title: `Compare Prices - ${firstProduct.name || barcode}`,
    description: `Compare prices for ${firstProduct.name || "this product"} across ${storeCount} stores on ${siteConfig.name}.`,
    openGraph: {
      title: `Compare Prices - ${firstProduct.name || barcode}`,
      description: `Compare prices across ${storeCount} stores.`,
      type: "website",
    },
  }
}

export default async function ProductByBarcodePage({ params }: PageProps) {
  const { barcode } = await params
  const products = await getProductsByBarcode(barcode)

  // Single product — redirect to its detail page
  if (products.length === 1) {
    redirect(generateProductPath(products[0]))
  }

  // Multiple products — render comparison inline
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

  // Not in our DB — try Open Food Facts with streaming
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
    const primaryBrand = offResult.product.brands?.split(",")[0]?.trim() || null
    const { data: trackedRelated } = await findRelatedByOffProduct({
      brand: primaryBrand,
      productName: offResult.product.productName,
      categories: offResult.product.categories,
    })

    return <OffProductPage product={offResult.product} barcode={barcode} trackedProducts={trackedRelated ?? []} />
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

        <div className="flex w-full flex-col items-center justify-center gap-4 px-4">
          <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
            <WifiOffIcon className="text-muted-foreground h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Lookup unavailable</h1>
          <p className="text-muted-foreground max-w-sm text-center">
            We couldn&apos;t find barcode <span className="font-mono font-medium">{barcode}</span> in our stores, and
            the external product database is temporarily unreachable.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button asChild variant="outline">
              <a href={`/products/barcode/${encodeURIComponent(barcode)}`}>
                <RefreshCwIcon className="h-4 w-4" />
                Try again
              </a>
            </Button>

            <Button asChild variant="outline">
              <a href={`https://world.openfoodfacts.org/product/${barcode}`} target="_blank" rel="noopener noreferrer">
                <OpenFoodFactsIcon className="h-4 w-4" />
                Check Open Food Facts
                <ExternalLinkIcon className="h-3 w-3" />
              </a>
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

  return (
    <div className="flex w-full grow flex-col items-center justify-center">
      <HeroGridPattern
        withGradient
        variant="grid"
        className="mask-[linear-gradient(to_bottom_right,rgba(255,255,255,0.5),transparent_100%)] md:mask-[linear-gradient(to_bottom_right,rgba(255,255,255,0.8),transparent_60%)]"
      />

      <div className="flex w-full flex-col items-center justify-center gap-4 px-4">
        <Barcode value={barcode} height={50} width={2} className="mb-2" />
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Product not found</h1>
        <p className="text-muted-foreground max-w-sm text-center">
          We couldn&apos;t find any product with barcode <span className="font-mono font-medium">{barcode}</span> in our
          stores or external databases.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button asChild variant="outline">
            <Link href="/products" prefetch={false}>
              <SearchIcon className="h-4 w-4" />
              Browse products
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
          <Button asChild>
            <Link href="/" prefetch={false}>
              <HomeIcon className="h-4 w-4" />
              Go home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Suspense fallback ──────────────────────────────────────────────

function OffLookupSkeleton({ barcode }: { barcode: string }) {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-4 md:py-6">
      {/* Breadcrumb skeleton */}
      <div className="mb-3 flex items-center gap-1">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-3 w-3" />
        <Skeleton className="h-4 w-24" />
      </div>

      {/* Loading indicator */}
      <div className="mb-6 flex items-center gap-3">
        <Loader2Icon className="text-primary h-5 w-5 animate-spin" />
        <p className="text-muted-foreground flex flex-wrap items-center gap-1 text-sm">
          Looking up <span className="font-mono font-medium">{barcode}</span> on
          <OpenFoodFactsIcon className="inline h-4 w-4" />
          Open Food Facts&hellip;
        </p>
      </div>

      {/* Hero skeleton matching new layout */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[280px_1fr] md:gap-8">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="aspect-square w-full max-w-[280px] rounded-xl" />
          <Skeleton className="hidden h-10 w-48 md:block" />
        </div>

        <div className="flex flex-col gap-3">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-8 w-3/4" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-28 rounded-full" />
          </div>
          <Skeleton className="h-16 w-48 rounded-xl" />
          <div className="flex gap-1.5">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-28 rounded-full" />
          </div>
          <Skeleton className="h-4 w-40" />
        </div>
      </div>

      {/* Nutrition skeleton */}
      <div className="mt-8">
        <Skeleton className="mb-3 h-6 w-24" />
        <div className="space-y-0 overflow-hidden rounded-lg border">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between border-b px-4 py-2.5 last:border-b-0">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
