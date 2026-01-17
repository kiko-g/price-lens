import { Metadata } from "next"
import { notFound } from "next/navigation"

import { StoreProductPage } from "@/components/StoreProductPage"
import { storeProductQueries } from "@/lib/db/queries/products"
import { createClient } from "@/lib/supabase/server"
import { extractProductIdFromSlug, generateProductSlug } from "@/lib/utils"
import { siteConfig } from "@/lib/config"

interface PageProps {
  params: Promise<{ id: string }>
}

async function getProduct(idParam: string) {
  const productId = extractProductIdFromSlug(idParam)
  if (!productId) return null

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: storeProduct } = await storeProductQueries.getById(String(productId), user?.id || null)

  return storeProduct
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id: idParam } = await params
  const storeProduct = await getProduct(idParam)

  if (!storeProduct) {
    return {
      title: "Product Not Found",
      description: "The requested product could not be found.",
    }
  }

  // Generate canonical URL with full slug for SEO
  const canonicalSlug = generateProductSlug(storeProduct)
  const canonicalUrl = `${siteConfig.url}/products/${storeProduct.id}-${canonicalSlug}`

  const imageUrl = storeProduct.image ? new URL(storeProduct.image) : null
  if (imageUrl) {
    const p = imageUrl.searchParams
    const fieldsToDelete = ["sm", "w", "h", "sw", "sh"]
    fieldsToDelete.forEach((k) => p.delete(k))
    p.set("sw", "1200")
    p.set("sh", "630")
    p.set("sm", "fit")
    p.set("fit", "crop")
  }

  const title = `${storeProduct.name} - ${storeProduct.brand || "Unknown Brand"}`
  const description = `${storeProduct.name}${storeProduct.pack ? ` - ${storeProduct.pack}` : ""}${storeProduct.price ? ` - ${storeProduct.price}€` : ""}`

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
      images: imageUrl ? [{ url: imageUrl.toString() }] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: imageUrl ? [imageUrl.toString()] : [],
    },
  }
}

export default async function ProductPage({ params }: PageProps) {
  const { id: idParam } = await params
  const storeProduct = await getProduct(idParam)

  if (!storeProduct) {
    notFound()
  }

  return (
    <div className="flex w-full flex-col items-center justify-start gap-4 p-4">
      <StoreProductPage sp={storeProduct} />
    </div>
  )
}
