import { NextResponse } from "next/server"

import { getBrand } from "@/lib/brand/server"
import { getBrandText } from "@/lib/brand/brand"
import { defaultLocale } from "@/i18n/config"

export const dynamic = "force-dynamic"

/**
 * PWA manifest built from the Brand Control Center. Served at the legacy `/site.webmanifest` URL so
 * `<link rel="manifest">`, the Android TWA config and installed PWAs keep resolving.
 */
export async function GET() {
  const brand = await getBrand()

  const manifest = {
    name: brand.displayName,
    short_name: brand.shortName,
    description: getBrandText(brand.metaDescription, defaultLocale),
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    theme_color: "#09090b",
    background_color: "#09090b",
    categories: ["shopping", "finance", "food"],
    lang: defaultLocale,
    prefer_related_applications: false,
    icons: [
      { src: "/icons/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/android-chrome-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "Explorar produtos",
        short_name: "Produtos",
        url: "/products",
        icons: [{ src: "/icons/android-chrome-192x192.png", sizes: "192x192" }],
      },
      {
        name: "Os meus favoritos",
        short_name: "Favoritos",
        url: "/favorites",
        icons: [{ src: "/icons/android-chrome-192x192.png", sizes: "192x192" }],
      },
    ],
  }

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=3600",
    },
  })
}
