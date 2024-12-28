import type { Product } from "@/types"
import { NextRequest, NextResponse } from "next/server"

import { continenteProductPageScraper } from "@/lib/scraper"
import { createOrUpdateProduct } from "@/lib/supabase/actions"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const url = searchParams.get("url")

  if (!url) {
    return NextResponse.json({ error: "Invalid product page URL provided" }, { status: 400 })
  }

  try {
    const product: Product = await continenteProductPageScraper(url)
    await createOrUpdateProduct(product)
    return NextResponse.json({ ...product }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
