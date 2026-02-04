import { Metadata } from "next"
import { redirect } from "next/navigation"
import Link from "next/link"

import type { StoreProduct, Price } from "@/types"
import { siteConfig } from "@/lib/config"
import { createClient } from "@/lib/supabase/server"
import { storeProductQueries } from "@/lib/queries/products"
import { priceQueries } from "@/lib/queries/prices"

import { Button } from "@/components/ui/button"
import { BackButton } from "@/components/ui/combo/back-button"
import { Barcode } from "@/components/ui/combo/barcode"
import { HeroGridPattern } from "@/components/home/HeroGridPattern"
import { BarcodeCompare } from "@/components/products/BarcodeCompare"

import { HomeIcon, SearchIcon } from "lucide-react"

interface PageProps {
  searchParams: Promise<{ barcode?: string }>
}

export interface ProductWithPrices {
  product: StoreProduct
  prices: Price[]
}

async function getProductsByBarcode(barcode: string) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: products } = await storeProductQueries.getAllByBarcode(barcode, user?.id || null)

  return products ?? []
}

async function getProductsWithPrices(products: StoreProduct[]): Promise<ProductWithPrices[]> {
  // Fetch price history for all products in parallel
  const pricePromises = products.map(async (product) => {
    if (!product.id) return { product, prices: [] }
    const prices = await priceQueries.getPricePointsPerIndividualProduct(product.id)
    return { product, prices: prices ?? [] }
  })

  return Promise.all(pricePromises)
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { barcode } = await searchParams

  if (!barcode) {
    return {
      title: "Compare Prices",
      description: `Compare product prices across supermarkets on ${siteConfig.name}.`,
    }
  }

  const products = await getProductsByBarcode(barcode)

  if (products.length === 0) {
    return {
      title: "No Products Found",
      description: `No products found with barcode ${barcode}.`,
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

export default async function ComparePage({ searchParams }: PageProps) {
  const { barcode } = await searchParams

  // No barcode provided - redirect to products page
  if (!barcode) {
    redirect("/products")
  }

  const products = await getProductsByBarcode(barcode)

  // No products found - show friendly not-found page
  if (products.length === 0) {
    return (
      <div className="flex w-full grow flex-col items-center justify-center">
        <HeroGridPattern
          variant="grid"
          className="mask-[linear-gradient(to_top_left,rgba(255,255,255,0.4))]"
          width={16}
          height={16}
        />
        <div className="flex w-full flex-col items-center justify-center gap-4 px-4">
          <Barcode value={barcode} height={50} width={2} className="mb-2" />
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">No products found</h1>
          <p className="text-muted-foreground max-w-sm text-center">
            We couldn&apos;t find any products with barcode <span className="font-mono font-medium">{barcode}</span>.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <BackButton />
            <Button asChild variant="outline">
              <Link href="/products" prefetch={false}>
                <SearchIcon className="h-4 w-4" />
                Browse products
              </Link>
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

  // Fetch price history for all products in parallel
  const productsWithPrices = await getProductsWithPrices(products)

  return (
    <div className="flex w-full flex-col items-center justify-start p-4">
      <BarcodeCompare products={products} productsWithPrices={productsWithPrices} barcode={barcode} />
    </div>
  )
}
