import "server-only"

import { createClient } from "@/lib/supabase/server"
import { generateProductPath } from "@/lib/business/product"
import type { StoreProduct } from "@/types"

export const HERO_PRODUCT_IDS = [
  // CONTINENTE
  16258, // Monster White (Continente)
  5913, // Starbucks Latte (Continente)
  4455, // Chocapic cereal (Continente)
  20406, // Yopro Danone (Continente)
  18583, // Buondi caps decaf (Continente)
  279091, // Milka 90g plain (Continente)
  3329, // Oakberry Açaí 473ml (Continente)
  // AUCHAN
  87415, // Manteiga Mimosa Sal (Auchan)
  97842, // Coca Cola Zero 1L (Auchan)
  95119, // Ice Tea Lipton Pessego Zero 2L (Auchan)
  95008, // Nectar Compal Classico Tutti Frutti 1L (Auchan)
  79981, // Prozis Peanut Butter (Auchan)
  95042, // Compal pera 1l (Auchan)
  // PINGO DOCE
  2266777, // OIKOS Grego Pessego (Pingo Doce)
  2267052, // Haagen dazs chocolate belga (Pingo Doce)
  165722, // Ruffles Presunto (Pingo Doce)
  166493, // Powerade Blue 500ml (Pingo Doce)
  165297, // Queijo Limiano Flamengo low fat (Pingo Doce)
  168315, // Cheerios Aveia Integral 300g (Pingo Doce)
]

export type HeroProduct = {
  id: number
  name: string
  image: string
  href: string
  originId: number
  price: number | null
  priceRecommended: number | null
  discount: number | null
}

export async function getHeroProducts(): Promise<HeroProduct[]> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("store_products")
      .select("id, name, image, origin_id, brand, price, price_recommended, discount, available")
      .in("id", HERO_PRODUCT_IDS)
      .not("image", "is", null)
      .eq("available", true)
      .not("price", "is", null)
      .gt("price", 0)

    if (error || !data) return []

    return data
      .filter((p): p is typeof p & { image: string } => !!p.image && !!p.name)
      .map((p) => ({
        id: p.id,
        name: p.name ?? "",
        image: p.image,
        href: generateProductPath(p as StoreProduct),
        originId: p.origin_id ?? 0,
        price: p.price ?? null,
        priceRecommended: p.price_recommended ?? null,
        discount: p.discount ?? null,
      }))
  } catch {
    return []
  }
}
