import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { continenteProductPageScraper } from "@/lib/scraper"
import { createOrUpdateProduct } from "@/lib/supabase/actions"
import type { Product } from "@/types"

export async function GET(req: NextRequest) {
  const supabase = createClient()

  try {
    let index = 0

    while (true) {
      await new Promise((resolve) => setTimeout(resolve, 200))
      const { data, error } = await supabase.from("products").select("id, url").range(index, index).maybeSingle()

      if (error) throw new Error(error.message)

      if (!data) return NextResponse.json({ message: "All products processed." })

      const productUrl = data.url
      const productData: Product | {} = await continenteProductPageScraper(productUrl)

      if (Object.keys(productData).length === 0) {
        index++
        console.info(`Skipping product ${index} because it's not valid`)
        continue
      }

      await createOrUpdateProduct(productData as Product)

      index++
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
