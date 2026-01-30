import { Metadata } from "next"
import { notFound } from "next/navigation"

import { STORE_NAMES } from "@/types/business"
import { siteConfig } from "@/lib/config"
import { createClient } from "@/lib/supabase/server"
import { storeProductQueries } from "@/lib/queries/products"
import { generateProductSlug } from "@/lib/business/product"

import { StoreProductPage } from "@/components/products/StoreProductPage"

interface PageProps {
  params: Promise<{ barcode: string }>
}

async function getProductByBarcode(barcode: string) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: storeProduct } = await storeProductQueries.getByBarcode(barcode, user?.id || null)

  return storeProduct
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { barcode } = await params
  const storeProduct = await getProductByBarcode(barcode)

  if (!storeProduct) {
    return {
      title: "Product Not Found",
      description: "No product found with this barcode.",
    }
  }

  // Generate canonical URL with full slug for SEO
  const canonicalSlug = generateProductSlug(storeProduct)
  const canonicalUrl = `${siteConfig.url}/products/${storeProduct.id}-${canonicalSlug}`

  // Build OG title and description
  const storeName = storeProduct.origin_id ? STORE_NAMES[storeProduct.origin_id] : null
  const brandText = storeProduct.brand ? `${storeProduct.brand} ` : ""
  const title = `${brandText}${storeProduct.name}${storeName ? ` @ ${storeName}` : ""}`

  // Build rich description
  const discountPercentage = storeProduct.discount ? Math.round(storeProduct.discount * 1000) / 10 : null
  const descParts: string[] = []
  if (storeProduct.price) {
    const priceText = `${storeProduct.price.toFixed(2)}€${discountPercentage ? ` (-${discountPercentage}%)` : ""}`
    descParts.push(priceText)
  }
  if (storeProduct.pack) descParts.push(storeProduct.pack)
  if (storeProduct.category) descParts.push(storeProduct.category)
  const description = descParts.length > 0 ? descParts.join(" · ") : `View product details on ${siteConfig.name}`

  // Use product-specific OG image route with product image, prices, etc.
  const ogImageUrl = `${siteConfig.url}/products/${storeProduct.id}/og`

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      images: [{ url: ogImageUrl, width: 1200, height: 630 }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  }
}

export default async function ProductByBarcodePage({ params }: PageProps) {
  const { barcode } = await params
  const storeProduct = await getProductByBarcode(barcode)

  if (!storeProduct) {
    notFound()
  }

  return (
    <div className="flex w-full flex-col items-center justify-start gap-4 p-4">
      <StoreProductPage sp={storeProduct} />
    </div>
  )
}
