import type { Product } from "@/types"
import { NextRequest, NextResponse } from "next/server"
import { getAllProductUrls } from "@/lib/supabase/actions"
import { batchUrls, createOrUpdateProducts, processBatch } from "@/lib/scraper"

export async function POST() {
  try {
    const urls: string[] = await getAllProductUrls()
    const batches = batchUrls(urls, 500)

    for (const batch of batches) {
      const batchProducts = await processBatch(batch)
      const validProducts = batchProducts.filter((p): p is Product => "url" in p)
      await createOrUpdateProducts(validProducts)
    }
    return NextResponse.json({ message: "Crawling started" }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
