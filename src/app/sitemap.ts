import type { MetadataRoute } from "next"
import { createClient } from "@/lib/supabase/server"
import { siteConfig } from "@/lib/config"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteConfig.url, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${siteConfig.url}/products`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${siteConfig.url}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteConfig.url}/favorites`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${siteConfig.url}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteConfig.url}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ]

  const productRoutes = await getProductRoutes()

  return [...staticRoutes, ...productRoutes]
}

async function getProductRoutes(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient()
  const routes: MetadataRoute.Sitemap = []
  const pageSize = 1000
  let from = 0

  while (true) {
    const { data, error } = await supabase
      .from("store_products")
      .select("id, updated_at")
      .range(from, from + pageSize - 1)
      .order("id")

    if (error || !data?.length) break

    for (const product of data) {
      routes.push({
        url: `${siteConfig.url}/products/${product.id}`,
        lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
        changeFrequency: "daily",
        priority: 0.7,
      })
    }

    if (data.length < pageSize) break
    from += pageSize
  }

  return routes
}
