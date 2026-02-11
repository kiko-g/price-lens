import { Metadata } from "next"
import { redirect } from "next/navigation"
import Link from "next/link"

import { siteConfig } from "@/lib/config"
import { createClient } from "@/lib/supabase/server"
import { storeProductQueries } from "@/lib/queries/products"
import { generateProductPath } from "@/lib/business/product"

import { Button } from "@/components/ui/button"
import { BackButton } from "@/components/ui/combo/back-button"
import { Barcode } from "@/components/ui/combo/barcode"
import { HeroGridPattern } from "@/components/home/HeroGridPattern"

import { HomeIcon, SearchIcon } from "lucide-react"

interface PageProps {
  params: Promise<{ barcode: string }>
}

async function getProductsByBarcode(barcode: string) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: products } = await storeProductQueries.getAllByBarcode(barcode, user?.id || null)

  return products ?? []
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { barcode } = await params
  const products = await getProductsByBarcode(barcode)

  if (products.length === 0) {
    return {
      title: "Product Not Found",
      description: `No products found with barcode ${barcode}.`,
    }
  }

  if (products.length === 1) {
    return {
      title: "Redirecting...",
      description: "Redirecting to product page.",
    }
  }

  // Multiple products - compare page metadata
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

  if (products.length === 0) {
    return (
      <div className="flex w-full grow flex-col items-center justify-center">
        <HeroGridPattern
          withGradient
          variant="grid"
          className="mask-[linear-gradient(to_bottom_right,rgba(255,255,255,0.5),transparent_100%)] md:mask-[linear-gradient(to_bottom_right,rgba(255,255,255,0.8),transparent_60%)]"
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

  // Single product - redirect to product page
  if (products.length === 1) {
    const productPath = generateProductPath(products[0])
    redirect(productPath)
  }

  // Multiple products - redirect to compare page
  redirect(`/compare?barcode=${encodeURIComponent(barcode)}`)
}
