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

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { BackButton } from "@/components/ui/combo/back-button"
import { Barcode } from "@/components/ui/combo/barcode"
import { HeroGridPattern } from "@/components/home/HeroGridPattern"
import { BarcodeCompare } from "@/components/products/BarcodeCompare"
import { OffProductCard } from "@/components/products/OffProductCard"
import { StoreProductCard } from "@/components/products/StoreProductCard"

import {
  HomeIcon,
  SearchIcon,
  ExternalLinkIcon,
  WifiOffIcon,
  RefreshCwIcon,
  StoreIcon,
  Loader2Icon,
} from "lucide-react"
import { OffIcon } from "@/components/icons/OffIcon"

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
    let brandProducts: StoreProduct[] = []
    if (primaryBrand) {
      const { data } = await storeProductQueries.getByBrand(primaryBrand)
      brandProducts = data
    }

    return (
      <div className="flex w-full grow flex-col items-center justify-center">
        <HeroGridPattern
          withGradient
          variant="grid"
          className="mask-[linear-gradient(to_bottom_right,rgba(255,255,255,0.5),transparent_100%)] md:mask-[linear-gradient(to_bottom_right,rgba(255,255,255,0.8),transparent_60%)]"
        />

        <div className="flex w-full flex-col items-center justify-center gap-6 px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Product identified</h1>
            <p className="text-muted-foreground mt-1.5 max-w-sm text-center">
              We found this product externally but it&apos;s not available in our tracked stores yet.
            </p>
          </div>

          <OffProductCard product={offResult.product} barcode={barcode} />

          <div className="flex flex-wrap items-center justify-center gap-2">
            <BackButton />
            <Button asChild variant="outline">
              <Link href="/products" prefetch={false}>
                <SearchIcon className="h-4 w-4" />
                Browse products
              </Link>
            </Button>
            <Button asChild variant="outline">
              <a href={`https://world.openfoodfacts.org/product/${barcode}`} target="_blank" rel="noopener noreferrer">
                <OffIcon className="h-4 w-4" />
                View on Open Food Facts
                <ExternalLinkIcon className="h-3 w-3" />
              </a>
            </Button>
          </div>

          {brandProducts.length > 0 && (
            <div className="mt-4 w-full max-w-5xl">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <StoreIcon className="h-5 w-5" />
                Products from {primaryBrand} in our stores
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {brandProducts.map((sp) => (
                  <StoreProductCard key={sp.id} sp={sp} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
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
            <BackButton />
            <Button asChild variant="outline">
              <a href={`https://world.openfoodfacts.org/product/${barcode}`} target="_blank" rel="noopener noreferrer">
                <OffIcon className="h-4 w-4" />
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

  // "not_found": barcode genuinely not in OFF either
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
          We couldn&apos;t find any product with barcode <span className="font-mono font-medium">{barcode}</span> in
          our stores or external databases.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <BackButton />
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
    <div className="flex w-full grow flex-col items-center justify-center">
      <HeroGridPattern
        withGradient
        variant="grid"
        className="mask-[linear-gradient(to_bottom_right,rgba(255,255,255,0.5),transparent_100%)] md:mask-[linear-gradient(to_bottom_right,rgba(255,255,255,0.8),transparent_60%)]"
      />

      <div className="flex w-full flex-col items-center justify-center gap-6 px-4">
        <Loader2Icon className="text-primary h-8 w-8 animate-spin" />
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Not found in our stores</h1>
          <p className="text-muted-foreground mt-1.5 flex max-w-sm flex-wrap items-center justify-center gap-1 text-center">
            Barcode <span className="font-mono font-medium">{barcode}</span> isn&apos;t in our database. Checking
            <OffIcon className="inline h-4 w-4" />
            Open Food Facts. This can take a few seconds.
          </p>
        </div>

        <div className="border-border/60 bg-card w-full max-w-lg rounded-xl border p-6 shadow-sm">
          <div className="mb-4 flex items-start gap-3">
            <Skeleton className="h-16 w-16 shrink-0 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
          <div className="mb-4 flex gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <div className="flex flex-wrap gap-1.5">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-28 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </div>
          <div className="mt-4 flex justify-center">
            <Skeleton className="h-10 w-48" />
          </div>
        </div>
      </div>
    </div>
  )
}
