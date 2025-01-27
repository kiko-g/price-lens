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
    const product = await continenteProductPageScraper(url)
    if (Object.keys(product).length === 0) {
      return NextResponse.json({ error: "Invalid product page URL provided" }, { status: 400 })
    }
    const validProduct = product as Product
    await createOrUpdateProduct(validProduct)
    return NextResponse.json({ ...validProduct }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
